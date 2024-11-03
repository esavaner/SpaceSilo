import { Platform, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Button, Text, Input } from '@repo/ui';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { setColorScheme } = useColorScheme();
  const { t } = useTranslation();
  return (
    <>
      <View>
        <Button onPress={() => setColorScheme('light')} />
        <Button onPress={() => setColorScheme('dark')} />
        <Button onPress={() => setColorScheme('system')} />
        <Text className="Text-primary-900">test</Text>
        <Text>Welcome!</Text>
        <Text>{t('test')}</Text>
        <Input label="First name" placeholder="First name" error="invalid input" />
        <Input label="Last name" placeholder="Last name" />
      </View>
      <View>
        <Text>Step 1: Try it</Text>
        <Text>
          Edit <Text>app/(tabs)/index.tsx</Text> to see changes. Press{' '}
          <Text>{Platform.select({ ios: 'cmd + d', android: 'cmd + m' })}</Text> to open developer tools.
        </Text>
      </View>
      <View>
        <Text>Step 2: Explore</Text>
        <Text>Tap the Explore tab to learn more about what's included in this starter app.</Text>
      </View>
      <View>
        <Text>Step 3: Get a fresh start</Text>
        <Text>
          When you're ready, run <Text>npm run reset-project</Text> to get a fresh <Text>app</Text> directory. This will
          move the current <Text>app</Text> to <Text>app-example</Text>.
        </Text>
      </View>
    </>
  );
}
