/**
 * Hauptbildschirm: eingeben, suchen, Ergebnis lesen.
 *
 * Der Aufbau von oben nach unten:
 *   1. Was koste ich? (Auto, Kraftstoff, Tankmenge)
 *   2. Die Antwort in einem Satz
 *   3. Die vollständige Liste
 */

import { Link, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { istMock } from '@/api/mock';
import { StationEintrag } from '@/components/station-eintrag';
import { ThemedText } from '@/components/themed-text';
import { Auswahl, Beschriftung, Knopf, Panel, Zahlenfeld } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { findeMotor } from '@/data/cars';
import { useTheme } from '@/hooks/use-theme';
import type { Bewertung } from '@/lib/calc';
import { formatEuro, formatKm, formatMinuten } from '@/lib/format';
import { KRAFTSTOFF_NAMEN, type Kraftstoff } from '@/lib/types';
import { istUneingerichtet, useEinstellungen, verbrauchVon } from '@/state/settings';
import { useStandort } from '@/state/use-standort';
import { useSuche } from '@/state/use-suche';

const KRAFTSTOFF_OPTIONEN: { wert: Kraftstoff; label: string }[] = [
  { wert: 'DIE', label: 'Diesel' },
  { wert: 'SUP', label: 'Super' },
  { wert: 'GAS', label: 'Autogas' },
];

export default function Startseite() {
  const theme = useTheme();
  const router = useRouter();
  const { einstellungen, setzen } = useEinstellungen();
  const standort = useStandort();
  const suche = useSuche(standort.punkt, einstellungen);

  const motor = findeMotor(einstellungen.motorId);
  const verbrauch = verbrauchVon(einstellungen);

  const autoText = motor
    ? `${motor.marke} ${motor.modell} · ${motor.name}`
    : einstellungen.eigenerVerbrauch !== null
      ? 'Eigener Verbrauch'
      : 'Noch kein Auto gewählt';

  const bewertungen = suche.ergebnis?.bewertungen ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['bottom']}>
      <FlatList
        data={bewertungen}
        keyExtractor={(bewertung) => bewertung.station.id}
        contentContainerStyle={styles.liste}
        refreshControl={
          <RefreshControl refreshing={suche.laden} onRefresh={suche.neuLaden} />
        }
        ListHeaderComponent={
          <View style={styles.kopfbereich}>
            {/* --- Eingaben ------------------------------------------------ */}
            <Panel>
              <Beschriftung>Dein Auto</Beschriftung>
              <Link href="/einstellungen" asChild>
                <Pressable style={styles.autoZeile} accessibilityRole="button">
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">{autoText}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {verbrauch.toLocaleString('de-AT', { maximumFractionDigits: 1 })} l/100km
                      {einstellungen.eigenerVerbrauch === null && einstellungen.realverbrauch && motor
                        ? ' (Realverbrauch)'
                        : ''}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: theme.akzent }}>
                    Ändern
                  </ThemedText>
                </Pressable>
              </Link>

              <Auswahl
                optionen={KRAFTSTOFF_OPTIONEN}
                wert={einstellungen.kraftstoff}
                onWaehlen={(kraftstoff) => setzen({ kraftstoff })}
              />

              <View>
                <Beschriftung>Wie viel willst du tanken?</Beschriftung>
                <Zahlenfeld
                  wert={einstellungen.tankmengeLiter}
                  onAendern={(tankmengeLiter) => setzen({ tankmengeLiter })}
                  schritt={5}
                  min={1}
                  max={200}
                  einheit="Liter"
                />
              </View>
            </Panel>

            {/* --- Zustände ------------------------------------------------ */}
            {istMock() ? (
              <Hinweis
                farbe={theme.warnungHintergrund}
                text="Testbetrieb: Die Preise stammen aus einer gespeicherten Beispielantwort, nicht von E-Control. Starte ohne EXPO_PUBLIC_MOCK für echte Daten."
              />
            ) : null}

            {istUneingerichtet(einstellungen) ? (
              <Hinweis
                farbe={theme.warnungHintergrund}
                text={`Es wird mit ${verbrauch} l/100km gerechnet. Wähl dein Auto, damit die Zahlen zu dir passen.`}
              />
            ) : null}

            {standort.fehler ? (
              <Panel>
                <ThemedText type="small">{standort.fehler}</ThemedText>
                <Knopf titel="Nochmal versuchen" onPress={standort.anfordern} />
              </Panel>
            ) : null}

            {suche.fehler ? (
              <Panel>
                <ThemedText type="small">{suche.fehler}</ThemedText>
                <Knopf titel="Nochmal laden" onPress={suche.neuLaden} />
              </Panel>
            ) : null}

            {/* --- Die Antwort in einem Satz ------------------------------- */}
            <Empfehlung
              laden={suche.laden || standort.laden}
              bewertungen={bewertungen}
              kraftstoff={einstellungen.kraftstoff}
              geschaetzt={suche.geschaetzt}
              aussortiert={suche.ergebnis?.aussortiert ?? 0}
            />

            {bewertungen.length > 0 ? (
              <Beschriftung>Alle Tankstellen nach Gesamtkosten</Beschriftung>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <StationEintrag
            bewertung={item}
            platz={index + 1}
            onPress={() => router.push(`/tankstelle/${item.station.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
        ListEmptyComponent={
          suche.laden || standort.laden ? null : (
            <Panel>
              <ThemedText type="small" themeColor="textSecondary">
                {standort.punkt
                  ? `Keine Tankstelle mit ${KRAFTSTOFF_NAMEN[einstellungen.kraftstoff]} im Umkreis von ${einstellungen.radiusKm} km gefunden. Probier einen größeren Radius in den Einstellungen.`
                  : 'Warte auf deinen Standort.'}
              </ThemedText>
            </Panel>
          )
        }
      />
    </SafeAreaView>
  );
}

/**
 * Der wichtigste Teil des Bildschirms: ein Satz, der die Frage beantwortet
 * "wo soll ich hinfahren?".
 */
function Empfehlung({
  laden,
  bewertungen,
  kraftstoff,
  geschaetzt,
  aussortiert,
}: {
  laden: boolean;
  bewertungen: Bewertung[];
  kraftstoff: Kraftstoff;
  geschaetzt: boolean;
  aussortiert: number;
}) {
  const theme = useTheme();

  const bester = bewertungen[0];
  const satz = useMemo(() => {
    if (!bester) return null;

    if (bester.istReferenz || !bester.lohntSich) {
      return {
        titel: 'Fahr einfach zur nächsten.',
        text: `Weiter zu fahren bringt bei dieser Tankmenge nichts — der Umweg frisst den Preisvorteil auf.`,
        gut: false,
      };
    }

    return {
      titel: `Du sparst ${formatEuro(bester.ersparnisGegenReferenz)}`,
      text:
        `${bester.station.name}, ${formatKm(bester.umwegKm)} Umweg ` +
        `(${formatMinuten(bester.umwegMinuten)}) — gegenüber der nächstgelegenen Tankstelle. ` +
        `Umweg-Sprit und Zeit sind schon abgezogen.`,
      gut: true,
    };
  }, [bester]);

  if (laden && bewertungen.length === 0) {
    return (
      <Panel style={styles.mitte}>
        <ActivityIndicator />
        <ThemedText type="small" themeColor="textSecondary">
          Preise und Strecken werden geladen …
        </ThemedText>
      </Panel>
    );
  }

  if (!satz) return null;

  return (
    <Panel
      style={{
        backgroundColor: satz.gut ? theme.erfolgHintergrund : theme.backgroundElement,
        borderColor: satz.gut ? theme.erfolg : theme.rand,
      }}>
      <ThemedText type="subtitle" style={{ color: satz.gut ? theme.erfolg : theme.text }}>
        {satz.titel}
      </ThemedText>
      <ThemedText type="small">{satz.text}</ThemedText>

      <ThemedText type="small" themeColor="textSecondary">
        {bewertungen.length} Tankstellen mit {KRAFTSTOFF_NAMEN[kraftstoff]}
        {aussortiert > 0 ? ` · ${aussortiert} ohne passenden Preis übersprungen` : ''}
        {geschaetzt ? ' · Strecken geschätzt (kein Routing-Server erreichbar)' : ''}
      </ThemedText>
    </Panel>
  );
}

function Hinweis({ farbe, text }: { farbe: string; text: string }) {
  return (
    <Panel style={{ backgroundColor: farbe }}>
      <ThemedText type="small">{text}</ThemedText>
    </Panel>
  );
}

const styles = StyleSheet.create({
  liste: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  kopfbereich: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  autoZeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  mitte: {
    alignItems: 'center',
    gap: Spacing.two,
  },
});
