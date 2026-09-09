/**
 * Testbetrieb ohne Internet.
 *
 * Mit `EXPO_PUBLIC_MOCK=1` beim Start holt die App ihre Daten aus den
 * aufgezeichneten Beispielantworten in src/fixtures/ statt aus dem Netz.
 * Praktisch für die Entwicklung im Zug, für Tests und für alles, was laufen
 * muss, bevor die echte Schnittstelle geprüft ist.
 *
 *   PowerShell:  $env:EXPO_PUBLIC_MOCK=1 ; npx expo start
 *   Bash:        EXPO_PUBLIC_MOCK=1 npx expo start
 *
 * Die Fixture enthält absichtlich Rohdaten im E-Control-Format, nicht unser
 * eigenes — so läuft im Mock-Betrieb dieselbe Übersetzung wie im Echtbetrieb.
 */

import wienRoh from '@/fixtures/econtrol-wien.json';

export function istMock(): boolean {
  return process.env.EXPO_PUBLIC_MOCK === '1';
}

/** Beispielantwort im Rohformat, wie sie von E-Control käme. */
export function mockRohdaten(): unknown[] {
  return wienRoh as unknown[];
}

/**
 * Eine erfundene Route: Luftlinie, leicht aufgeschlagen, damit sich der
 * Mock-Betrieb nicht identisch zur Schätzung verhält.
 */
export function mockRouteFaktor(): number {
  return 1.35;
}
