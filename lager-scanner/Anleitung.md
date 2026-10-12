# Lager-Scanner mit Power Apps (Android, Arbeitsprofil)

## Teil 1: Excel vorbereiten
1. `Lager_Vorlage.xlsx` öffnen. Blätter: Materialliste, Stellplaetze, Protokoll, Lageruebersicht.
2. Deine echten Daten in die Tabellen kopieren (Spaltenköpfe NICHT ändern):
   - **tblMaterial**: SAP, Bezeichnung, Lagerstand, Meldebestand, StkProKarton, StkProPalette
   - **tblStellplatz**: Stellplatz (Zahl), SAP (die Palette dort)
   - **tblProtokoll**: leer lassen (erste Leerzeile später löschen)
3. SAP-Spalten als **Text** lassen (führende Nullen!).
4. Datei als `Lager.xlsx` in einen **SharePoint-Teamordner** oder OneDrive speichern.
   Mehrere Personen: Ordner für alle freigeben (Bearbeiten).
   Makros (.xlsm) laufen online nicht – die App ersetzt sie.

## Teil 2: App bauen (make.powerapps.com)
1. **Erstellen → Leere App → Leere Canvas-App → Telefon-Layout**, Name "Lager".
2. **Daten → Daten hinzufügen → Excel Online (Business)** → Lager.xlsx → die 3 Tabellen
   (tblMaterial, tblStellplatz, tblProtokoll) anhaken.
3. **Einstellungen → Updates → "Datenzeilenlimit" auf 2000** erhöhen.
4. Controls einfügen (Name in Klammern):

| Control | Name |
|---|---|
| Barcode-Scanner (Medien) | `scan` |
| Textfeld Anzahl, Format Zahl | `txtAnzahl` |
| Dropdown Einheit: Palette, Karton, Stück | `ddEinheit` |
| Schaltfläche "Hinzufügen" | `btnPlus` |
| Schaltfläche "Entfernen" | `btnMinus` |
| Labels | `lblInfo`, `lblStand` |

5. Beim Control `scan` in der Eigenschaft **OnScan**:
```
Set(varPlatz, Value(scan.Value));
Set(varLfd, LookUp(tblStellplatz, Stellplatz = varPlatz));
Set(varMat, LookUp(tblMaterial, SAP = varLfd.SAP))
```
6. `lblInfo.Text`:
```
If(IsBlank(varLfd), "Platz " & varPlatz & " unbekannt",
  If(IsBlank(varMat), "Platz leer / SAP unbekannt",
  varMat.SAP & " – " & varMat.Bezeichnung))
```
7. `lblStand.Text`: `"Lagerstand: " & varMat.Lagerstand & " Stk"`
8. `btnPlus.OnSelect` (für `btnMinus` Vorzeichen `-1` statt `1`):
```
With({stk: Value(txtAnzahl.Text) * Switch(ddEinheit.Selected.Value,
              "Palette", varMat.StkProPalette,
              "Karton",  varMat.StkProKarton, 1) * 1},
  Patch(tblMaterial, varMat, {Lagerstand: varMat.Lagerstand + stk});
  Patch(tblProtokoll, Defaults(tblProtokoll), {
     Zeit: Now(), Stellplatz: varPlatz, SAP: varMat.SAP, Aktion: "Eingang",
     Einheit: ddEinheit.Selected.Value, Anzahl: Value(txtAnzahl.Text),
     Stueck: stk, NeuerBestand: varMat.Lagerstand + stk});
  Set(varMat, LookUp(tblMaterial, SAP = varLfd.SAP));
  Notify("Gebucht: " & stk & " Stk", NotificationType.Success)
)
```
   Beim Entfernen: `stk` mit `* -1`, Aktion `"Ausgang"`.
   Tipp: Vor dem Entfernen prüfen, dass der Bestand nicht negativ wird:
   `If(varMat.Lagerstand + stk < 0, Notify("Zu wenig Bestand", NotificationType.Error), …)`
9. **Datei → Speichern → Veröffentlichen.** Auf dem Handy die **Power Apps** App (Play Store, Arbeitsprofil) öffnen → App "Lager" starten → Kamera erlauben.

## Teil 3: Palette wechselt
Zweiter Bildschirm "Platz belegen": `scan` → Stellplatz, Textfeld neue SAP →
```
Patch(tblStellplatz, LookUp(tblStellplatz, Stellplatz = varPlatz), {SAP: txtNeueSAP.Text})
```
Leerer Platz: SAP auf `""` setzen.

## Teil 4: Etiketten
`Stellplatz_Etiketten_1-1000.pdf`: 24 pro A4-Seite (3x8), Code128 mit der Platznummer.
Anderer Bereich: `python3 make_etiketten.py 1 600 Datei.pdf`.

## Wenn Excel gesperrt ist (Konzernregel/DLP)
Dann statt Excel eine **SharePoint-Liste** nehmen (gleiche Spalten). Die Formeln bleiben fast gleich.
