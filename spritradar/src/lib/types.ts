/**
 * Zentrale Datentypen der App.
 *
 * Alles, was mehrere Dateien gemeinsam benutzen, steht hier. So gibt es genau
 * eine Wahrheit darüber, wie eine Tankstelle aussieht — und wenn sich daran
 * etwas ändert, meckert TypeScript überall dort, wo es angepasst werden muss.
 */

/** Kraftstoffarten, wie E-Control sie benennt. */
export type Kraftstoff = 'DIE' | 'SUP' | 'GAS';

export const KRAFTSTOFF_NAMEN: Record<Kraftstoff, string> = {
  DIE: 'Diesel',
  SUP: 'Super 95',
  GAS: 'Autogas (LPG)',
};

/** Ein Punkt auf der Erde. */
export type Punkt = {
  lat: number;
  lon: number;
};

/**
 * Eine Tankstelle in *unserem* Format — nicht im Format von E-Control.
 *
 * Die Übersetzung passiert an genau einer Stelle (`mapStation` in
 * src/api/econtrol.ts). Ändert E-Control seine Feldnamen, ist das dort ein
 * Einzeiler statt einer Suche quer durch die ganze App.
 */
export type Tankstelle = {
  id: string;
  name: string;
  /** Kette bzw. Marke, z. B. "Shell" — nicht immer vorhanden. */
  marke?: string;
  lat: number;
  lon: number;
  adresse: string;
  plz: string;
  ort: string;
  offen: boolean;
  /** Nicht jede Tankstelle führt jeden Kraftstoff, darum "Partial". */
  preise: Partial<Record<Kraftstoff, number>>;
  /** Zeitpunkt der Preismeldung, als ISO-String. */
  standAktualisiert?: string;
};

/**
 * Eine gefahrene Strecke zwischen zwei Punkten.
 *
 * `geschaetzt` ist true, wenn wir sie über die Luftlinie geschätzt haben, weil
 * der Routing-Server (OSRM) nicht erreichbar war. Das zeigt die App dem Nutzer
 * auch an — geschätzte Zahlen sollen nicht so aussehen wie gemessene.
 */
export type Strecke = {
  km: number;
  minuten: number;
  geschaetzt: boolean;
};
