/**
 * ★ Der Rechenkern der App.
 *
 * Hier steht die eigentliche Idee: Nicht der niedrigste Literpreis gewinnt,
 * sondern die niedrigsten *Gesamtkosten* — Sprit plus das, was der Umweg
 * kostet, plus optional der Wert der Zeit, die der Umweg frisst.
 *
 * Alles hier sind "reine Funktionen": gleiche Eingabe -> immer gleiche Ausgabe,
 * kein Netzzugriff, kein React, kein Speicher. Genau deshalb ist diese Datei
 * vollständig testbar (siehe __tests__/calc.test.ts) und der beste Einstieg,
 * wenn man verstehen will, was die App tut.
 */

import type { Kraftstoff, Strecke, Tankstelle } from './types';

/** Unter dieser Ersparnis lohnt der Umweg gefühlt nicht. Rein kosmetisch. */
export const LOHNT_SICH_AB_EURO = 0.5;

/** Die Strecken zu einer Tankstelle, wie sie der Router (oder die Schätzung) liefert. */
export type StreckenInfo = {
  /** Vom Startpunkt zur Tankstelle. */
  vomStart: Strecke;
  /**
   * Von der Tankstelle weiter zum Ziel.
   * Ist kein Ziel gesetzt, ist das Ziel der Startpunkt — also die Rückfahrt.
   */
  zumZiel: Strecke;
};

export type Eingaben = {
  /** Wie viel Liter willst du tanken? */
  tankmengeLiter: number;
  /** Verbrauch des Autos in Liter je 100 km. */
  verbrauchLper100km: number;
  kraftstoff: Kraftstoff;
  /**
   * Was ist dir eine Stunde deiner Zeit wert (€/h)? 0 schaltet die
   * Zeitbewertung ab — dann zählt nur der Sprit.
   */
  zeitwertProStunde: number;
  /**
   * Strecke, die du ohne jeden Tank-Umweg sowieso fahren würdest
   * (Start -> Ziel). Bei "Ziel = Start" ist das 0 und der Umweg ist die
   * komplette Hin- und Rückfahrt.
   */
  direktZumZiel: Strecke;
};

export type Bewertung = {
  station: Tankstelle;
  /** Preis je Liter für den gewählten Kraftstoff. */
  preis: number;

  umwegKm: number;
  umwegMinuten: number;
  /** Sprit, den allein der Umweg verbraucht. */
  umwegLiter: number;
  /** Mindestens eine der beiden Teilstrecken war nur geschätzt. */
  geschaetzt: boolean;

  /** Tankmenge x Literpreis. */
  spritKosten: number;
  /** Was der Umweg an Sprit kostet (zum Preis dieser Tankstelle). */
  umwegKosten: number;
  /** Was der Umweg an Zeit kostet (0, wenn kein Zeitwert gesetzt ist). */
  zeitKosten: number;
  /** Summe aus allen dreien — danach wird sortiert. */
  gesamtKosten: number;

  /** Positiv = billiger als die Referenz-Tankstelle. */
  ersparnisGegenReferenz: number;
  /**
   * Ab wie vielen Litern schlägt diese Tankstelle die Referenz?
   * `0` = lohnt ab dem ersten Liter, `null` = lohnt nie (Preis ist nicht besser).
   */
  breakEvenLiter: number | null;
  /** Das ist die Tankstelle, zu der du ohne App gefahren wärst. */
  istReferenz: boolean;
  /** Ersparnis groß genug, um den Umweg zu rechtfertigen. */
  lohntSich: boolean;
};

export type Ergebnis = {
  /** Nach Gesamtkosten sortiert, das Beste zuerst. */
  bewertungen: Bewertung[];
  /** Die nächstgelegene passende Tankstelle — der Vergleichsmaßstab. */
  referenz: Bewertung | null;
  /**
   * Tankstellen, die aussortiert wurden, weil sie den gewählten Kraftstoff
   * nicht führen oder geschlossen sind. Nur zur Anzeige ("3 ohne Diesel").
   */
  aussortiert: number;
};

/** Umweg-Kilometer: Der Zusatzweg gegenüber der Fahrt, die du ohnehin machst. */
export function umwegKm(strecken: StreckenInfo, direktZumZiel: Strecke): number {
  const umweg = strecken.vomStart.km + strecken.zumZiel.km - direktZumZiel.km;
  // Negativ kann durch Schätzfehler passieren (Tankstelle liegt direkt am Weg).
  return Math.max(0, umweg);
}

/** Umweg-Minuten, analog zu den Kilometern. */
export function umwegMinuten(strecken: StreckenInfo, direktZumZiel: Strecke): number {
  const umweg = strecken.vomStart.minuten + strecken.zumZiel.minuten - direktZumZiel.minuten;
  return Math.max(0, umweg);
}

/**
 * Kosten einer einzelnen Tankstelle, ohne Vergleich mit anderen.
 *
 *   gesamt = tankmenge x preis  +  umwegLiter x preis  +  zeitkosten
 *
 * Warum der Umweg-Sprit mit *diesem* Literpreis gerechnet wird: Den auf dem
 * Umweg verbrauchten Sprit tankst du an genau dieser Tankstelle mit — also
 * kostet er auch genau so viel.
 */
