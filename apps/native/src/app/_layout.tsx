import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import '@/i18n';
import '../styles.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UiProvider } from '@/providers/UiProvider';
import { FilesProvider } from '@/providers/FilesProvider';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { UserProvider } from '@/providers/UserProvider';
import { Platform, Appearance, ColorSchemeName } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import { ServerProvider } from '@/providers/ServerProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
    if (Platform.OS === 'web') {
      console.log('Setting up Appearance listeners for web');
      Appearance.setColorScheme = (scheme) => {
        document.documentElement.setAttribute('data-theme', scheme);
        document.documentElement.className = scheme || '';
      };

      Appearance.getColorScheme = () => {
        const systemValue = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const userValue = document.documentElement.getAttribute('data-theme');
        return (userValue && userValue !== 'null' ? userValue : systemValue) as ColorSchemeName;
      };

      Appearance.addChangeListener = (listener) => {
        // Listen for changes of system value
        const systemValueListener = (e: MediaQueryListEvent) => {
          const newSystemValue = e.matches ? 'dark' : 'light';
          const userValue = document.documentElement.getAttribute('data-theme');
          listener({
            colorScheme: (userValue && userValue !== 'null' ? userValue : newSystemValue) as ColorSchemeName,
          });
        };
        const systemValue = window.matchMedia('(prefers-color-scheme: dark)');
        systemValue.addEventListener('change', systemValueListener);

        // Listen for changes of user set value
        const observer = new MutationObserver((mutationsList) => {
          for (const mutation of mutationsList) {
            if (mutation.attributeName === 'data-theme') {
              listener({ colorScheme: Appearance.getColorScheme() || 'dark' });
            }
          }
        });
        observer.observe(document.documentElement, { attributes: true });

        function remove() {
          systemValue.removeEventListener('change', systemValueListener);
          observer.disconnect();
        }

        return { remove };
      };
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'var(--color-background)' }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <UserProvider>
              <ServerProvider>
                <FilesProvider>
                  <UiProvider>
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
                      <Stack.Screen name="group/[groupId]" options={commonOptions} />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                  </UiProvider>
                </FilesProvider>
              </ServerProvider>
            </UserProvider>
          </GestureHandlerRootView>
        </SafeAreaView>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
