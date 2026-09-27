import { LayoutAnimation, Platform } from 'react-native';

/** Smoothly animate the next layout change (expand/collapse) on phones. */
export function animateNextLayout() {
  if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}
