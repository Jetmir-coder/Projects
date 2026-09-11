/**
 * Der Ablauf einer Suche, an einem Ort gebündelt:
 *
 *   1. Tankstellen rund um den Standort laden       (api/econtrol.ts)
 *   2. Strecken dorthin bestimmen                   (api/osrm.ts)
 *   3. Gesamtkosten rechnen und sortieren           (lib/calc.ts)
 *
 * Die Screens bekommen davon nur das Ergebnis, den Ladezustand und einen
 * eventuellen Fehler zu sehen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { ladeTankstellen } from '@/api/econtrol';
import { ladeStrecken } from '@/api/osrm';
import { bewerte, type Ergebnis } from '@/lib/calc';
import type { Punkt } from '@/lib/types';
import { merkeErgebnis } from './letztes-ergebnis';
import { verbrauchVon, type Einstellungen } from './settings';

export type SuchZustand = {
  ergebnis: Ergebnis | null;
  laden: boolean;
  fehler: string | null;
  /** true, wenn die Strecken nur geschätzt sind (kein Routing-Server). */
  geschaetzt: boolean;
  /** Wann die angezeigten Daten geladen wurden. */
  standZeit: number | null;
  neuLaden: () => void;
};

export function useSuche(punkt: Punkt | null, einstellungen: Einstellungen): SuchZustand {
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [geschaetzt, setGeschaetzt] = useState(false);
  const [standZeit, setStandZeit] = useState<number | null>(null);

  // Damit eine alte, langsame Suche eine neuere nicht überschreibt.
  const laufendeSuche = useRef<AbortController | null>(null);
  const [ausloeser, setAusloeser] = useState(0);
  const neuLaden = useCallback(() => setAusloeser((n) => n + 1), []);

  useEffect(() => {
    if (!punkt) return;

    laufendeSuche.current?.abort();
    const abbruch = new AbortController();
    laufendeSuche.current = abbruch;

    setLaden(true);
    setFehler(null);

    (async () => {
      const stationen = await ladeTankstellen({
        zentrum: punkt,
        radiusKm: einstellungen.radiusKm,
        kraftstoff: einstellungen.kraftstoff,
        signal: abbruch.signal,
      });
      if (abbruch.signal.aborted) return;

      // Ziel = Startpunkt: klassische Hin- und Rückfahrt zum Tanken.
      const strecken = await ladeStrecken(punkt, punkt, stationen, abbruch.signal);
      if (abbruch.signal.aborted) return;

      const neuesErgebnis = bewerte(stationen, strecken.strecken, {
        tankmengeLiter: einstellungen.tankmengeLiter,
        verbrauchLper100km: verbrauchVon(einstellungen),
        kraftstoff: einstellungen.kraftstoff,
        zeitwertProStunde: einstellungen.zeitwertProStunde,
        direktZumZiel: strecken.direktZumZiel,
      });

      setGeschaetzt(strecken.geschaetzt);
      setErgebnis(neuesErgebnis);
      setStandZeit(Date.now());
      // Für den Detailbildschirm bereitlegen.
      merkeErgebnis(neuesErgebnis.bewertungen);
    })()
      .catch((problem: unknown) => {
        if (abbruch.signal.aborted) return;
        setFehler(
          problem instanceof Error && problem.message
            ? `Preise konnten nicht geladen werden: ${problem.message}`
            : 'Preise konnten nicht geladen werden. Bist du online?',
        );
      })
      .finally(() => {
        if (!abbruch.signal.aborted) setLaden(false);
      });

    return () => abbruch.abort();
    // Absichtlich nur diese Abhängigkeiten: Tankmenge und Zeitwert ändern nur
    // die Rechnung, nicht die geladenen Daten — sie werden unten neu bewertet.
  }, [
    punkt,
    einstellungen.radiusKm,
    einstellungen.kraftstoff,
    einstellungen.tankmengeLiter,
    einstellungen.zeitwertProStunde,
    einstellungen.motorId,
    einstellungen.eigenerVerbrauch,
    einstellungen.realverbrauch,
    ausloeser,
  ]);

  return { ergebnis, laden, fehler, geschaetzt, standZeit, neuLaden };
}
