import { openBrowserAsync } from 'expo-web-browser';
import { Linking, Platform } from 'react-native';

/** Open an outside link: new tab on web, in-app browser on phones. */
export async function openLink(url: string | null | undefined) {
  if (!url) return;
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  try {
    await openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}
