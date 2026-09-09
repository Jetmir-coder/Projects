/**
 * Die äußerste Hülle der App.
 *
 * Legt die Navigation fest (ein Stapel aus Screens) und spannt den
 * Einstellungs-Provider darüber. Die Datei heißt "_layout", weil expo-router
 * genau diesen Namen als Rahmen für alles im selben Ordner erkennt.
 */

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { EinstellungenProvider } from '@/state/provider';

export default function RootLayout() {
  const schema = useColorScheme();
  const dunkel = schema === 'dark';

  return (
    <EinstellungenProvider>
      <ThemeProvider value={dunkel ? DarkTheme : DefaultTheme}>
        <StatusBar style={dunkel ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="index" options={{ title: 'SpritRadar' }} />
          <Stack.Screen name="einstellungen" options={{ title: 'Einstellungen' }} />
          <Stack.Screen name="tankstelle/[id]" options={{ title: 'Tankstelle' }} />
        </Stack>
      </ThemeProvider>
    </EinstellungenProvider>
  );
}
