/**
 * Fahrzeugliste: Marke -> Modell -> Motorisierung -> Verbrauch.
 *
 * Bewusst von Hand gepflegt und auf in Österreich gängige Autos beschränkt.
 * Eine vollständige Fahrzeugdatenbank gibt es frei nicht in brauchbarer
 * Qualität — und für den Zweck der App reicht ein guter Startwert völlig, denn
 * der Verbrauch lässt sich in den Einstellungen jederzeit überschreiben.
 *
 * DEIN AUTO FEHLT? Trag es unten einfach ein. Das Format ist:
 *
 *   'Marke': [
 *     ['Modellname', [
 *       ['Motorbezeichnung', 'DIE' | 'SUP' | 'GAS', VerbrauchInLiterJe100km],
 *     ]],
 *   ],
 *
 * Die Verbrauchswerte sind Herstellerangaben (WLTP-nah). Real liegt man meist
 * 10-20 % darüber — dafür gibt es in den Einstellungen den Schalter
 * "Realverbrauch".
 */

import type { Kraftstoff } from '@/lib/types';

/** Aufschlag auf den Normverbrauch, wenn der Realverbrauch-Schalter an ist. */
export const REALVERBRAUCH_AUFSCHLAG = 0.15;

type RohMotor = [name: string, kraftstoff: Kraftstoff, verbrauch: number];
type RohModell = [name: string, motoren: RohMotor[]];

