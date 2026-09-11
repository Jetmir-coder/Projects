import { effektiverVerbrauch, findeMotor, ALLE_MOTOREN, MARKEN } from '@/data/cars';
import { STANDARD, istUneingerichtet, verbrauchVon, zusammenfuehren } from '@/state/settings';

describe('Fahrzeugliste', () => {
  it('hat Marken, Modelle und Motoren', () => {
    expect(MARKEN.length).toBeGreaterThan(10);
    expect(ALLE_MOTOREN.length).toBeGreaterThan(50);
  });

  it('vergibt eindeutige IDs', () => {
    const ids = ALLE_MOTOREN.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('hat für jeden Motor einen plausiblen Verbrauch', () => {
    for (const motor of ALLE_MOTOREN) {
      expect(motor.verbrauch).toBeGreaterThan(2);
      expect(motor.verbrauch).toBeLessThan(20);
    }
  });

  it('findet einen Motor über seine ID wieder', () => {
    const motor = ALLE_MOTOREN[0];
    expect(findeMotor(motor.id)).toEqual(motor);
    expect(findeMotor('gibtsnicht')).toBeUndefined();
    expect(findeMotor(null)).toBeUndefined();
  });

  it('schlägt beim Realverbrauch 15 % auf', () => {
    expect(effektiverVerbrauch(5, false)).toBe(5);
    expect(effektiverVerbrauch(5, true)).toBeCloseTo(5.75, 6);
  });
});

describe('Gespeicherte Einstellungen einlesen', () => {
  it('nimmt die Standardwerte bei Unsinn', () => {
    expect(zusammenfuehren(null)).toEqual(STANDARD);
    expect(zusammenfuehren('kaputt')).toEqual(STANDARD);
    expect(zusammenfuehren({})).toEqual(STANDARD);
  });

  it('übernimmt gültige Werte', () => {
    const e = zusammenfuehren({ tankmengeLiter: 55, radiusKm: 12, zeitwertProStunde: 25 });
    expect(e.tankmengeLiter).toBe(55);
    expect(e.radiusKm).toBe(12);
    expect(e.zeitwertProStunde).toBe(25);
  });

  it('stutzt Werte auf den erlaubten Bereich zurecht', () => {
    expect(zusammenfuehren({ tankmengeLiter: 9999 }).tankmengeLiter).toBe(200);
    expect(zusammenfuehren({ radiusKm: -5 }).radiusKm).toBe(1);
    expect(zusammenfuehren({ zeitwertProStunde: -1 }).zeitwertProStunde).toBe(0);
  });

  it('verwirft einen unbekannten Kraftstoff', () => {
    expect(zusammenfuehren({ kraftstoff: 'WASSERSTOFF' }).kraftstoff).toBe(STANDARD.kraftstoff);
    expect(zusammenfuehren({ kraftstoff: 'SUP' }).kraftstoff).toBe('SUP');
  });

  it('verwirft einen unsinnigen eigenen Verbrauch', () => {
    expect(zusammenfuehren({ eigenerVerbrauch: 0 }).eigenerVerbrauch).toBeNull();
    expect(zusammenfuehren({ eigenerVerbrauch: -3 }).eigenerVerbrauch).toBeNull();
    expect(zusammenfuehren({ eigenerVerbrauch: 6.4 }).eigenerVerbrauch).toBe(6.4);
  });
});

describe('Welcher Verbrauch wird gerechnet', () => {
  const motor = ALLE_MOTOREN.find((m) => m.kraftstoff === 'DIE')!;

  it('nimmt den Wert aus der Fahrzeugliste', () => {
    const e = { ...STANDARD, motorId: motor.id, realverbrauch: false };
    expect(verbrauchVon(e)).toBe(motor.verbrauch);
  });

  it('schlägt den Realverbrauch auf, wenn eingeschaltet', () => {
    const e = { ...STANDARD, motorId: motor.id, realverbrauch: true };
    expect(verbrauchVon(e)).toBeCloseTo(motor.verbrauch * 1.15, 6);
  });

  it('lässt den eigenen Wert immer gewinnen', () => {
    const e = { ...STANDARD, motorId: motor.id, realverbrauch: true, eigenerVerbrauch: 9.1 };
    expect(verbrauchVon(e)).toBe(9.1);
  });

  it('hat einen brauchbaren Startwert, solange nichts gewählt ist', () => {
    expect(verbrauchVon(STANDARD)).toBe(7);
    expect(istUneingerichtet(STANDARD)).toBe(true);
    expect(istUneingerichtet({ ...STANDARD, motorId: motor.id })).toBe(false);
    expect(istUneingerichtet({ ...STANDARD, eigenerVerbrauch: 6 })).toBe(false);
  });
});
