# Testplan

## A) Zu Hause (Privathandy + Privat-PC)

### Probe-App (https://claude.ai/artifact/SC6D99w2jiC6PmgmjQdSem)
Am Handy in der Claude-App öffnen. Testdaten: 50 Materialien, Plätze 1–200 (70 belegt).
Zum Scannen: `Test_Etiketten_1-24.pdf` am PC-Bildschirm öffnen oder drucken.

- [ ] Etikett scannen → richtiger Platz öffnet sich
- [ ] Platz tippen statt scannen (z.B. 5)
- [ ] Eingang 1 Palette → Bestand steigt um Stk/Palette
- [ ] Ausgang 2 Karton → Bestand sinkt richtig
- [ ] Ausgang mehr als Bestand → Fehlermeldung, nichts gebucht
- [ ] Material ohne Karton → nur Palette/Stück wählbar
- [ ] Leerer Platz → "Platz belegen" mit SAP aus der Liste
- [ ] Umlagern belegt → leer: klappt
- [ ] Umlagern auf belegten Platz → Warnung
- [ ] Lagerplan: MN stimmt (…0530 → 10530, …4711 → 4711), Farben passen
- [ ] Protokoll zeigt alle Schritte
- [ ] Notieren: Was fehlt? Was nervt? Welche Knöpfe anders?

### Excel (office.com mit Hotmail, oder LibreOffice)
Datei: `Lager_Test.xlsx` (gleiche Testdaten).
- [ ] Blatt Lagerplan: Plätze + MN sichtbar, grün/grau
- [ ] Im Blatt Stellplaetze eine SAP ändern → Lagerplan ändert sich
- [ ] Lagerplan ist geschützt (Tippen geht nicht)
- [ ] PlanLayout: eigenes echtes Lager-Layout eintragen
- [ ] Lageruebersicht: "Unter Meldebestand" stimmt

## B) In der Firma (kurz halten)
1. [ ] Excel-Test in Power Apps (Daten hinzufügen → Excel Online Business) – 2 Min
2. [ ] Echte Daten in Vorlage kopieren – SAP als Text!
3. [ ] App bauen nach Anleitung (fertiger Code von Claude zum Einfügen)
4. [ ] 3 Etiketten drucken, am Firmenhandy testen
5. [ ] Erst dann alle Etiketten drucken
