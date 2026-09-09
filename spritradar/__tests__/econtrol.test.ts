import { mapStation } from '@/api/econtrol';
import fixture from '@/fixtures/econtrol-wien.json';

describe('mapStation gegen die aufgezeichnete Antwort', () => {
  it('übersetzt jeden Eintrag der Fixture', () => {
    const stationen = fixture.map(mapStation);
    expect(stationen.every((s) => s !== null)).toBe(true);
    expect(stationen).toHaveLength(fixture.length);
  });

  it('holt Name, Adresse, Koordinaten und Preise heraus', () => {
    const s = mapStation(fixture[0])!;

    expect(s.id).toBe('1000');
    expect(s.name).toBe('Turmöl Triester Straße');
    expect(s.marke).toBe('Turmöl');
    expect(s.adresse).toBe('Triester Straße 62');
    expect(s.plz).toBe('1100');
    expect(s.ort).toBe('Wien');
    expect(s.lat).toBeCloseTo(48.1712, 4);
    expect(s.lon).toBeCloseTo(16.3532, 4);
    expect(s.offen).toBe(true);
    expect(s.preise.DIE).toBeCloseTo(1.429, 3);
    expect(s.preise.SUP).toBeCloseTo(1.539, 3);
    expect(s.standAktualisiert).toBeTruthy();
  });

  it('lässt fehlende Kraftstoffe einfach weg', () => {
    // In der Fixture führt nur jede fünfte Tankstelle Autogas.
    const mitGas = fixture.map(mapStation).filter((s) => s!.preise.GAS !== undefined);
    expect(mitGas.length).toBeGreaterThan(0);
    expect(mitGas.length).toBeLessThan(fixture.length);
  });
});

describe('mapStation ist robust gegen abweichende Antworten', () => {
  it('verwirft Einträge ohne ID', () => {
    expect(mapStation({ location: { latitude: 48, longitude: 16 } })).toBeNull();
  });

  it('verwirft Einträge ohne Koordinaten', () => {
    expect(mapStation({ id: 7, name: 'Ohne Ort' })).toBeNull();
  });

  it('verwirft Unsinn, ohne abzustürzen', () => {
    expect(mapStation(null)).toBeNull();
    expect(mapStation('kaputt')).toBeNull();
    expect(mapStation(42)).toBeNull();
    expect(mapStation([])).toBeNull();
  });

  it('kommt auch mit flacher Adresse statt "location" klar', () => {
    const s = mapStation({
      id: 'x1',
      name: 'Flach',
      lat: 48.2,
      lng: 16.37,
      prices: [{ fuelType: 'DIE', amount: 1.5 }],
    });

    expect(s?.lat).toBe(48.2);
    expect(s?.lon).toBe(16.37);
    expect(s?.preise.DIE).toBe(1.5);
  });

  it('versteht Preise, die als Text mit Komma kommen', () => {
    const s = mapStation({
      id: 'x2',
      lat: 48,
      lon: 16,
      prices: [{ fuelType: 'die', amount: '1,459' }],
    });

    expect(s?.preise.DIE).toBeCloseTo(1.459, 3);
  });

  it('erkennt Kraftstoffe unabhängig von Schreibweise und Zusätzen', () => {
    const s = mapStation({
      id: 'x3',
      lat: 48,
      lon: 16,
      prices: [
        { fuelType: 'Diesel', amount: 1.4 },
        { fuelType: 'SUPER_95', amount: 1.5 },
        { fuelType: 'LPG', amount: 0.9 },
      ],
    });

    expect(s?.preise).toEqual({ DIE: 1.4, SUP: 1.5, GAS: 0.9 });
  });

  it('wirft Preise von 0 oder darunter weg', () => {
    const s = mapStation({
      id: 'x4',
      lat: 48,
      lon: 16,
      prices: [
        { fuelType: 'DIE', amount: 0 },
        { fuelType: 'SUP', amount: -1 },
      ],
    });

    expect(s?.preise).toEqual({});
  });

  it('nimmt "geschlossen" ernst, wenn das Feld da ist', () => {
    const zu = mapStation({ id: 'x5', lat: 48, lon: 16, open: false });
    expect(zu?.offen).toBe(false);

    // Fehlt das Feld, gehen wir von offen aus — wir fragen mit
    // includeClosed=false an, geschlossene kämen gar nicht erst zurück.
    const ohne = mapStation({ id: 'x6', lat: 48, lon: 16 });
    expect(ohne?.offen).toBe(true);
  });

  it('kommt ohne Preisliste klar', () => {
    const s = mapStation({ id: 'x7', lat: 48, lon: 16 });
    expect(s?.preise).toEqual({});
    expect(s?.name).toBe('Tankstelle');
  });
});
