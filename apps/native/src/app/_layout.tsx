import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import '@/i18n';
import '../styles.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UiProvider } from '@repo/ui';
import { FilesProvider } from '@/providers/FilesProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
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
    <QueryProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FilesProvider>
          <UiProvider>
            <Stack
              screenOptions={{
                contentStyle: {
                  backgroundColor: 'var(--color-background)',
                },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="login/index"
                options={{
                  title: 'Login',
                  headerTintColor: 'var(--color-text)',
                  headerStyle: {
                    backgroundColor: 'var(--color-background)',
                  },
                  navigationBarHidden: true,
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </UiProvider>
        </FilesProvider>
      </GestureHandlerRootView>
    </QueryProvider>
  );
}
