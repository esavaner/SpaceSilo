import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import '@/i18n';
import '../styles.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FilesProvider } from '@/providers/FilesProvider';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { UserProvider } from '@/providers/UserProvider';
import { Appearance, Platform } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import { ServerProvider } from '@/providers/ServerProvider';
import { Toaster } from '@/lib/toast';
import { ModalProvider, ThemeModeProvider, useThemeMode, type ThemeMode } from '@repo/shared/components';
import { storage } from '@/utils/storage';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const THEME_MODE_KEY = 'themeMode';
const savedThemeMode = storage.getSync(THEME_MODE_KEY);
const initialThemeMode: ThemeMode = savedThemeMode === 'light' || savedThemeMode === 'dark' ? savedThemeMode : 'system';

// nativewind reads Appearance on native and the `dark` class on <html> on web.
const NativewindThemeSync = () => {
  const { mode, scheme } = useThemeMode();
  useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.classList.toggle('dark', scheme === 'dark');
    else Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  }, [mode, scheme]);
  return null;
};

const commonOptions: React.ComponentProps<typeof Stack.Screen>['options'] = {
  headerTintColor: 'var(--color-text)',
  headerStyle: {
    backgroundColor: 'var(--color-background)',
  },
  navigationBarHidden: true,
};

export default function RootLayout() {
  const [loaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    InterVariable: require('../assets/fonts/Inter-Variable.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeModeProvider initialMode={initialThemeMode} onModeChange={(mode) => storage.set(THEME_MODE_KEY, mode)}>
      <NativewindThemeSync />
      <QueryProvider>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: 'var(--color-background)' }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <UserProvider>
                <ServerProvider>
                  <FilesProvider>
                    <ModalProvider>
                      <PortalHost />
                      <Stack
                        screenOptions={{
                          contentStyle: {
                            backgroundColor: 'var(--color-background)',
                          },
                        }}
                      >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="view/index" options={commonOptions} />
                        <Stack.Screen name="login/index" options={commonOptions} />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      <Toaster />
                    </ModalProvider>
                  </FilesProvider>
                </ServerProvider>
              </UserProvider>
            </GestureHandlerRootView>
          </SafeAreaView>
        </SafeAreaProvider>
      </QueryProvider>
    </ThemeModeProvider>
  );
}
