/**
 * Geometrie auf der Erdkugel — reine Mathematik, kein Netz, kein React.
 */

import type { Punkt } from './types';

const ERDRADIUS_KM = 6371;

/**
 * Faktor, mit dem wir die Luftlinie auf eine realistische Fahrstrecke
 * hochrechnen, wenn kein Routing-Server erreichbar ist. Straßen sind nun mal
 * nicht gerade. 1,3 ist der gängige Erfahrungswert für Stadt- und Landstraßen.
 */
export const UMWEGFAKTOR = 1.3;

/** Angenommene Durchschnittsgeschwindigkeit für die Zeitschätzung. */
export const ANNAHME_KMH = 40;

const grad2rad = (grad: number) => (grad * Math.PI) / 180;

/**
 * Luftlinie zwischen zwei Punkten in Kilometern (Haversine-Formel).
 *
 * Das ist die Standardformel für Abstände auf einer Kugel. Sie ist auf ein paar
 * Meter genau — für unseren Zweck weit mehr als genug.
 */
export function luftlinieKm(a: Punkt, b: Punkt): number {
  const dLat = grad2rad(b.lat - a.lat);
  const dLon = grad2rad(b.lon - a.lon);
  const lat1 = grad2rad(a.lat);
  const lat2 = grad2rad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * ERDRADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Grobe Schätzung der Fahrstrecke, wenn OSRM nicht antwortet.
 * Immer als `geschaetzt: true` markiert, damit die UI das kennzeichnen kann.
 */
export function geschaetzteStrecke(a: Punkt, b: Punkt) {
  const km = luftlinieKm(a, b) * UMWEGFAKTOR;
  return {
    km,
    minuten: (km / ANNAHME_KMH) * 60,
    geschaetzt: true as const,
  };
}

/**
 * Punkte für die Raster-Abfrage.
 *
 * Hintergrund: E-Control liefert pro Anfrage gesetzlich nur die fünf billigsten
 * Tankstellen. Fragt man nur den eigenen Standort ab, sieht man fünf Stück und
 * sonst nichts. Darum fragen wir zusätzlich einen Ring von Punkten rundherum ab
 * und werfen die Doppelten später über die ID raus.
 *
 * Ergebnis: Zentrum + `anzahl` Punkte auf einem Kreis mit `radiusKm`.
 */
export function rasterPunkte(zentrum: Punkt, radiusKm: number, anzahl = 6): Punkt[] {
  const punkte: Punkt[] = [zentrum];
  if (radiusKm <= 0 || anzahl <= 0) return punkte;

  // Ein Breitengrad ist überall ~111 km. Ein Längengrad schrumpft Richtung Pol,
  // deshalb die Division durch cos(Breite).
  const kmProGradLat = 111.32;
  const kmProGradLon = 111.32 * Math.cos(grad2rad(zentrum.lat));

  // Etwas innerhalb des Radius abfragen, sonst liegen die Treffer am Rand.
  const r = radiusKm * 0.7;

  for (let i = 0; i < anzahl; i++) {
    const winkel = (2 * Math.PI * i) / anzahl;
    punkte.push({
      lat: zentrum.lat + (r * Math.cos(winkel)) / kmProGradLat,
      lon: zentrum.lon + (r * Math.sin(winkel)) / kmProGradLon,
    });
  }

  return punkte;
}
