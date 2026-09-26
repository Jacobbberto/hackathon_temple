import { useColorScheme } from 'react-native';

import { Colors, type Palette } from '@/constants/theme';

export function usePalette(): Palette & { scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { ...Colors[scheme], scheme };
}