function kostenFuer(
  station: Tankstelle,
  preis: number,
  strecken: StreckenInfo,
  eingaben: Eingaben,
) {
  const km = umwegKm(strecken, eingaben.direktZumZiel);
  const minuten = umwegMinuten(strecken, eingaben.direktZumZiel);

  const liter = (km / 100) * eingaben.verbrauchLper100km;
  const spritKosten = eingaben.tankmengeLiter * preis;
  const umwegKosten = liter * preis;
  const zeitKosten = (minuten / 60) * eingaben.zeitwertProStunde;

  return {
    station,
    preis,
    umwegKm: km,
    umwegMinuten: minuten,
    umwegLiter: liter,
    geschaetzt: strecken.vomStart.geschaetzt || strecken.zumZiel.geschaetzt,
    spritKosten,
    umwegKosten,
    zeitKosten,
    gesamtKosten: spritKosten + umwegKosten + zeitKosten,
  };
}

type Zwischenstand = ReturnType<typeof kostenFuer>;

/**
 * Ab wie vielen Litern schlägt Tankstelle `s` die Referenz `r`?
 *
 * Die Gesamtkosten hängen linear von der Tankmenge L ab:
 *
 *   gesamt(L) = preis x (L + umwegLiter) + zeitKosten
 *
 * Die Differenz zwischen zwei Tankstellen ist damit
 *
 *   D(L) = L x (preis_s - preis_r) + fix        mit
 *   fix  = (preis_s x umwegLiter_s - preis_r x umwegLiter_r) + (zeit_s - zeit_r)
 *
 * `s` gewinnt, sobald D(L) < 0. Ist `s` nicht billiger je Liter, wird D mit
 * wachsendem L nur größer — dann gibt es keinen Kipppunkt und wir liefern null.
 */
export function breakEvenLiter(s: Zwischenstand, r: Zwischenstand): number | null {
  const preisVorteil = r.preis - s.preis;
  if (preisVorteil <= 0) return null;

  const fix =
    s.preis * s.umwegLiter - r.preis * r.umwegLiter + (s.zeitKosten - r.zeitKosten);

  const liter = fix / preisVorteil;
  return liter <= 0 ? 0 : liter;
}

/**
 * Hauptfunktion: bewertet alle Tankstellen und sortiert sie nach Gesamtkosten.
 *
 * @param stationen  Tankstellen aus der Umgebung
 * @param strecken   Strecken je Tankstellen-ID (aus OSRM oder geschätzt)
 * @param eingaben   Auto, Tankmenge, Zeitwert
 */
export function bewerte(
  stationen: Tankstelle[],
  strecken: Map<string, StreckenInfo>,
  eingaben: Eingaben,
): Ergebnis {
  const zwischenstaende: Zwischenstand[] = [];
  let aussortiert = 0;

  for (const station of stationen) {
    const preis = station.preise[eingaben.kraftstoff];
    const info = strecken.get(station.id);

    // Ohne Preis für den gewählten Kraftstoff, geschlossen oder ohne bekannte
    // Strecke können wir nichts rechnen — solche Einträge fliegen raus.
    if (preis === undefined || preis <= 0 || !station.offen || !info) {
      aussortiert++;
      continue;
    }

    zwischenstaende.push(kostenFuer(station, preis, info, eingaben));
  }

  if (zwischenstaende.length === 0) {
    return { bewertungen: [], referenz: null, aussortiert };
  }

  // Referenz = die nächstgelegene passende Tankstelle. Das ist die, zu der man
  // ohne App gefahren wäre — nur gegen sie ist eine "Ersparnis" ehrlich.
  const referenzStand = zwischenstaende.reduce((naechste, kandidat) => {
    const a = strecken.get(kandidat.station.id)!.vomStart.km;
    const b = strecken.get(naechste.station.id)!.vomStart.km;
    return a < b ? kandidat : naechste;
  });

  const bewertungen: Bewertung[] = zwischenstaende.map((stand) => {
    const istReferenz = stand.station.id === referenzStand.station.id;
    const ersparnis = referenzStand.gesamtKosten - stand.gesamtKosten;

    return {
      ...stand,
      istReferenz,
      ersparnisGegenReferenz: ersparnis,
      breakEvenLiter: istReferenz ? null : breakEvenLiter(stand, referenzStand),
      lohntSich: !istReferenz && ersparnis >= LOHNT_SICH_AB_EURO,
    };
  });

  // Günstigste Gesamtkosten zuerst. Bei Gleichstand gewinnt der kürzere Umweg.
  bewertungen.sort(
    (a, b) => a.gesamtKosten - b.gesamtKosten || a.umwegKm - b.umwegKm,
  );

  return {
    bewertungen,
    referenz: bewertungen.find((b) => b.istReferenz) ?? null,
    aussortiert,
  };
}
