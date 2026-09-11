# Übergabe — Stand der Arbeit

Dieses Dokument sagt, **wo wir stehen und was als Nächstes dran ist**.
Wie die App funktioniert, steht im [README](README.md).

Stand: 9. September 2026 · Commit `42ebdf4`

---

## Wo wir stehen

Die App ist fertig gebaut und gepusht. Geprüft wurde:

* `npx tsc --noEmit` — sauber
* `npm test` — 52 Tests grün
* Android-Bundle baut durch
* Weblauf im Browser komplett durchgeklickt: Auto wählen → Empfehlung →
  Detailansicht, hell und dunkel

**Was nicht geprüft ist — und das ist der springende Punkt:**

* Die App ist **noch nie auf einem echten Handy gelaufen**.
* Die **echten E-Control-Daten wurden nie gesehen**. Beim Bauen war deren
  Server nicht erreichbar. Alles lief gegen gespeicherte Testdaten.

Beides braucht einen Rechner mit Internet und ein Handy. Deshalb liegt es beim
Nutzer, nicht am Code.

---

## Wo der Code liegt

| | |
| --- | --- |
| Repository | `Jetmir-coder/Projects` |
| Branch | `claude/spritpreise-vergleich-app-bn8tyt` |
| Pull Request | #1 — **offen, nicht gemergt** |
| Ordner | `spritradar/` |

> **Achtung, das hat schon einmal Zeit gekostet:** Auf `main` liegt nur der
> Ordner `Questions`. Die App gibt es dort **nicht**. Wer `main` auscheckt,
> sieht kein `spritradar/` und denkt, das Klonen sei schiefgegangen.

Richtig klonen:

```
git clone -b claude/spritpreise-vergleich-app-bn8tyt https://github.com/Jetmir-coder/Projects.git
```

Schon geklont und auf dem falschen Branch:

```
git checkout claude/spritpreise-vergleich-app-bn8tyt
```

Solange PR #1 offen ist, bleibt das so. Nach dem Mergen liegt alles auf `main`.

---

## Als Nächstes, in dieser Reihenfolge

Nicht überspringen — jeder Schritt beantwortet genau eine Frage, und wenn
Schritt 1 scheitert, sagt Schritt 2 nichts Brauchbares.

**1. Läuft die App überhaupt am Handy?**
Mit Testdaten starten. Keine Internetverbindung nötig, kein Login.
Erfolg sieht so aus: Titel „SpritRadar", oranger Kasten „Testbetrieb", darunter
eine grüne Karte „Du sparst € …".

**2. Kommen echte Preise an?**
Ohne Testdaten starten, Standortfreigabe erlauben.
Erfolg: echte Tankstellen aus der Umgebung mit echten Preisen. Kein oranger
Kasten mehr.

**3. Stimmt das Feldformat?**
`npm run probe`. Das holt eine echte Antwort von E-Control, legt sie unter
`src/fixtures/econtrol-echt.json` ab und listet Feld für Feld auf, was
tatsächlich kommt. **Zeilen mit `FEHLT` sind das Ergebnis, auf das es ankommt.**

---

## Die Befehle

Der Nutzer arbeitet in **cmd** (das Fenster zeigt `C:\...>`). PowerShell zeigt
`PS C:\...>`. Die beiden setzen Umgebungsvariablen unterschiedlich — deshalb
hier beide Fassungen. Falsche Fassung = Fehlermeldung „Die Syntax für den
Dateinamen … ist falsch."

### cmd

```
cd C:\Dev\Projects\spritradar
npm install

REM  1. mit Testdaten
set EXPO_PUBLIC_MOCK=1
npx expo start --offline

REM  2. mit echten Daten  (vorher Strg+C)
set EXPO_PUBLIC_MOCK=
npx expo start

REM  3. Feldformat prüfen
npm run probe
```

`set NAME=` ohne Wert löscht die Variable wieder. Ein neues Fenster löscht sie
ebenfalls — sie gilt nur im laufenden Fenster.

### PowerShell

```powershell
$env:EXPO_PUBLIC_MOCK = '1'      # setzen
Remove-Item Env:\EXPO_PUBLIC_MOCK  # löschen
```

### Wozu `--offline`

