/**
 * Anbindung an die amtliche Spritpreis-Datenbank von E-Control (Österreich).
 *
 * Kein API-Schlüssel nötig, kein Konto, keine Kosten.
 * Doku: https://api.e-control.at/sprit/1.0/doc
 *
 * Zwei Eigenheiten dieser Schnittstelle prägen diese Datei:
 *
 *  1. Pro Anfrage kommen gesetzlich nur die FÜNF billigsten Tankstellen zurück.
 *     Fragt man nur den eigenen Standort ab, sieht man fünf Stück und sonst
 *     nichts. Darum fragen wir ein Raster von Punkten ab (siehe rasterPunkte in
 *     lib/geo.ts) und werfen Doppelte über die ID raus.
 *
 *  2. Der Server mag keine Anfrage-Salven. Darum laufen die Rasterpunkte
 *     nacheinander mit kurzer Pause, und Ergebnisse werden zwischengespeichert.
 */

import { luftlinieKm, rasterPunkte } from '@/lib/geo';
import type { Kraftstoff, Punkt, Tankstelle } from '@/lib/types';
import { istMock, mockRohdaten } from './mock';

const BASIS_URL = 'https://api.e-control.at/sprit/1.0';

/** Pause zwischen zwei Rasterabfragen, damit wir den Server nicht überrennen. */
const PAUSE_MS = 150;

/** So lange gelten geladene Preise als frisch. */
const CACHE_DAUER_MS = 5 * 60 * 1000;

const schlafen = (ms: number) => new Promise((fertig) => setTimeout(fertig, ms));

// ---------------------------------------------------------------------------
// Übersetzung: E-Control-Format -> unser Format
// ---------------------------------------------------------------------------

/**
 * Kleine Helfer, die aus einem unbekannt geformten Objekt vorsichtig einen
 * Wert ziehen. Wir können das echte Antwortformat hier nicht live prüfen,
 * darum akzeptieren diese Funktionen mehrere plausible Schreibweisen und geben
 * lieber `undefined` zurück, als die ganze App abstürzen zu lassen.
 */
function alsZahl(wert: unknown): number | undefined {
  if (typeof wert === 'number' && Number.isFinite(wert)) return wert;
  if (typeof wert === 'string') {
    // E-Control liefert Zahlen normalerweise als Zahl; manche Felder aber als
    // Text, teils mit Komma statt Punkt.
    const zahl = Number(wert.replace(',', '.'));
    if (Number.isFinite(zahl)) return zahl;
  }
  return undefined;
}

function alsText(wert: unknown): string | undefined {
  if (typeof wert === 'string' && wert.trim() !== '') return wert.trim();
  if (typeof wert === 'number') return String(wert);
  return undefined;
}

function feld(objekt: unknown, ...namen: string[]): unknown {
  if (typeof objekt !== 'object' || objekt === null) return undefined;
  const record = objekt as Record<string, unknown>;
  for (const name of namen) {
    if (record[name] !== undefined && record[name] !== null) return record[name];
  }
  return undefined;
}

/** Kraftstoff-Kürzel vereinheitlichen ("die", "Diesel" -> "DIE"). */
function alsKraftstoff(wert: unknown): Kraftstoff | undefined {
  const text = alsText(wert)?.toUpperCase();
  if (!text) return undefined;
  if (text.startsWith('DIE')) return 'DIE';
  if (text.startsWith('SUP')) return 'SUP';
  if (text.startsWith('GAS') || text === 'LPG') return 'GAS';
  return undefined;
}

/**
 * ★ Die einzige Stelle, an der E-Control-Feldnamen vorkommen.
 *
 * Weicht das echte Format ab, wird es hier angepasst — nicht verstreut über die
 * App. Mit `npm run probe` schreibt man sich eine echte Antwort in
 * src/fixtures/ und vergleicht.
 *
 * Gibt `null` zurück, wenn der Eintrag unbrauchbar ist (keine ID, keine
 * Koordinaten). Solche Einträge überspringen wir stillschweigend.
 */
export function mapStation(roh: unknown): Tankstelle | null {
  const id = alsText(feld(roh, 'id', 'stationId'));
  if (!id) return null;

  // Adresse und Koordinaten liegen normalerweise unter "location", könnten
  // aber auch flach im Objekt stehen.
  const ort = feld(roh, 'location') ?? roh;

  const lat = alsZahl(feld(ort, 'latitude', 'lat'));
  const lon = alsZahl(feld(ort, 'longitude', 'lng', 'lon'));
  if (lat === undefined || lon === undefined) return null;

  // Preise kommen als Liste [{ amount, fuelType, label }, ...].
  const preise: Partial<Record<Kraftstoff, number>> = {};
  const preisListe = feld(roh, 'prices', 'preise');
  if (Array.isArray(preisListe)) {
    for (const eintrag of preisListe) {
      const art = alsKraftstoff(feld(eintrag, 'fuelType', 'type'));
      const betrag = alsZahl(feld(eintrag, 'amount', 'price'));
      if (art && betrag !== undefined && betrag > 0) preise[art] = betrag;
    }
  }

  // "open" fehlt in manchen Antworten. Fehlt es, gehen wir von offen aus —
  // wir fragen ohnehin mit includeClosed=false an.
  const offenRoh = feld(roh, 'open', 'offen');

  return {
    id,
    name: alsText(feld(roh, 'name')) ?? 'Tankstelle',
    marke: alsText(feld(roh, 'brand', 'marke')),
    lat,
    lon,
    adresse: alsText(feld(ort, 'address', 'adresse')) ?? '',
    plz: alsText(feld(ort, 'postalCode', 'plz')) ?? '',
    ort: alsText(feld(ort, 'city', 'ort')) ?? '',
    offen: typeof offenRoh === 'boolean' ? offenRoh : true,
    preise,
    standAktualisiert: alsText(feld(roh, 'lastUpdate', 'observedAt', 'timestamp')),
  };
}

