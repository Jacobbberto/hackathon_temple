import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue/400Regular';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_900Black } from '@expo-google-fonts/dm-sans/900Black';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';

import { FxProvider } from '@/components/fx';
import { PulseTabBar } from '@/components/TabBar';
import { usePalette } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const p = usePalette();
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } } }),
  );
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSans_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Refetch when the app comes back to the foreground (TanStack only knows about browser focus).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  const navTheme = p.scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: p.background } }}>
        <FxProvider>
          <View style={{ flex: 1, backgroundColor: p.background }}>
            <Tabs
              tabBar={(props) => <PulseTabBar {...props} />}
              screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: p.background } }}>
              <Tabs.Screen name="index" options={{ title: 'Home' }} />
              <Tabs.Screen name="events" options={{ title: 'Events' }} />
              <Tabs.Screen name="sports" options={{ title: 'Sports' }} />
              <Tabs.Screen name="politics" options={{ title: 'Politics' }} />
            </Tabs>
          </View>
        </FxProvider>
        <StatusBar style="light" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
