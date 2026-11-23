import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import '@/i18n';
import { QueryProvider } from '@/providers/QueryProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FilesProvider } from '@/providers/FilesProvider';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { UserProvider } from '@/providers/UserProvider';
import { ServerProvider } from '@/providers/ServerProvider';
import { ModalProvider, ThemeModeProvider, useThemeColors, type ThemeMode } from '@repo/shared/components';
import { Toaster } from '@repo/shared/toast';
import { storage } from '@/utils/storage';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const THEME_MODE_KEY = 'themeMode';
const savedThemeMode = storage.getSync(THEME_MODE_KEY);
const initialThemeMode: ThemeMode = savedThemeMode === 'light' || savedThemeMode === 'dark' ? savedThemeMode : 'system';

function AppLayout() {
  const colors = useThemeColors();
  const backgroundColor = colors.surface.default;

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <UserProvider>
              <ServerProvider>
                <FilesProvider>
                  <ModalProvider>
                    <Stack screenOptions={{ contentStyle: { backgroundColor } }}>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="view/index"
                        options={{
                          headerTintColor: colors.text.default,
                          headerStyle: { backgroundColor },
                          navigationBarHidden: true,
                        }}
                      />
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
  );
}

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
      <AppLayout />
    </ThemeModeProvider>
  );
}
