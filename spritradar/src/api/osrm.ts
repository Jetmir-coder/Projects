/**
 * Fahrstrecken und Fahrzeiten.
 *
 * Erste Wahl ist OSRM — ein frei nutzbarer Routing-Server auf Basis von
 * OpenStreetMap. Er liefert die echte Straßenstrecke und die echte Fahrzeit.
 *
 * Zweite Wahl ist die Luftlinie mal Umwegfaktor (siehe lib/geo.ts). Der
 * öffentliche OSRM-Server gibt keine Verfügbarkeitsgarantie, und ohne Netz
 * geht er ohnehin nicht. Die App muss trotzdem ein Ergebnis liefern — nur
 * eben sichtbar als Schätzung gekennzeichnet.
 *
 * Wir holen alle Strecken mit EINER Anfrage über den "table"-Dienst, statt für
 * jede Tankstelle einzeln zu fragen. Das ist schneller und schont den Server.
 */

import type { StreckenInfo } from '@/lib/calc';
import { ANNAHME_KMH, luftlinieKm } from '@/lib/geo';
import { geschaetzteStrecke } from '@/lib/geo';
import type { Punkt, Strecke, Tankstelle } from '@/lib/types';
import { istMock, mockRouteFaktor } from './mock';

const BASIS_URL = 'https://router.project-osrm.org';

/** Nach dieser Zeit geben wir auf und schätzen lieber. */
const ZEITLIMIT_MS = 6000;

/** Der öffentliche Server verkraftet nur begrenzt viele Punkte je Anfrage. */
const MAX_PUNKTE = 90;

export type StreckenErgebnis = {
  /** Strecken je Tankstellen-ID. */
  strecken: Map<string, StreckenInfo>;
  /** Fahrt vom Start direkt zum Ziel, ganz ohne Tankstopp. */
  direktZumZiel: Strecke;
  /** true, wenn alles nur geschätzt ist (OSRM war nicht erreichbar). */
  geschaetzt: boolean;
};

const punktZuUrl = (p: Punkt) => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`;

/** Alle Strecken schätzen — der Weg, wenn OSRM nicht will. */
function alleSchaetzen(start: Punkt, ziel: Punkt, stationen: Tankstelle[]): StreckenErgebnis {
  const strecken = new Map<string, StreckenInfo>();

  for (const station of stationen) {
    strecken.set(station.id, {
      vomStart: geschaetzteStrecke(start, station),
      zumZiel: geschaetzteStrecke(station, ziel),
    });
  }

  return {
    strecken,
    direktZumZiel: geschaetzteStrecke(start, ziel),
    geschaetzt: true,
  };
}

/**
 * Erfundene, aber in sich stimmige Strecken für den Testbetrieb.
 *
 * Sie sind bewusst NICHT als "geschätzt" markiert: Im Mock-Betrieb tut die App
 * so, als hätte sie einen funktionierenden Routing-Server — sonst würde sie
 * einen Ausfall melden, den es gar nicht gibt.
 */
function mockStrecken(start: Punkt, ziel: Punkt, stationen: Tankstelle[]): StreckenErgebnis {
  const rechne = (von: Punkt, nach: Punkt): Strecke => {
    const km = luftlinieKm(von, nach) * mockRouteFaktor();
    return { km, minuten: (km / ANNAHME_KMH) * 60, geschaetzt: false };
  };

  const strecken = new Map<string, StreckenInfo>();
  for (const station of stationen) {
    strecken.set(station.id, {
      vomStart: rechne(start, station),
      zumZiel: rechne(station, ziel),
    });
  }

  return { strecken, direktZumZiel: rechne(start, ziel), geschaetzt: false };
}

/**
 * Holt Strecken für alle Tankstellen auf einmal.
 *
 * Ist `ziel` gleich `start`, ist das die klassische Hin- und Rückfahrt.
 * Ist es ein anderer Punkt (z. B. die Arbeit), rechnet die App den Umweg
 * gegenüber der Strecke, die man sowieso fährt.
 *
 * Wirft nie — im Zweifel kommt eine Schätzung zurück.
 */
export async function ladeStrecken(
  start: Punkt,
  ziel: Punkt,
  stationen: Tankstelle[],
  signal?: AbortSignal,
): Promise<StreckenErgebnis> {
  if (stationen.length === 0) {
    return { strecken: new Map(), direktZumZiel: geschaetzteStrecke(start, ziel), geschaetzt: true };
  }

  if (istMock()) return mockStrecken(start, ziel, stationen);

  // Reihenfolge der Punkte: 0 = Start, 1 = Ziel, ab 2 die Tankstellen.
  const verwendet = stationen.slice(0, MAX_PUNKTE - 2);
  const punkte = [start, ziel, ...verwendet];
  const url =
    `${BASIS_URL}/table/v1/driving/${punkte.map(punktZuUrl).join(';')}` +
    `?sources=0;1&annotations=duration,distance`;

  const abbruch = new AbortController();
  const wecker = setTimeout(() => abbruch.abort(), ZEITLIMIT_MS);
  const weiterleiten = () => abbruch.abort();
  signal?.addEventListener('abort', weiterleiten);

  try {
    const antwort = await fetch(url, {
      signal: abbruch.signal,
      headers: { Accept: 'application/json' },
    });
    if (!antwort.ok) return alleSchaetzen(start, ziel, stationen);

    const daten = (await antwort.json()) as {
      code?: string;
      distances?: (number | null)[][];
      durations?: (number | null)[][];
    };

    const { distances, durations } = daten;
    if (daten.code !== 'Ok' || !distances || !durations) {
      return alleSchaetzen(start, ziel, stationen);
    }

    /** Eine Zelle der Matrix in eine Strecke übersetzen. */
    const zelle = (quelle: 0 | 1, spalte: number): Strecke | null => {
      const meter = distances[quelle]?.[spalte];
      const sekunden = durations[quelle]?.[spalte];
      if (typeof meter !== 'number' || typeof sekunden !== 'number') return null;
      return { km: meter / 1000, minuten: sekunden / 60, geschaetzt: false };
    };

    const strecken = new Map<string, StreckenInfo>();

    verwendet.forEach((station, i) => {
      const spalte = i + 2;
      // Zeile 0 = vom Start zur Tankstelle.
      // Zeile 1 = vom Ziel zur Tankstelle. Autofahren ist in beide Richtungen
      // fast gleich lang, darum nehmen wir das als Strecke Tankstelle -> Ziel.
      const vomStart = zelle(0, spalte);
      const zumZiel = zelle(1, spalte);

      strecken.set(station.id, {
        vomStart: vomStart ?? geschaetzteStrecke(start, station),
        zumZiel: zumZiel ?? geschaetzteStrecke(station, ziel),
      });
    });

    // Tankstellen jenseits der Punktgrenze bekommen eine Schätzung.
    for (const station of stationen.slice(verwendet.length)) {
      strecken.set(station.id, {
        vomStart: geschaetzteStrecke(start, station),
        zumZiel: geschaetzteStrecke(station, ziel),
      });
    }

    return {
      strecken,
      direktZumZiel: zelle(0, 1) ?? geschaetzteStrecke(start, ziel),
      geschaetzt: false,
    };
  } catch {
    // Kein Netz, Zeitlimit, kaputte Antwort — egal. Geschätzt ist besser als gar nichts.
    return alleSchaetzen(start, ziel, stationen);
  } finally {
    clearTimeout(wecker);
    signal?.removeEventListener('abort', weiterleiten);
  }
}