Ohne diesen Zusatz will Expo bei jedem Start seine Server fragen, wer du bist,
und besteht darauf, dass du am Rechner und in der Handy-App **im selben Konto**
angemeldet bist. Das hat uns eine ganze Runde gekostet. `--offline` überspringt
die Abfrage komplett und funktioniert auch, wenn der Rechner gerade kein
Internet hat.

Für Schritt 2 lässt man es weg, weil dort ohnehin Internet gebraucht wird —
falls Expo dann wieder nach dem Login fragt, einfach `--offline` wieder
dazuschreiben. Die Preisabfrage der App ist davon nicht betroffen.

---

## Stolpersteine, die uns schon erwischt haben

**Die App wird nicht aufs iPhone installiert.**
Der PC ist der Server, Expo Go am Handy ist nur das Abspielgerät. PC-Fenster
zu = App am Handy tot. Beide Geräte müssen im selben WLAN sein. Geht das nicht:
`npx expo start --tunnel` (langsamer, läuft über Mobilfunk).

**QR-Code am iPhone: mit der normalen Kamera-App scannen.**
In Expo Go gibt es auf iOS keinen Scan-Knopf. Kamera draufhalten, oben
erscheint „In Expo Go öffnen", antippen.

**Windows-Firewall.**
Beim allerersten Start fragt Windows nach. Zugriff zulassen, sonst findet das
Handy den Rechner nicht.

**`git checkout main` bricht ab** mit „local changes would be overwritten:
spritradar/package.json, spritradar/package-lock.json". Das war nur `npm
install`, das die Dateien minimal angefasst hat. Harmlos, wegräumen mit:

```
git checkout -- spritradar/package.json spritradar/package-lock.json
```

**`git pull` sagt „Could not resolve host: github.com".**
Kein Git-Problem — der Rechner hatte in dem Moment kein Internet. Später
nochmal.

---

## Was als Nächstes kaputtgeht — und wo man es repariert

Die wahrscheinlichste Baustelle ist das **Antwortformat von E-Control**. Der
Code erwartet Felder, die aus der Dokumentation abgeleitet und nie gemessen
wurden. Wenn Tankstellen ohne Preis ankommen, gar keine ankommen, oder Namen
leer bleiben, liegt es fast sicher daran.

Reparatur findet an **genau einer Stelle** statt:

> `mapStation()` in `src/api/econtrol.ts`

Das ist die einzige Funktion im ganzen Projekt, die fremde Feldnamen kennt.
Sie ist absichtlich nachsichtig gebaut (`feld(obj, 'name1', 'name2', …)`), also
reicht meist, einen weiteren Namen in die Liste aufzunehmen. Alles dahinter —
Rechnung, Anzeige, Tests — arbeitet nur noch mit unseren eigenen Typen und
bleibt unangetastet.

`npm run probe` sagt dir, welche Namen einzutragen sind.

---

## Landkarte

Die Dateiübersicht steht im [README](README.md#welche-datei-macht-was). Zwei
Merksätze dazu:

* Fragen zur **Rechnung** beginnen immer in `src/lib/calc.ts`. Reine Funktionen,
  kein React, kein Netz — dort kann man alles nachvollziehen und alles testen.
* Fragen zu **fremden Daten** beginnen in `src/api/`. Nur diese drei Dateien
  reden mit der Außenwelt.

Zahlen zum Nachprüfen, falls jemand am Rechenkern schraubt (steht als Test in
`__tests__/calc.test.ts`): Beispiel A/B, 40 Liter → Ersparnis **2,27 €**,
Kipppunkt **11,6 Liter**. Die 3,20 € sind nur der Preisunterschied *vor* Abzug
des Umweg-Sprits — nicht verwechseln.

---

## Offene Ideen

Nichts davon ist beauftragt, alles wäre der nächste sinnvolle Schritt:

* **Tanken auf dem Arbeitsweg** statt Hin- und Rückfahrt. Der Rechenkern kann
  das bereits (`direktZumZiel` in `calc.ts`), es fehlt nur ein Eingabefeld für
  das Ziel in der Oberfläche. Der kleinste Aufwand mit dem größten Nutzen.
* Karte mit den Tankstellen statt nur einer Liste.
* Preisverlauf merken und melden, wenn es gerade günstig ist.