const ROH: Record<string, RohModell[]> = {
  VW: [
    ['Golf VII', [
      ['1.6 TDI 115 PS', 'DIE', 4.5],
      ['2.0 TDI 150 PS', 'DIE', 4.9],
      ['1.0 TSI 115 PS', 'SUP', 5.4],
      ['1.5 TSI 150 PS', 'SUP', 5.6],
    ]],
    ['Golf VIII', [
      ['2.0 TDI 115 PS', 'DIE', 4.4],
      ['1.5 eTSI 150 PS', 'SUP', 5.3],
    ]],
    ['Passat B8', [
      ['2.0 TDI 150 PS', 'DIE', 5.0],
      ['1.5 TSI 150 PS', 'SUP', 6.0],
    ]],
    ['Polo VI', [
      ['1.6 TDI 95 PS', 'DIE', 4.2],
      ['1.0 TSI 95 PS', 'SUP', 5.2],
    ]],
    ['Tiguan II', [
      ['2.0 TDI 150 PS', 'DIE', 5.6],
      ['1.5 TSI 150 PS', 'SUP', 6.8],
    ]],
    ['T-Roc', [
      ['2.0 TDI 116 PS', 'DIE', 5.0],
      ['1.0 TSI 110 PS', 'SUP', 6.0],
    ]],
  ],
  Skoda: [
    ['Octavia III', [
      ['1.6 TDI 115 PS', 'DIE', 4.4],
      ['2.0 TDI 150 PS', 'DIE', 4.8],
      ['1.4 TSI 150 PS', 'SUP', 5.5],
    ]],
    ['Octavia IV', [
      ['2.0 TDI 150 PS', 'DIE', 4.6],
      ['1.5 TSI 150 PS', 'SUP', 5.4],
    ]],
    ['Fabia III', [
      ['1.4 TDI 90 PS', 'DIE', 4.0],
      ['1.0 TSI 95 PS', 'SUP', 5.0],
    ]],
    ['Superb III', [
      ['2.0 TDI 150 PS', 'DIE', 5.1],
      ['1.5 TSI 150 PS', 'SUP', 6.1],
    ]],
    ['Kodiaq', [
      ['2.0 TDI 150 PS', 'DIE', 5.8],
      ['1.5 TSI 150 PS', 'SUP', 7.0],
    ]],
  ],
  Audi: [
    ['A3 8V', [
      ['1.6 TDI 110 PS', 'DIE', 4.3],
      ['2.0 TDI 150 PS', 'DIE', 4.7],
      ['1.4 TFSI 150 PS', 'SUP', 5.4],
    ]],
    ['A4 B9', [
      ['2.0 TDI 150 PS', 'DIE', 4.8],
      ['2.0 TFSI 190 PS', 'SUP', 6.2],
    ]],
    ['Q3', [
      ['2.0 TDI 150 PS', 'DIE', 5.5],
      ['1.5 TFSI 150 PS', 'SUP', 6.5],
    ]],
  ],
  BMW: [
    ['3er F30', [
      ['318d 150 PS', 'DIE', 4.5],
      ['320d 190 PS', 'DIE', 4.7],
      ['320i 184 PS', 'SUP', 6.0],
    ]],
    ['1er F20', [
      ['116d 116 PS', 'DIE', 4.2],
      ['118i 136 PS', 'SUP', 5.6],
    ]],
    ['X1 F48', [
      ['18d 150 PS', 'DIE', 5.2],
      ['18i 140 PS', 'SUP', 6.4],
    ]],
  ],
  'Mercedes-Benz': [
    ['A-Klasse W177', [
      ['A 180 d 116 PS', 'DIE', 4.4],
      ['A 200 163 PS', 'SUP', 5.8],
    ]],
    ['C-Klasse W205', [
      ['C 200 d 160 PS', 'DIE', 4.7],
      ['C 200 184 PS', 'SUP', 6.3],
    ]],
    ['Vito', [
      ['114 CDI 136 PS', 'DIE', 6.6],
    ]],
  ],
  Opel: [
    ['Corsa E', [
      ['1.3 CDTI 95 PS', 'DIE', 3.9],
      ['1.4 90 PS', 'SUP', 5.4],
    ]],
    ['Astra K', [
      ['1.6 CDTI 110 PS', 'DIE', 4.2],
      ['1.4 Turbo 125 PS', 'SUP', 5.6],
    ]],
    ['Zafira Tourer', [
      ['1.6 CDTI 136 PS', 'DIE', 5.0],
    ]],
  ],
  Ford: [
    ['Focus III', [
      ['1.5 TDCi 120 PS', 'DIE', 4.3],
      ['1.0 EcoBoost 125 PS', 'SUP', 5.5],
    ]],
    ['Fiesta VII', [
      ['1.5 TDCi 85 PS', 'DIE', 3.8],
      ['1.0 EcoBoost 100 PS', 'SUP', 5.2],
    ]],
    ['Kuga II', [
      ['2.0 TDCi 150 PS', 'DIE', 5.5],
      ['1.5 EcoBoost 150 PS', 'SUP', 6.8],
    ]],
    ['Transit Custom', [
      ['2.0 EcoBlue 130 PS', 'DIE', 7.0],
    ]],
  ],
  Renault: [
    ['Clio IV', [
      ['1.5 dCi 90 PS', 'DIE', 3.6],
      ['0.9 TCe 90 PS', 'SUP', 5.2],
    ]],
    ['Megane IV', [
      ['1.5 dCi 110 PS', 'DIE', 4.0],
      ['1.3 TCe 140 PS', 'SUP', 5.8],
    ]],
    ['Captur', [
      ['1.5 dCi 90 PS', 'DIE', 4.1],
      ['1.3 TCe 130 PS', 'SUP', 6.0],
    ]],
  ],
  Dacia: [
    ['Duster II', [
      ['1.5 Blue dCi 115 PS', 'DIE', 4.9],
      ['1.3 TCe 130 PS', 'SUP', 6.4],
      ['1.0 ECO-G 100 PS', 'GAS', 8.0],
    ]],
    ['Sandero III', [
      ['1.0 TCe 90 PS', 'SUP', 5.5],
      ['1.0 ECO-G 100 PS', 'GAS', 7.6],
    ]],
  ],
  Toyota: [
    ['Yaris IV', [
      ['1.5 Hybrid 116 PS', 'SUP', 3.8],
      ['1.5 125 PS', 'SUP', 5.5],
    ]],
    ['Corolla E21', [
      ['1.8 Hybrid 140 PS', 'SUP', 4.3],
      ['2.0 Hybrid 196 PS', 'SUP', 4.7],
    ]],
    ['RAV4 V', [
      ['2.5 Hybrid 218 PS', 'SUP', 5.7],
    ]],
  ],
  Seat: [
    ['Leon III', [
      ['1.6 TDI 115 PS', 'DIE', 4.3],
      ['1.4 TSI 125 PS', 'SUP', 5.3],
    ]],
    ['Ibiza V', [
      ['1.6 TDI 95 PS', 'DIE', 4.1],
      ['1.0 TSI 95 PS', 'SUP', 5.1],
    ]],
    ['Ateca', [
      ['2.0 TDI 150 PS', 'DIE', 5.4],
      ['1.5 TSI 150 PS', 'SUP', 6.6],
    ]],
  ],
  Hyundai: [
    ['i20 II', [
      ['1.1 CRDi 75 PS', 'DIE', 3.9],
      ['1.0 T-GDI 100 PS', 'SUP', 5.3],
    ]],
    ['i30 III', [
      ['1.6 CRDi 115 PS', 'DIE', 4.4],
      ['1.4 T-GDI 140 PS', 'SUP', 5.9],
    ]],
    ['Tucson III', [
      ['1.6 CRDi 136 PS', 'DIE', 5.5],
      ['1.6 T-GDI 177 PS', 'SUP', 7.0],
    ]],
  ],
  Kia: [
    ['Ceed III', [
      ['1.6 CRDi 136 PS', 'DIE', 4.4],
      ['1.0 T-GDI 120 PS', 'SUP', 5.6],
    ]],
    ['Sportage IV', [
      ['1.6 CRDi 136 PS', 'DIE', 5.4],
      ['1.6 T-GDI 177 PS', 'SUP', 7.2],
    ]],
  ],
  Peugeot: [
    ['208 II', [
      ['1.5 BlueHDi 100 PS', 'DIE', 3.8],
      ['1.2 PureTech 100 PS', 'SUP', 5.3],
    ]],
    ['308 II', [
      ['1.5 BlueHDi 130 PS', 'DIE', 4.2],
      ['1.2 PureTech 130 PS', 'SUP', 5.7],
    ]],
    ['3008 II', [
      ['1.5 BlueHDi 130 PS', 'DIE', 4.9],
      ['1.2 PureTech 130 PS', 'SUP', 6.4],
    ]],
  ],
  Fiat: [
    ['500', [
      ['1.3 MultiJet 95 PS', 'DIE', 4.1],
      ['1.2 69 PS', 'SUP', 5.2],
    ]],
    ['Panda III', [
      ['0.9 TwinAir 85 PS', 'SUP', 5.1],
      ['0.9 Natural Power', 'GAS', 6.5],
    ]],
    ['Ducato', [
      ['2.3 MultiJet 140 PS', 'DIE', 8.2],
    ]],
  ],
  Mazda: [
    ['3 BP', [
      ['1.8 Skyactiv-D 116 PS', 'DIE', 4.6],
      ['2.0 Skyactiv-G 122 PS', 'SUP', 5.7],
    ]],
    ['CX-5 II', [
      ['2.2 Skyactiv-D 150 PS', 'DIE', 5.4],
      ['2.0 Skyactiv-G 165 PS', 'SUP', 6.8],
    ]],
  ],
};

