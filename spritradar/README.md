# SpritRadar

Findet die Tankstelle mit den **niedrigsten Gesamtkosten** — der Umweg ist schon
eingerechnet.

Der Punkt der App: Der niedrigste Literpreis ist nicht automatisch der beste
Deal. Acht Cent billiger sind schnell aufgefressen, wenn du dafür zwölf
Kilometer weiter fahren musst. SpritRadar rechnet den Umweg-Sprit (und auf
Wunsch deine Zeit) gegen und sortiert danach.

Preise kommen von der amtlichen [E-Control](https://www.spritpreisrechner.at)
Datenbank für Österreich. Kein API-Schlüssel, kein Konto, keine Kosten.

---

## Schnellstart

Voraussetzung: Node 20 oder neuer, dazu die App **Expo Go** auf deinem Handy
(App Store bzw. Play Store, gratis, kein Konto nötig).

```powershell
npm install
npx expo start
```

QR-Code mit Expo Go scannen (Android) bzw. mit der Kamera-App (iPhone).
Rechner und Handy müssen im selben WLAN sein.

Handy nicht im selben Netz? Dann `npx expo start --tunnel` — langsamer, geht
aber über Mobilfunk.

### Ohne Internet ausprobieren

```powershell
$env:EXPO_PUBLIC_MOCK=1 ; npx expo start
```

Dann kommen die Preise aus einer gespeicherten Beispielantwort
(`src/fixtures/econtrol-wien.json`) statt von E-Control, und der Standort ist
fix Wien. Praktisch zum Entwickeln, wenn kein Netz da ist. Die App zeigt in
diesem Fall oben einen Hinweis, damit du die Testdaten nicht für echt hältst.

### Nützliche Befehle

| Befehl | Was es tut |
| --- | --- |
| `npm start` | App starten (QR-Code für Expo Go) |
| `npm test` | Tests der Rechenlogik |
| `npm run typecheck` | TypeScript prüfen, ohne zu bauen |
| `npm run probe` | Echte E-Control-Antwort abrufen und prüfen |
| `npm run lint` | Code-Stil prüfen (richtet sich beim ersten Lauf ein, braucht dafür Internet) |

---

## Wie gerechnet wird

Für jede Tankstelle:

```
umwegKm     = Weg hin + Weg weiter zum Ziel − Weg, den du ohnehin fährst
              (Ziel = Startpunkt  →  umwegKm = 2 × Entfernung)

umwegLiter  = umwegKm / 100 × dein Verbrauch
umwegKosten = umwegLiter × Literpreis dieser Tankstelle
zeitKosten  = Umweg-Minuten / 60 × dein Stundensatz

GESAMT      = Tankmenge × Literpreis + umwegKosten + zeitKosten
```

Sortiert wird nach `GESAMT`, nicht nach dem Literpreis.

Der **Umweg-Sprit wird mit dem Preis dieser Tankstelle** gerechnet, weil du ihn
genau dort mittankst.

**Vergleichsmaßstab** ist immer die *nächstgelegene* passende Tankstelle — die,
zu der du ohne App gefahren wärst. Nur so ist die angezeigte Ersparnis ehrlich.

**Kipppunkt:** Weil die Umwegkosten fix sind, die Ersparnis aber mit der
Tankmenge wächst, gibt es eine Menge, ab der sich der Umweg lohnt. Die App
nennt sie: *„Lohnt sich ab 11,6 l Tankmenge."*

Ein Beispiel, das als Test festgeschrieben ist
(`__tests__/calc.test.ts`): Tankstelle A liegt 1 km weg und kostet € 1,529;
Tankstelle B liegt 6 km weg und kostet € 1,449; Verbrauch 6,5 l/100km.

* Bei **40 Litern** gewinnt B — Ersparnis € 2,27.
* Bei **10 Litern** gewinnt A.
* Der Kipppunkt liegt bei 11,6 Litern.

Der reine Preisunterschied wären bei 40 Litern € 3,20 — die 10 km zusätzlicher
Umweg fressen davon 93 Cent.

---

## Welche Datei macht was

```
src/
  lib/calc.ts        ★ Die Rechnung. Reine Funktionen, kein React, kein Netz.
                       Hier anfangen, wenn du verstehen willst, was die App tut.
  lib/geo.ts           Luftlinie (Haversine), Umwegfaktor, Rasterpunkte.
  lib/format.ts        Zahlen für die Anzeige: "€ 1,449", "4,2 km", "18 Min".
  lib/types.ts         Die gemeinsamen Datentypen.

  api/econtrol.ts      Preise von E-Control holen und übersetzen.
  api/osrm.ts          Fahrstrecken und Fahrzeiten, mit Schätzung als Rückfall.
  api/mock.ts          Umschalter auf die gespeicherten Testdaten.

  data/cars.ts         Fahrzeugliste. HIER trägst du dein Auto ein.
  state/settings.ts    Einstellungen, gespeichert mit AsyncStorage.
  state/use-suche.ts   Der Ablauf: laden → Strecken → rechnen.
  state/use-standort.ts  GPS und Berechtigungen.

  app/index.tsx        Hauptbildschirm.
  app/einstellungen.tsx  Auto, Verbrauch, Radius, Zeitwert.
  app/tankstelle/[id].tsx  Detail mit Kostenaufschlüsselung.

  components/ui.tsx    Panel, Knopf, Auswahl, Zahlenfeld.
```

`app/` ist Navigation über Dateinamen (expo-router): Eine Datei dort ist ein
Bildschirm, `[id]` in eckigen Klammern ist ein Platzhalter in der Adresse.

---

## Dein Auto fehlt?

Zwei Wege:

1. **Schnell:** In den Einstellungen unter „Verbrauch" einfach deinen echten
   Wert eintragen. Der schlägt jede Liste.
2. **Dauerhaft:** In `src/data/cars.ts` ergänzen. Das Format steht oben in der
   Datei; ein Eintrag ist eine Zeile:

   ```ts
   ['2.0 TDI 150 PS', 'DIE', 4.9],
   ```

Die Werte in der Liste sind Herstellerangaben. Der Schalter „Realverbrauch"
schlägt 15 % drauf, weil real praktisch niemand die Werksangabe erreicht.

---

## Wenn die Preise nicht stimmen

Diese App wurde ohne Zugriff auf die echte E-Control-Schnittstelle gebaut — das
Antwortformat ist aus der Dokumentation abgeleitet, nicht gemessen. Falls also
etwas fehlt oder leer bleibt:

```powershell
npm run probe
```

Das holt eine echte Antwort, legt sie unter `src/fixtures/econtrol-echt.json`
ab und sagt dir, welche Felder tatsächlich geliefert werden. Anzupassen ist
dann **nur** die Funktion `mapStation()` in `src/api/econtrol.ts` — die
Übersetzung von deren Format in unseres steckt vollständig dort.

### Warum nur wenige Tankstellen kommen

E-Control liefert pro Anfrage gesetzlich nur die **fünf billigsten**. Die App
fragt deshalb mehrere Punkte im Umkreis ab und führt die Ergebnisse zusammen.
Größerer Suchradius in den Einstellungen = mehr Treffer, aber längeres Laden.

### Wenn „Strecken geschätzt" dasteht

Dann war der Routing-Server (OSRM) nicht erreichbar und die App hat die
Luftlinie mal 1,3 gerechnet. Die Reihenfolge stimmt meistens trotzdem; die
Kilometer sind dann eben ungefähr.

---

## Später: dauerhaft aufs Handy

Expo Go reicht zum Benutzen, solange der Rechner läuft. Willst du die App
unabhängig davon installieren:

* **Android:** Eine APK-Datei bauen und direkt installieren — dauerhaft
  kostenlos. Dafür braucht es ein Expo-Konto (gratis) und
  `npx eas build -p android --profile preview`.
* **iPhone:** Eine dauerhaft installierte App braucht entweder einen
  Apple-Developer-Account (99 $/Jahr) oder Neusignieren alle 7 Tage über einen
  Mac mit Xcode. Zum Benutzen über Expo Go ist beides nicht nötig.

---

## Falls Expo zickt

Node 24 sollte laufen. Falls der Bundler doch Probleme macht, ist Node 22 der
besser abgehangene Weg:

```powershell
winget install CoreyButler.NVMforWindows
nvm install 22
nvm use 22
```

Danach einmal `node_modules` löschen und `npm install` neu laufen lassen.

---

## Datenschutz

Alles bleibt auf dem Gerät. Die App schickt deinen Standort an E-Control und
OSRM, um Tankstellen und Strecken zu finden — sonst an niemanden. Es gibt kein
Konto, kein Tracking und keinen eigenen Server.
