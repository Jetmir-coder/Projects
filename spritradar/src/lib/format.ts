/**
 * Zahlen für die Anzeige aufbereiten — österreichisches Format.
 *
 * Alles an einer Stelle, damit "1,49 €" überall gleich aussieht und nicht in
 * jedem Screen neu zusammengebastelt wird.
 */

const euro = new Intl.NumberFormat('de-AT', {
  style: 'currency',
  currency: 'EUR',
});

const literpreis = new Intl.NumberFormat('de-AT', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/** 2.27 -> "2,27 €" */
export function formatEuro(betrag: number): string {
  return euro.format(betrag);
}

/**
 * 1.449 -> "€ 1,449" — Spritpreise haben drei Nachkommastellen.
 * Gleiche Schreibweise wie formatEuro, damit die Beträge in einer Liste nicht
 * unterschiedlich aussehen.
 */
export function formatLiterpreis(preis: number): string {
  return `€ ${literpreis.format(preis)}`;
}

/** 4.237 -> "4,2 km", 0.35 -> "350 m" */
export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString('de-AT', { maximumFractionDigits: 1 })} km`;
}

/** 18 -> "18 Min", 95 -> "1 Std 35 Min" */
export function formatMinuten(minuten: number): string {
  const gerundet = Math.round(minuten);
  if (gerundet < 60) return `${gerundet} Min`;

  const stunden = Math.floor(gerundet / 60);
  const rest = gerundet % 60;
  return rest === 0 ? `${stunden} Std` : `${stunden} Std ${rest} Min`;
}

/** 41.3 -> "41,3 l" */
export function formatLiter(liter: number): string {
  return `${liter.toLocaleString('de-AT', { maximumFractionDigits: 1 })} l`;
}

/**
 * Wie alt ist die Preismeldung? "gerade eben", "vor 12 Min", "vor 3 Std".
 * Gibt null zurück, wenn kein oder ein unbrauchbarer Zeitstempel da ist.
 */
export function formatAlter(iso: string | undefined, jetzt = Date.now()): string | null {
  if (!iso) return null;

  const zeitpunkt = Date.parse(iso);
  if (Number.isNaN(zeitpunkt)) return null;

  const minuten = Math.floor((jetzt - zeitpunkt) / 60000);
  if (minuten < 0) return null;
  if (minuten < 2) return 'gerade eben';
  if (minuten < 60) return `vor ${minuten} Min`;

  const stunden = Math.floor(minuten / 60);
  if (stunden < 24) return `vor ${stunden} Std`;

  const tage = Math.floor(stunden / 24);
  return tage === 1 ? 'gestern' : `vor ${tage} Tagen`;
}
