/**
 * Merkt sich das zuletzt berechnete Ergebnis.
 *
 * Warum: Der Detailbildschirm bekommt über die Adresse nur die ID der
 * Tankstelle. Statt dort alles noch einmal zu laden, greift er auf das
 * Ergebnis zu, das der Hauptbildschirm gerade berechnet hat.
 *
 * Bewusst eine einfache Variable im Modul und kein React-State: Sie wird nur
 * gelesen, nachdem der Hauptbildschirm sie geschrieben hat, und muss keine
 * Neuzeichnung auslösen.
 */

import type { Bewertung } from '@/lib/calc';

let bewertungen: Bewertung[] = [];

export function merkeErgebnis(neue: Bewertung[]) {
  bewertungen = neue;
}

export function findeBewertung(id: string): Bewertung | undefined {
  return bewertungen.find((bewertung) => bewertung.station.id === id);
}
