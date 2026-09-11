import { luftlinieKm, rasterPunkte, geschaetzteStrecke, UMWEGFAKTOR } from '@/lib/geo';

const WIEN = { lat: 48.2082, lon: 16.3738 };
const GRAZ = { lat: 47.0707, lon: 15.4395 };

describe('luftlinieKm', () => {
  it('ist 0 für denselben Punkt', () => {
    expect(luftlinieKm(WIEN, WIEN)).toBe(0);
  });

  it('trifft die bekannte Distanz Wien–Graz (~145 km Luftlinie)', () => {
    expect(luftlinieKm(WIEN, GRAZ)).toBeCloseTo(145, 0);
  });

  it('ist symmetrisch', () => {
    expect(luftlinieKm(WIEN, GRAZ)).toBeCloseTo(luftlinieKm(GRAZ, WIEN), 9);
  });
});

describe('geschaetzteStrecke', () => {
  it('rechnet die Luftlinie mit dem Umwegfaktor hoch und markiert sich als Schätzung', () => {
    const s = geschaetzteStrecke(WIEN, GRAZ);
    expect(s.km).toBeCloseTo(luftlinieKm(WIEN, GRAZ) * UMWEGFAKTOR, 6);
    expect(s.geschaetzt).toBe(true);
    expect(s.minuten).toBeGreaterThan(0);
  });
});

describe('rasterPunkte', () => {
  it('liefert das Zentrum plus den gewünschten Ring', () => {
    const punkte = rasterPunkte(WIEN, 5, 6);
    expect(punkte).toHaveLength(7);
    expect(punkte[0]).toEqual(WIEN);
  });

  it('legt alle Ringpunkte innerhalb des Radius', () => {
    const radius = 5;
    for (const p of rasterPunkte(WIEN, radius, 6).slice(1)) {
      expect(luftlinieKm(WIEN, p)).toBeLessThan(radius);
    }
  });

  it('liefert nur das Zentrum, wenn kein Radius gesetzt ist', () => {
    expect(rasterPunkte(WIEN, 0)).toEqual([WIEN]);
  });
});