// ---------------------------------------------------------------------------
// Aus der kompakten Tabelle oben werden hier ordentliche Objekte mit IDs.
// ---------------------------------------------------------------------------

export type Motorisierung = {
  /** Eindeutig und stabil, z. B. "VW|Golf VII|2.0 TDI 150 PS". */
  id: string;
  marke: string;
  modell: string;
  name: string;
  kraftstoff: Kraftstoff;
  /** Herstellerangabe in Liter je 100 km. */
  verbrauch: number;
};

export type Modell = {
  name: string;
  motoren: Motorisierung[];
};

export type Marke = {
  name: string;
  modelle: Modell[];
};

export const MARKEN: Marke[] = Object.entries(ROH).map(([marke, modelle]) => ({
  name: marke,
  modelle: modelle.map(([modell, motoren]) => ({
    name: modell,
    motoren: motoren.map(([name, kraftstoff, verbrauch]) => ({
      id: `${marke}|${modell}|${name}`,
      marke,
      modell,
      name,
      kraftstoff,
      verbrauch,
    })),
  })),
}));

/** Alle Motorisierungen flach — praktisch zum Nachschlagen per ID. */
export const ALLE_MOTOREN: Motorisierung[] = MARKEN.flatMap((marke) =>
  marke.modelle.flatMap((modell) => modell.motoren),
);

const NACH_ID = new Map(ALLE_MOTOREN.map((motor) => [motor.id, motor]));

export function findeMotor(id: string | null | undefined): Motorisierung | undefined {
  return id ? NACH_ID.get(id) : undefined;
}

export function findeMarke(name: string): Marke | undefined {
  return MARKEN.find((marke) => marke.name === name);
}

export function findeModell(markeName: string, modellName: string): Modell | undefined {
  return findeMarke(markeName)?.modelle.find((modell) => modell.name === modellName);
}

/** Verbrauch inklusive Realverbrauch-Aufschlag, falls eingeschaltet. */
export function effektiverVerbrauch(normverbrauch: number, realverbrauch: boolean): number {
  return realverbrauch ? normverbrauch * (1 + REALVERBRAUCH_AUFSCHLAG) : normverbrauch;
}
