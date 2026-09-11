/**
 * Kleine Bausteine, die überall in der App wiederverwendet werden.
 *
 * Absichtlich ohne fertige UI-Bibliothek gebaut: So sieht man an einem
 * überschaubaren Beispiel, wie Layout (Flexbox), Farben und Berührungen in
 * React Native zusammenspielen.
 */

import { useMemo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Eine abgesetzte Fläche — der Standard-Container für einen Abschnitt. */
export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.backgroundElement, borderColor: theme.rand },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Überschrift innerhalb eines Panels. */
export function Beschriftung({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.beschriftung}>
      {children}
    </ThemedText>
  );
}

export function Knopf({
  titel,
  onPress,
  variante = 'primaer',
  deaktiviert = false,
}: {
  titel: string;
  onPress: () => void;
  variante?: 'primaer' | 'ruhig';
  deaktiviert?: boolean;
}) {
  const theme = useTheme();
  const primaer = variante === 'primaer';

  return (
    <Pressable
      onPress={onPress}
      disabled={deaktiviert}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.knopf,
        {
          backgroundColor: primaer ? theme.akzent : theme.backgroundSelected,
          opacity: deaktiviert ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: primaer ? theme.akzentText : theme.text }}>
        {titel}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Umschalter mit mehreren Möglichkeiten nebeneinander —
 * z. B. Diesel / Super / Autogas.
 */
export function Auswahl<T extends string>({
  optionen,
  wert,
  onWaehlen,
}: {
  optionen: { wert: T; label: string }[];
  wert: T;
  onWaehlen: (wert: T) => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.auswahl, { backgroundColor: theme.backgroundSelected }]}>
      {optionen.map((option) => {
        const aktiv = option.wert === wert;
        return (
          <Pressable
            key={option.wert}
            onPress={() => onWaehlen(option.wert)}
            accessibilityRole="button"
            accessibilityState={{ selected: aktiv }}
            style={[
              styles.auswahlKnopf,
              aktiv && { backgroundColor: theme.akzent },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: aktiv ? theme.akzentText : theme.textSecondary }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Zahleneingabe mit Minus- und Plus-Knopf.
 *
 * Der Text bleibt beim Tippen frei bearbeitbar; erst beim Verlassen des Feldes
 * wird der Wert auf den erlaubten Bereich zurechtgestutzt. Sonst kann man eine
 * Zahl nicht zu Ende tippen, ohne dass sie einem unter den Fingern springt.
 */
export function Zahlenfeld({
  wert,
  onAendern,
  schritt = 1,
  min = 0,
  max = 999,
  einheit,
  nachkommastellen = 0,
}: {
  wert: number;
  onAendern: (wert: number) => void;
  schritt?: number;
  min?: number;
  max?: number;
  einheit?: string;
  nachkommastellen?: number;
}) {
  const theme = useTheme();
  const angezeigt = useMemo(
    () => wert.toLocaleString('de-AT', { maximumFractionDigits: nachkommastellen }),
    [wert, nachkommastellen],
  );

  const begrenzen = (zahl: number) => Math.min(max, Math.max(min, zahl));

  return (
    <View style={styles.zahlenfeld}>
      <Pressable
        onPress={() => onAendern(begrenzen(wert - schritt))}
        accessibilityRole="button"
        accessibilityLabel="weniger"
        style={[styles.rundKnopf, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">−</ThemedText>
      </Pressable>

      <View style={styles.zahlenfeldMitte}>
        <TextInput
          value={angezeigt}
          onChangeText={(text) => {
            const zahl = Number(text.replace(',', '.').replace(/[^\d.]/g, ''));
            if (Number.isFinite(zahl)) onAendern(zahl);
          }}
          onBlur={() => onAendern(begrenzen(wert))}
          keyboardType="decimal-pad"
          style={[styles.eingabe, { color: theme.text }]}
        />
        {einheit ? (
          <ThemedText type="small" themeColor="textSecondary">
            {einheit}
          </ThemedText>
        ) : null}
      </View>

      <Pressable
        onPress={() => onAendern(begrenzen(wert + schritt))}
        accessibilityRole="button"
        accessibilityLabel="mehr"
        style={[styles.rundKnopf, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">+</ThemedText>
      </Pressable>
    </View>
  );
}

/** Eine Zeile "Beschriftung links, Wert rechts". */
export function Zeile({ label, wert }: { label: string; wert: string }) {
  return (
    <View style={styles.zeile}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{wert}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  beschriftung: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },
  knopf: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auswahl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  auswahlKnopf: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  zahlenfeld: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  zahlenfeldMitte: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  rundKnopf: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eingabe: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 60,
    paddingVertical: 4,
  },
  zeile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