// ---------------------------------------------------------------------------
// Zwischenspeicher
// ---------------------------------------------------------------------------

type CacheEintrag = { zeit: number; stationen: Tankstelle[] };
const cache = new Map<string, CacheEintrag>();

/** Nur für Tests: Zwischenspeicher leeren. */
export function cacheLeeren() {
  cache.clear();
}

function cacheSchluessel(zentrum: Punkt, radiusKm: number, kraftstoff: Kraftstoff) {
  // Auf ~100 m runden, damit ein leichtes GPS-Zittern nicht jedes Mal neu lädt.
  return [zentrum.lat.toFixed(3), zentrum.lon.toFixed(3), radiusKm, kraftstoff].join('|');
}

// ---------------------------------------------------------------------------
// Laden
// ---------------------------------------------------------------------------

async function ladeEinenPunkt(
  punkt: Punkt,
  kraftstoff: Kraftstoff,
  signal?: AbortSignal,
): Promise<Tankstelle[]> {
  const url =
    `${BASIS_URL}/search/gas-stations/by-address` +
    `?latitude=${punkt.lat.toFixed(6)}` +
    `&longitude=${punkt.lon.toFixed(6)}` +
    `&fuelType=${kraftstoff}` +
    `&includeClosed=false`;

  const antwort = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!antwort.ok) {
    throw new Error(`E-Control antwortete mit ${antwort.status}`);
  }

  const daten: unknown = await antwort.json();
  if (!Array.isArray(daten)) return [];

  return daten
    .map(mapStation)
    .filter((station): station is Tankstelle => station !== null);
}

export type LadeOptionen = {
  zentrum: Punkt;
  radiusKm: number;
  kraftstoff: Kraftstoff;
  signal?: AbortSignal;
};

/**
 * Lädt Tankstellen rund um einen Punkt.
 *
 * Fragt mehrere Rasterpunkte ab, führt die Ergebnisse zusammen und liefert
 * jede Tankstelle genau einmal. Schlägt ein einzelner Rasterpunkt fehl, wird er
 * übersprungen — solange irgendein Punkt Daten liefert, bekommt der Nutzer ein
 * Ergebnis. Erst wenn alle scheitern, fliegt der Fehler nach oben.
 */
export async function ladeTankstellen({
  zentrum,
  radiusKm,
  kraftstoff,
  signal,
}: LadeOptionen): Promise<Tankstelle[]> {
  // Testbetrieb: dieselbe Übersetzung, nur eben auf aufgezeichnete Rohdaten.
  // Der Radius wird nachgebildet, damit sich der Mock wie das Original verhält.
  if (istMock()) {
    return mockRohdaten()
      .map(mapStation)
      .filter((station): station is Tankstelle => station !== null)
      .filter((station) => luftlinieKm(zentrum, station) <= radiusKm);
  }

  const schluessel = cacheSchluessel(zentrum, radiusKm, kraftstoff);
  const gecacht = cache.get(schluessel);
  if (gecacht && Date.now() - gecacht.zeit < CACHE_DAUER_MS) {
    return gecacht.stationen;
  }

  const punkte = rasterPunkte(zentrum, radiusKm);
  const gefunden = new Map<string, Tankstelle>();
  let letzterFehler: unknown = null;
  let erfolge = 0;

  for (const [index, punkt] of punkte.entries()) {
    if (signal?.aborted) break;
    if (index > 0) await schlafen(PAUSE_MS);

    try {
      for (const station of await ladeEinenPunkt(punkt, kraftstoff, signal)) {
        // Erster Treffer gewinnt — dieselbe Tankstelle taucht bei mehreren
        // Rasterpunkten auf, die Daten sind aber identisch.
        if (!gefunden.has(station.id)) gefunden.set(station.id, station);
      }
      erfolge++;
    } catch (fehler) {
      letzterFehler = fehler;
    }
  }

  if (erfolge === 0 && letzterFehler) throw letzterFehler;

  const stationen = [...gefunden.values()];
  cache.set(schluessel, { zeit: Date.now(), stationen });
  return stationen;
}
