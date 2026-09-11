/**
 * Einstellungen des Nutzers: Auto, Tankmenge, Radius, Zeitwert.
 *
 * Gespeichert wird mit AsyncStorage — dem kleinen Schlüssel-Wert-Speicher, den
 * jede React-Native-App eingebaut hat. Alles bleibt auf dem Gerät, nichts geht
 * ins Netz.
 *
 * Die Einstellungen liegen in einem React-Context, damit jeder Screen sie
 * lesen und ändern kann, ohne sie durch die halbe App durchreichen zu müssen.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { effektiverVerbrauch, findeMotor } from '@/data/cars';
import type { Kraftstoff } from '@/lib/types';

const SPEICHER_SCHLUESSEL = 'spritradar.einstellungen.v1';

export type Einstellungen = {
  /** Gewählte Motorisierung aus der Fahrzeugliste, oder null bei Handeingabe. */
  motorId: string | null;
  /** Selbst eingetragener Verbrauch — schlägt den Wert aus der Liste. */
  eigenerVerbrauch: number | null;
  /** Aufschlag auf den Normverbrauch, weil real mehr verbraucht wird. */
  realverbrauch: boolean;
  kraftstoff: Kraftstoff;
  /** Wie viel Liter du üblicherweise tankst. */
  tankmengeLiter: number;
  /** Wie weit die App nach Tankstellen sucht. */
  radiusKm: number;
  /** Was dir eine Stunde wert ist. 0 = Zeit wird nicht mitgerechnet. */
  zeitwertProStunde: number;
};

export const STANDARD: Einstellungen = {
  motorId: null,
  eigenerVerbrauch: null,
  realverbrauch: true,
  kraftstoff: 'DIE',
  tankmengeLiter: 40,
  radiusKm: 8,
  zeitwertProStunde: 0,
};

/**
 * Gespeicherte Werte einlesen und mit den Standardwerten auffüllen.
 *
 * Bewusst nachsichtig: Kommt Unsinn aus dem Speicher (alte Version, kaputter
 * Eintrag), starten wir lieber mit den Standardwerten, statt abzustürzen.
 */
export function zusammenfuehren(roh: unknown): Einstellungen {
  if (typeof roh !== 'object' || roh === null) return STANDARD;
  const gespeichert = roh as Partial<Einstellungen>;

  const zahl = (wert: unknown, standard: number, min: number, max: number) =>
    typeof wert === 'number' && Number.isFinite(wert)
      ? Math.min(max, Math.max(min, wert))
      : standard;

  return {
    motorId: typeof gespeichert.motorId === 'string' ? gespeichert.motorId : null,
    eigenerVerbrauch:
      typeof gespeichert.eigenerVerbrauch === 'number' &&
      Number.isFinite(gespeichert.eigenerVerbrauch) &&
      gespeichert.eigenerVerbrauch > 0
        ? gespeichert.eigenerVerbrauch
        : null,
    realverbrauch:
      typeof gespeichert.realverbrauch === 'boolean'
        ? gespeichert.realverbrauch
        : STANDARD.realverbrauch,
    kraftstoff:
      gespeichert.kraftstoff === 'DIE' ||
      gespeichert.kraftstoff === 'SUP' ||
      gespeichert.kraftstoff === 'GAS'
        ? gespeichert.kraftstoff
        : STANDARD.kraftstoff,
    tankmengeLiter: zahl(gespeichert.tankmengeLiter, STANDARD.tankmengeLiter, 1, 200),
    radiusKm: zahl(gespeichert.radiusKm, STANDARD.radiusKm, 1, 50),
    zeitwertProStunde: zahl(gespeichert.zeitwertProStunde, STANDARD.zeitwertProStunde, 0, 500),
  };
}

/**
 * Der Verbrauch, mit dem gerechnet wird.
 *
 * Reihenfolge: eigener Wert schlägt Fahrzeugliste. Ist gar nichts gesetzt,
 * nehmen wir 7 l/100km als neutralen Startwert, damit die App auch ohne
 * Einrichtung schon etwas Sinnvolles zeigt.
 */
export function verbrauchVon(einstellungen: Einstellungen): number {
  if (einstellungen.eigenerVerbrauch !== null) return einstellungen.eigenerVerbrauch;

  const motor = findeMotor(einstellungen.motorId);
  if (motor) return effektiverVerbrauch(motor.verbrauch, einstellungen.realverbrauch);

  return 7;
}

/** True, solange der Nutzer weder Auto noch eigenen Verbrauch gewählt hat. */
export function istUneingerichtet(einstellungen: Einstellungen): boolean {
  return einstellungen.motorId === null && einstellungen.eigenerVerbrauch === null;
}

// ---------------------------------------------------------------------------
// React-Anbindung
// ---------------------------------------------------------------------------

export type EinstellungenKontext = {
  einstellungen: Einstellungen;
  /** Einzelne Felder ändern; gespeichert wird automatisch. */
  setzen: (aenderung: Partial<Einstellungen>) => void;
  /** False, solange noch aus dem Speicher gelesen wird. */
  geladen: boolean;
};

export const Kontext = createContext<EinstellungenKontext | null>(null);

/** Die Logik hinter dem Provider — als Hook, damit sie testbar bleibt. */
export function useEinstellungenStore(): EinstellungenKontext {
  const [einstellungen, setEinstellungen] = useState<Einstellungen>(STANDARD);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    let abgebrochen = false;

    AsyncStorage.getItem(SPEICHER_SCHLUESSEL)
      .then((roh) => {
        if (abgebrochen || !roh) return;
        setEinstellungen(zusammenfuehren(JSON.parse(roh)));
      })
      .catch(() => {
        // Kaputter Speichereintrag: mit den Standardwerten weitermachen.
      })
      .finally(() => {
        if (!abgebrochen) setGeladen(true);
      });

    return () => {
      abgebrochen = true;
    };
  }, []);

  const setzen = useCallback((aenderung: Partial<Einstellungen>) => {
    setEinstellungen((vorher) => {
      const neu = { ...vorher, ...aenderung };
      // Absichtlich ohne await: die Anzeige soll nicht auf die Platte warten.
      AsyncStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(neu)).catch(() => {});
      return neu;
    });
  }, []);

  return useMemo(
    () => ({ einstellungen, setzen, geladen }),
    [einstellungen, setzen, geladen],
  );
}

export function useEinstellungen(): EinstellungenKontext {
  const kontext = useContext(Kontext);
  if (!kontext) {
    throw new Error('useEinstellungen braucht den EinstellungenProvider im Baum darüber.');
  }
  return kontext;
}
