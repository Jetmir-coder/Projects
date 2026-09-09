/**
 * Einstellungen: Auto wählen, Verbrauch anpassen, Suchradius und Zeitwert.
 *
 * Die Auto-Auswahl läuft in drei Stufen — Marke, dann Modell, dann Motor.
 * Welche Stufe gerade offen ist, steht in `offeneMarke` / `offenesModell`.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Beschriftung, Knopf, Panel, Zahlenfeld, Zeile } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { MARKEN, REALVERBRAUCH_AUFSCHLAG, findeMotor } from '@/data/cars';
import { useTheme } from '@/hooks/use-theme';
import { KRAFTSTOFF_NAMEN } from '@/lib/types';
import { useEinstellungen, verbrauchVon } from '@/state/settings';

export default function EinstellungenScreen() {
  const theme = useTheme();
  const { einstellungen, setzen } = useEinstellungen();

  const motor = findeMotor(einstellungen.motorId);
  const [offeneMarke, setOffeneMarke] = useState<string | null>(motor?.marke ?? null);
  const [offenesModell, setOffenesModell] = useState<string | null>(motor?.modell ?? null);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.inhalt}>
      {/* --- Fahrzeug ---------------------------------------------------- */}
      <Panel>
        <Beschriftung>Fahrzeug</Beschriftung>

        {motor ? (
          <View style={styles.gewaehlt}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">
                {motor.marke} {motor.modell}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {motor.name} · {motor.verbrauch} l/100km · {KRAFTSTOFF_NAMEN[motor.kraftstoff]}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => {
                setzen({ motorId: null });
                setOffeneMarke(null);
                setOffenesModell(null);
              }}
              accessibilityRole="button">
              <ThemedText type="small" style={{ color: theme.akzent }}>
                Ändern
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Wähl Marke, Modell und Motor. Fehlt dein Auto, trag unten einfach
            deinen Verbrauch von Hand ein.
          </ThemedText>
        )}

        {/* Stufe 1: Marke */}
        {!motor ? (
          <View style={styles.chips}>
            {MARKEN.map((marke) => (
              <Chip
                key={marke.name}
                titel={marke.name}
                aktiv={offeneMarke === marke.name}
                onPress={() => {
                  setOffeneMarke(offeneMarke === marke.name ? null : marke.name);
                  setOffenesModell(null);
                }}
              />
            ))}
          </View>
        ) : null}

        {/* Stufe 2: Modell */}
        {!motor && offeneMarke ? (
          <View style={styles.chips}>
            {MARKEN.find((m) => m.name === offeneMarke)?.modelle.map((modell) => (
              <Chip
                key={modell.name}
                titel={modell.name}
                aktiv={offenesModell === modell.name}
                onPress={() =>
                  setOffenesModell(offenesModell === modell.name ? null : modell.name)
                }
              />
            ))}
          </View>
        ) : null}

        {/* Stufe 3: Motor */}
        {!motor && offeneMarke && offenesModell ? (
          <View style={{ gap: Spacing.two }}>
            {MARKEN.find((m) => m.name === offeneMarke)
              ?.modelle.find((m) => m.name === offenesModell)
              ?.motoren.map((variante) => (
                <Pressable
                  key={variante.id}
                  accessibilityRole="button"
                  onPress={() =>
                    setzen({
                      motorId: variante.id,
                      kraftstoff: variante.kraftstoff,
                      eigenerVerbrauch: null,
                    })
                  }
                  style={[
                    styles.motorZeile,
                    { borderColor: theme.rand, backgroundColor: theme.background },
                  ]}>
                  <ThemedText type="small" style={{ flex: 1 }}>
                    {variante.name}
                  </ThemedText>
                  <ThemedText type="smallBold">{variante.verbrauch} l</ThemedText>
                </Pressable>
              ))}
          </View>
        ) : null}
      </Panel>

      {/* --- Verbrauch ---------------------------------------------------- */}
      <Panel>
        <Beschriftung>Verbrauch</Beschriftung>

        <Zeile
          label="Wird gerechnet mit"
          wert={`${verbrauchVon(einstellungen).toLocaleString('de-AT', {
            maximumFractionDigits: 1,
          })} l/100km`}
        />

        <View style={styles.schalterZeile}>
          <View style={{ flex: 1 }}>
            <ThemedText type="small">
              Realverbrauch (+{Math.round(REALVERBRAUCH_AUFSCHLAG * 100)} %)
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Herstellerangaben sind schöngerechnet. Der Aufschlag bringt sie
              näher an die Wirklichkeit.
            </ThemedText>
          </View>
          <Switch
            value={einstellungen.realverbrauch}
            onValueChange={(realverbrauch) => setzen({ realverbrauch })}
            disabled={einstellungen.eigenerVerbrauch !== null}
          />
        </View>

        <View>
          <ThemedText type="small" themeColor="textSecondary">
            {einstellungen.eigenerVerbrauch !== null
              ? 'Dein eigener Wert wird verwendet.'
              : 'Eigenen Wert eintragen (überschreibt die Liste):'}
          </ThemedText>
          <Zahlenfeld
            wert={einstellungen.eigenerVerbrauch ?? verbrauchVon(einstellungen)}
            onAendern={(eigenerVerbrauch) => setzen({ eigenerVerbrauch })}
            schritt={0.1}
            min={1}
            max={40}
            nachkommastellen={1}
            einheit="l/100km"
          />
        </View>

        {einstellungen.eigenerVerbrauch !== null ? (
          <Knopf
            titel="Eigenen Wert verwerfen"
            variante="ruhig"
            onPress={() => setzen({ eigenerVerbrauch: null })}
          />
        ) : null}
      </Panel>

      {/* --- Suche -------------------------------------------------------- */}
      <Panel>
        <Beschriftung>Suchradius</Beschriftung>
        <ThemedText type="small" themeColor="textSecondary">
          Wie weit die App nach Tankstellen sucht. Größer heißt mehr Auswahl,
          aber auch längeres Laden.
        </ThemedText>
        <Zahlenfeld
          wert={einstellungen.radiusKm}
          onAendern={(radiusKm) => setzen({ radiusKm })}
          schritt={1}
          min={1}
          max={50}
          einheit="km"
        />
      </Panel>

      {/* --- Zeitwert ----------------------------------------------------- */}
      <Panel>
        <Beschriftung>Was ist dir deine Zeit wert?</Beschriftung>
        <ThemedText type="small" themeColor="textSecondary">
          Die Fahrzeit des Umwegs wird mit diesem Stundensatz von der Ersparnis
          abgezogen. Bei 0 zählt nur der Sprit.
        </ThemedText>
        <Zahlenfeld
          wert={einstellungen.zeitwertProStunde}
          onAendern={(zeitwertProStunde) => setzen({ zeitwertProStunde })}
          schritt={5}
          min={0}
          max={200}
          einheit="€ pro Stunde"
        />
      </Panel>

      <ThemedText type="small" themeColor="textSecondary" style={styles.fussnote}>
        Preise stammen von der amtlichen E-Control-Datenbank. Alle Einstellungen
        bleiben auf diesem Gerät.
      </ThemedText>
    </ScrollView>
  );
}

function Chip({
  titel,
  aktiv,
  onPress,
}: {
  titel: string;
  aktiv: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      style={[
        styles.chip,
        {
          backgroundColor: aktiv ? theme.akzent : theme.backgroundSelected,
          borderColor: aktiv ? theme.akzent : theme.rand,
        },
      ]}>
      <ThemedText type="small" style={{ color: aktiv ? theme.akzentText : theme.text }}>
        {titel}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inhalt: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  gewaehlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  motorZeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  schalterZeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  fussnote: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
});
