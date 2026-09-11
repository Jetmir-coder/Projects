import { bewerte, breakEvenLiter, umwegKm, type Eingaben, type StreckenInfo } from '@/lib/calc';
import { ANNAHME_KMH } from '@/lib/geo';
import type { Strecke, Tankstelle } from '@/lib/types';

/** Baut eine Strecke aus Kilometern, Zeit über die Standardannahme. */
const strecke = (km: number): Strecke => ({
  km,
  minuten: (km / ANNAHME_KMH) * 60,
  geschaetzt: false,
});

const KEINE_STRECKE = strecke(0);

/** Tankstelle mit sinnvollen Vorgabewerten; alles Nötige ist überschreibbar. */
function station(over: Partial<Tankstelle> & { id: string }): Tankstelle {
  return {
    name: `Tankstelle ${over.id}`,
    lat: 48.2,
    lon: 16.37,
    adresse: 'Teststraße 1',
    plz: '1010',
    ort: 'Wien',
    offen: true,
    preise: { DIE: 1.5 },
    ...over,
  };
}

/**
 * Hin- und Rückfahrt zur Tankstelle: Ziel = Start, also ist der Umweg die
 * doppelte Entfernung.
 */
const hinUndZurueck = (km: number): StreckenInfo => ({
  vomStart: strecke(km),
  zumZiel: strecke(km),
});

function eingaben(over: Partial<Eingaben> = {}): Eingaben {
  return {
    tankmengeLiter: 40,
    verbrauchLper100km: 6.5,
    kraftstoff: 'DIE',
    zeitwertProStunde: 0,
    direktZumZiel: KEINE_STRECKE,
    ...over,
  };
}

// --------------------------------------------------------------------------
// Die zentrale Zahlenprobe: lohnt sich der weitere Weg?
//
// A: 1 km weg, 1,529 €/l   |   B: 6 km weg, 1,449 €/l   |   6,5 l/100km
// --------------------------------------------------------------------------
describe('Kernfall: weiter fahren oder nicht', () => {
  const A = station({ id: 'A', name: 'Nah & teuer', preise: { DIE: 1.529 } });
  const B = station({ id: 'B', name: 'Weit & billig', preise: { DIE: 1.449 } });
  const stationen = [A, B];
  const strecken = new Map([
    ['A', hinUndZurueck(1)],
    ['B', hinUndZurueck(6)],
  ]);

  it('bei 40 Litern gewinnt die weiter entfernte, billigere Tankstelle', () => {
    const { bewertungen, referenz } = bewerte(stationen, strecken, eingaben({ tankmengeLiter: 40 }));

    expect(bewertungen[0].station.id).toBe('B');
    // A ist die nächstgelegene, also der Vergleichsmaßstab.
    expect(referenz?.station.id).toBe('A');
    // 40 x 0,08 € Preisvorteil = 3,20 €, abzüglich 0,93 € Mehrverbrauch für
    // 10 km zusätzlichen Umweg.
    expect(bewertungen[0].ersparnisGegenReferenz).toBeCloseTo(2.27, 2);
    expect(bewertungen[0].lohntSich).toBe(true);
  });

  it('bei 10 Litern gewinnt die nächstgelegene Tankstelle', () => {
    const { bewertungen } = bewerte(stationen, strecken, eingaben({ tankmengeLiter: 10 }));

    expect(bewertungen[0].station.id).toBe('A');
    expect(bewertungen[0].istReferenz).toBe(true);
  });

  it('nennt den Kipppunkt zwischen beiden Mengen', () => {
    const { bewertungen } = bewerte(stationen, strecken, eingaben());
    const b = bewertungen.find((x) => x.station.id === 'B')!;

    // Muss zwischen den beiden getesteten Mengen liegen — sonst widersprächen
    // sich die zwei Tests oben.
    expect(b.breakEvenLiter).toBeGreaterThan(10);
    expect(b.breakEvenLiter).toBeLessThan(40);
    expect(b.breakEvenLiter).toBeCloseTo(11.64, 2);
  });

  it('rechnet Zeit mit, wenn ein Zeitwert gesetzt ist', () => {
    // 12 km Umweg bei 40 km/h = 18 Minuten. Bei 20 €/h sind das 6 € —
    // mehr als die 2,27 € Ersparnis. Damit dreht sich das Ergebnis.
    const { bewertungen } = bewerte(
      stationen,
      strecken,
      eingaben({ zeitwertProStunde: 20 }),
    );

    expect(bewertungen[0].station.id).toBe('A');
    expect(bewertungen[0].zeitKosten).toBeGreaterThan(0);
  });

  it('setzt Zeitkosten auf 0, wenn kein Zeitwert gesetzt ist', () => {
    const { bewertungen } = bewerte(stationen, strecken, eingaben({ zeitwertProStunde: 0 }));
    expect(bewertungen.every((b) => b.zeitKosten === 0)).toBe(true);
  });
});

