/**
 * Detailbildschirm einer Tankstelle.
 *
 * Der Dateiname in eckigen Klammern ist expo-router-Sprache: alles, was in der
 * Adresse an dieser Stelle steht, landet als Parameter `id` im Screen.
 * "/tankstelle/1042" ruft also diesen Screen mit id = "1042" auf.
 *
 * Hier wird aufgeschlüsselt, woraus sich die Gesamtkosten zusammensetzen —
 * damit die Empfehlung nachvollziehbar ist und nicht geglaubt werden muss.
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Beschriftung, Knopf, Panel, Zeile } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatAlter,
  formatEuro,
  formatKm,
  formatLiter,
  formatLiterpreis,
  formatMinuten,
} from '@/lib/format';
import { KRAFTSTOFF_NAMEN, type Kraftstoff } from '@/lib/types';
import { findeBewertung } from '@/state/letztes-ergebnis';
import { useEinstellungen } from '@/state/settings';

export default function TankstellenDetail() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { einstellungen } = useEinstellungen();
  const bewertung = findeBewertung(id);

  if (!bewertung) {
    return (
      <View style={[styles.leer, { backgroundColor: theme.background }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Diese Tankstelle ist nicht mehr im aktuellen Ergebnis. Geh zurück und
          such neu.
        </ThemedText>
      </View>
    );
  }

  const { station } = bewertung;
  const alter = formatAlter(station.standAktualisiert);

  /** Navigation in der Karten-App des Geräts starten. */
  const routeOeffnen = () => {
    const ziel = `${station.lat},${station.lon}`;
    const name = encodeURIComponent(station.name);

    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${ziel}&q=${name}`
        : `https://www.google.com/maps/dir/?api=1&destination=${ziel}`;

    Linking.openURL(url).catch(() => {
      // Keine Karten-App vorhanden — dann passiert eben nichts.
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.inhalt}>
      <Stack.Screen options={{ title: station.name }} />

      <Panel>
        <View>
          <ThemedText type="smallBold" style={styles.name}>
            {station.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {station.adresse}
            {station.ort ? `\n${station.plz} ${station.ort}` : ''}
          </ThemedText>
        </View>

        {alter ? (
          <ThemedText type="small" themeColor="textSecondary">
            Preismeldung {alter}
          </ThemedText>
        ) : null}

        <Knopf titel="Route starten" onPress={routeOeffnen} />
      </Panel>

      {/* --- Alle Preise dieser Tankstelle -------------------------------- */}
      <Panel>
        <Beschriftung>Preise</Beschriftung>
        {(Object.keys(KRAFTSTOFF_NAMEN) as Kraftstoff[]).map((art) => {
          const preis = station.preise[art];
          return (
            <Zeile
              key={art}
              label={
                KRAFTSTOFF_NAMEN[art] + (art === einstellungen.kraftstoff ? '  (gewählt)' : '')
              }
              wert={preis !== undefined ? formatLiterpreis(preis) : 'führt sie nicht'}
            />
          );
        })}
      </Panel>

      {/* --- Woraus sich die Kosten zusammensetzen ------------------------ */}
      <Panel>
        <Beschriftung>Was dich dieser Tankstopp kostet</Beschriftung>

        <Zeile
          label={`${formatLiter(einstellungen.tankmengeLiter)} × ${formatLiterpreis(bewertung.preis)}`}
          wert={formatEuro(bewertung.spritKosten)}
        />
        <Zeile
          label={`Umweg ${formatKm(bewertung.umwegKm)} → ${formatLiter(bewertung.umwegLiter)} Sprit`}
          wert={formatEuro(bewertung.umwegKosten)}
        />
        {einstellungen.zeitwertProStunde > 0 ? (
          <Zeile
            label={`Fahrzeit ${formatMinuten(bewertung.umwegMinuten)} × ${formatEuro(
              einstellungen.zeitwertProStunde,
            )}/Std`}
            wert={formatEuro(bewertung.zeitKosten)}
          />
        ) : null}

        <View style={[styles.trenner, { backgroundColor: theme.rand }]} />

        <View style={styles.summe}>
          <ThemedText type="smallBold">Gesamt</ThemedText>
          <ThemedText type="smallBold" style={styles.summeWert}>
            {formatEuro(bewertung.gesamtKosten)}
          </ThemedText>
        </View>

        {bewertung.geschaetzt ? (
          <ThemedText type="small" themeColor="textSecondary">
            Die Strecke ist geschätzt (Luftlinie hochgerechnet) — der
            Routing-Server war nicht erreichbar.
          </ThemedText>
        ) : null}
      </Panel>

      {/* --- Vergleich ---------------------------------------------------- */}
      <Panel>
        <Beschriftung>Im Vergleich</Beschriftung>

        {bewertung.istReferenz ? (
          <ThemedText type="small">
            Das ist deine nächstgelegene Tankstelle. Alle anderen werden an ihr
            gemessen.
          </ThemedText>
        ) : (
          <>
            <ThemedText
              type="smallBold"
              style={{
                color: bewertung.ersparnisGegenReferenz > 0 ? theme.erfolg : theme.text,
              }}>
              {bewertung.ersparnisGegenReferenz > 0
                ? `Du sparst ${formatEuro(bewertung.ersparnisGegenReferenz)} gegenüber der nächstgelegenen Tankstelle.`
                : `${formatEuro(-bewertung.ersparnisGegenReferenz)} teurer als die nächstgelegene Tankstelle.`}
            </ThemedText>

            {bewertung.breakEvenLiter === null ? (
              <ThemedText type="small" themeColor="textSecondary">
                Der Literpreis ist hier nicht besser — egal wie viel du tankst,
                der Umweg rechnet sich nicht.
              </ThemedText>
            ) : bewertung.breakEvenLiter === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Lohnt sich bei jeder Tankmenge.
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Kipppunkt: Ab {formatLiter(bewertung.breakEvenLiter)} Tankmenge
                bist du hier günstiger. Du hast{' '}
                {formatLiter(einstellungen.tankmengeLiter)} eingestellt.
              </ThemedText>
            )}
          </>
        )}
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inhalt: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  leer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  name: {
    fontSize: 20,
  },
  trenner: {
    height: StyleSheet.hairlineWidth,
  },
  summe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  summeWert: {
    fontSize: 20,
  },
});
