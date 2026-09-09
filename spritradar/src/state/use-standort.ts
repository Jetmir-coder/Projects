/**
 * Standort des Geräts holen.
 *
 * Kapselt expo-location so, dass die Screens sich weder um Berechtigungen noch
 * um Fehlerfälle kümmern müssen — sie bekommen einfach Punkt, Ladezustand und
 * eine verständliche Fehlermeldung.
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { istMock } from '@/api/mock';
import type { Punkt } from '@/lib/types';

/** Wien Stephansplatz — Startpunkt im Testbetrieb, wenn es kein GPS gibt. */
export const WIEN: Punkt = { lat: 48.2082, lon: 16.3738 };

export type Standort = {
  punkt: Punkt | null;
  laden: boolean;
  fehler: string | null;
  /** Standort (neu) bestimmen. */
  anfordern: () => void;
};

export function useStandort(): Standort {
  const [punkt, setPunkt] = useState<Punkt | null>(null);
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const anfordern = useCallback(() => {
    let abgebrochen = false;
    setLaden(true);
    setFehler(null);

    (async () => {
      // Im Testbetrieb ohne echtes Gerät: einfach Wien nehmen.
      if (istMock()) {
        setPunkt(WIEN);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (abgebrochen) return;

      if (status !== 'granted') {
        setFehler(
          'Ohne Standortfreigabe kann die App nicht wissen, wo du bist. ' +
            'Du kannst sie in den Systemeinstellungen erlauben.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (abgebrochen) return;

      setPunkt({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
    })()
      .catch(() => {
        if (!abgebrochen) setFehler('Standort konnte nicht bestimmt werden. Ist GPS an?');
      })
      .finally(() => {
        if (!abgebrochen) setLaden(false);
      });

    return () => {
      abgebrochen = true;
    };
  }, []);

  // Beim ersten Öffnen gleich versuchen.
  useEffect(() => {
    anfordern();
  }, [anfordern]);

  return { punkt, laden, fehler, anfordern };
}