// --------------------------------------------------------------------------
describe('Umwegberechnung', () => {
  it('ist die doppelte Entfernung, wenn das Ziel der Startpunkt ist', () => {
    expect(umwegKm(hinUndZurueck(4), KEINE_STRECKE)).toBeCloseTo(8, 6);
  });

  it('zieht die ohnehin gefahrene Strecke ab (Tanken auf dem Arbeitsweg)', () => {
    // 10 km zur Tankstelle, 12 km weiter zum Ziel, direkt wären es 20 km:
    // echter Umweg sind nur 2 km.
    const info: StreckenInfo = { vomStart: strecke(10), zumZiel: strecke(12) };
    expect(umwegKm(info, strecke(20))).toBeCloseTo(2, 6);
  });

  it('wird nie negativ, auch wenn die Schätzung danebenliegt', () => {
    const info: StreckenInfo = { vomStart: strecke(5), zumZiel: strecke(5) };
    expect(umwegKm(info, strecke(20))).toBe(0);
  });
});

// --------------------------------------------------------------------------
describe('Kipppunkt (breakEvenLiter)', () => {
  const basis = { umwegLiter: 0, zeitKosten: 0 };

  it('gibt es nicht, wenn der Preis gleich ist', () => {
    const s = { ...basis, preis: 1.5, umwegLiter: 0.5 };
    const r = { ...basis, preis: 1.5 };
    expect(breakEvenLiter(s as never, r as never)).toBeNull();
  });

  it('gibt es nicht, wenn die Tankstelle teurer ist', () => {
    const s = { ...basis, preis: 1.6 };
    const r = { ...basis, preis: 1.5 };
    expect(breakEvenLiter(s as never, r as never)).toBeNull();
  });

  it('ist 0, wenn sie billiger ist und gar keinen Umweg kostet', () => {
    const s = { ...basis, preis: 1.4 };
    const r = { ...basis, preis: 1.5, umwegLiter: 0.5 };
    expect(breakEvenLiter(s as never, r as never)).toBe(0);
  });
});

// --------------------------------------------------------------------------
describe('Aussortieren', () => {
  const strecken = new Map([
    ['A', hinUndZurueck(1)],
    ['B', hinUndZurueck(2)],
  ]);

  it('überspringt Tankstellen ohne Preis für den gewählten Kraftstoff', () => {
    const stationen = [
      station({ id: 'A', preise: { SUP: 1.6 } }),
      station({ id: 'B', preise: { DIE: 1.5 } }),
    ];
    const { bewertungen, aussortiert } = bewerte(stationen, strecken, eingaben());

    expect(bewertungen.map((b) => b.station.id)).toEqual(['B']);
    expect(aussortiert).toBe(1);
  });

  it('überspringt geschlossene Tankstellen', () => {
    const stationen = [station({ id: 'A', offen: false }), station({ id: 'B' })];
    const { bewertungen, aussortiert } = bewerte(stationen, strecken, eingaben());

    expect(bewertungen.map((b) => b.station.id)).toEqual(['B']);
    expect(aussortiert).toBe(1);
  });

  it('überspringt Tankstellen ohne bekannte Strecke', () => {
    const stationen = [station({ id: 'A' }), station({ id: 'C' })];
    const { bewertungen, aussortiert } = bewerte(stationen, strecken, eingaben());

    expect(bewertungen.map((b) => b.station.id)).toEqual(['A']);
    expect(aussortiert).toBe(1);
  });

  it('kommt mit einer leeren Liste klar', () => {
    const { bewertungen, referenz } = bewerte([], new Map(), eingaben());
    expect(bewertungen).toEqual([]);
    expect(referenz).toBeNull();
  });

  it('kommt damit klar, dass alles aussortiert wird', () => {
    const { bewertungen, referenz, aussortiert } = bewerte(
      [station({ id: 'A', offen: false })],
      strecken,
      eingaben(),
    );
    expect(bewertungen).toEqual([]);
    expect(referenz).toBeNull();
    expect(aussortiert).toBe(1);
  });
});

// --------------------------------------------------------------------------
describe('Referenz und Kennzeichnung', () => {
  it('nimmt immer die nächstgelegene Tankstelle als Maßstab, nicht die billigste', () => {
    const stationen = [
      station({ id: 'fern', preise: { DIE: 1.4 } }),
      station({ id: 'nah', preise: { DIE: 1.7 } }),
    ];
    const strecken = new Map([
      ['fern', hinUndZurueck(9)],
      ['nah', hinUndZurueck(1)],
    ]);

    const { referenz } = bewerte(stationen, strecken, eingaben());
    expect(referenz?.station.id).toBe('nah');
    expect(referenz?.ersparnisGegenReferenz).toBe(0);
    expect(referenz?.breakEvenLiter).toBeNull();
  });

  it('markiert eine Mini-Ersparnis als "lohnt nicht"', () => {
    const stationen = [
      station({ id: 'nah', preise: { DIE: 1.5 } }),
      station({ id: 'fern', preise: { DIE: 1.499 } }),
    ];
    const strecken = new Map([
      ['nah', hinUndZurueck(1)],
      ['fern', hinUndZurueck(2)],
    ]);

    const { bewertungen } = bewerte(stationen, strecken, eingaben());
    const fern = bewertungen.find((b) => b.station.id === 'fern')!;

    expect(fern.ersparnisGegenReferenz).toBeLessThan(0.5);
    expect(fern.lohntSich).toBe(false);
  });

  it('reicht durch, dass eine Strecke nur geschätzt war', () => {
    const strecken = new Map<string, StreckenInfo>([
      ['A', { vomStart: { km: 1, minuten: 2, geschaetzt: true }, zumZiel: strecke(1) }],
    ]);
    const { bewertungen } = bewerte([station({ id: 'A' })], strecken, eingaben());
    expect(bewertungen[0].geschaetzt).toBe(true);
  });
});
