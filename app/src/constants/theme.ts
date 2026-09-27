import { Platform } from 'react-native';

/**
 * PhillyPulse palette. Light mode is a soft-pretzel cream with the city flag's blue and
 * gold; dark mode is Boathouse Row at night.
 */
export const Brand = {
  blue: '#1D4E9E', // city flag azure
  blueDeep: '#123673',
  gold: '#F5B800', // city flag gold
  goldSoft: '#FFE39A',
  cone: '#FF6A13', // Philly's unofficial city flower: the traffic cone
  live: '#E81828',
  brick: '#B5452E', // rowhome brick
  green: '#004C54', // Go Birds
  white: '#FFFFFF',
  ink: '#0E1A2B',
} as const;

export const Colors = {
  light: {
    text: '#0E1A2B',
    textMuted: '#5B6678',
    background: '#FFF6E5',
    card: '#FFFFFF',
    cardAlt: '#FFF0D1',
    border: '#EBDDC2',
    chip: '#F3E6CB',
    tabBar: '#FFFFFF',
    accent: Brand.blue,
    accentText: '#FFFFFF',
    highlight: Brand.gold,
    shadow: 'rgba(14, 26, 43, 0.10)',
  },
  dark: {
    text: '#F4F1EA',
    textMuted: '#9FB0C8',
    background: '#0B1426',
    card: '#14213A',
    cardAlt: '#1B2B4A',
    border: '#243A5F',
    chip: '#1E3055',
    tabBar: '#101B31',
    accent: '#6F9BFF',
    accentText: '#0B1426',
    highlight: Brand.gold,
    shadow: 'rgba(0, 0, 0, 0.35)',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export const Fonts = {
  display: 'BebasNeue_400Regular',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  black: 'DMSans_900Black',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const MaxContentWidth = 720;
export const TabBarHeight = 64;

export const useNativeDriver = Platform.OS !== 'web';

export const CategoryStyle: Record<string, { emoji: string; color: string; label: string }> = {
  parades_festivals: { emoji: '🎺', color: '#8E44AD', label: 'Parades & Festivals' },
  races_runs: { emoji: '🏃', color: '#0E9F6E', label: 'Races & Runs' },
  civic: { emoji: '🏛️', color: Brand.blue, label: 'Civic/Political' },
  concerts_shows: { emoji: '🎸', color: '#D9480F', label: 'Concerts & Shows' },
};
