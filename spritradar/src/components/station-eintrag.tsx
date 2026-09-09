/**
 * Eine Tankstelle in der Ergebnisliste.
 *
 * Die Gestaltung folgt der Kernidee der App: Nicht der Literpreis steht groß
 * da, sondern was dich der Tankstopp insgesamt kostet — und wie viel du damit
 * gegenüber der nächstgelegenen Tankstelle sparst.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Bewertung } from '@/lib/calc';
import { formatEuro, formatKm, formatLiter, formatLiterpreis, formatMinuten } from '@/lib/format';

export function StationEintrag({
  bewertung,
  platz,
  onPress,
}: {
  bewertung: Bewertung;
  /** 1 = bestes Ergebnis. */
  platz: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { station, istReferenz, ersparnisGegenReferenz: ersparnis } = bewertung;

  const sieger = platz === 1 && bewertung.lohntSich;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.karte,
        {
          backgroundColor: sieger ? theme.erfolgHintergrund : theme.backgroundElement,
          borderColor: sieger ? theme.erfolg : theme.rand,
          borderWidth: sieger ? 1.5 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <View style={styles.kopf}>
        <View style={styles.titelBereich}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {station.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {station.adresse}
            {station.ort ? `, ${station.plz} ${station.ort}` : ''}
          </ThemedText>
        </View>

        <View style={styles.preisBereich}>
          <ThemedText type="smallBold" style={styles.preis}>
            {formatLiterpreis(bewertung.preis)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            je Liter
          </ThemedText>
        </View>
      </View>

      <View style={[styles.trenner, { backgroundColor: theme.rand }]} />

      <View style={styles.zahlen}>
        <Kennzahl
          label="Umweg"
          wert={
            bewertung.umwegKm === 0
              ? 'liegt am Weg'
              : `${formatKm(bewertung.umwegKm)} · ${formatMinuten(bewertung.umwegMinuten)}`
          }
        />
        <Kennzahl label="Gesamt" wert={formatEuro(bewertung.gesamtKosten)} />
      </View>

      {istReferenz ? (
        <ThemedText type="small" themeColor="textSecondary">
          Deine nächstgelegene Tankstelle — der Vergleichsmaßstab.
        </ThemedText>
      ) : ersparnis > 0 ? (
        <ThemedText type="smallBold" style={{ color: sieger ? theme.erfolg : theme.text }}>
          {sieger ? '★ ' : ''}
          Du sparst {formatEuro(ersparnis)}
          {bewertung.lohntSich ? '' : ' — zu wenig für den Umweg'}
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {formatEuro(-ersparnis)} teurer als die nächstgelegene
        </ThemedText>
      )}

      {bewertung.breakEvenLiter !== null && bewertung.breakEvenLiter > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Lohnt sich ab {formatLiter(bewertung.breakEvenLiter)} Tankmenge.
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

function Kennzahl({ label, wert }: { label: string; wert: string }) {
  return (
    <View style={styles.kennzahl}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{wert}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  karte: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  kopf: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  titelBereich: {
    flex: 1,
    gap: 2,
  },
  preisBereich: {
    alignItems: 'flex-end',
  },
  preis: {
    fontSize: 17,
  },
  trenner: {
    height: StyleSheet.hairlineWidth,
  },
  zahlen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  kennzahl: {
    gap: 1,
  },
});
