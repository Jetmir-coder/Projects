/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11131A',
    background: '#F7F7F9',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E4E9F2',
    textSecondary: '#5B6070',
    rand: '#DFE1E8',
    /** Akzentfarbe für Knöpfe und Auswahl. */
    akzent: '#1B62D6',
    akzentText: '#FFFFFF',
    /** Der Sieger: hier sparst du. */
    erfolg: '#0B6B33',
    erfolgHintergrund: '#E4F5EA',
    /** Hinweis, dass sich der Umweg nicht lohnt. */
    warnung: '#8A5300',
    warnungHintergrund: '#FDF1DC',
  },
  dark: {
    text: '#F3F4F7',
    background: '#0E0F12',
    backgroundElement: '#191B20',
    backgroundSelected: '#2A2E36',
    textSecondary: '#A2A8B6',
    rand: '#2A2D34',
    akzent: '#65A0FF',
    akzentText: '#0B1220',
    erfolg: '#5BD98A',
    erfolgHintergrund: '#102A1B',
    warnung: '#F2B950',
    warnungHintergrund: '#2C2210',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
