import { Platform, ScrollView, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button';
import { PersonIcon } from '@/components/icons';
import { Text } from '@/components/text';

export default function HomeScreen() {
  const { setColorScheme } = useColorScheme();
  const { t } = useTranslation();
  return (
    <ScrollView className="flex-1 bg-layer">
      <View>
        <Button onPress={() => setColorScheme('light')}>light</Button>
        <Button onPress={() => setColorScheme('dark')}>dark</Button>
        {/* <Text className="Text-primary-900">test</Text>
        <Text>Welcome!</Text>
        <Text>{t('test')}</Text>
        <Input label="First name" placeholder="First name" error="invalid input" />
        <Input label="Last name" placeholder="Last name" /> */}
      </View>
      <View className="gap-2 mb-6 mt-4">
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="danger">Danger Button</Button>
      </View>
      <View className="gap-2 mb-6">
        <Button variant="primaryOutline">Primary Button</Button>
        <Button variant="secondaryOutline">Secondary Button</Button>
        <Button variant="dangerOutline">Danger Button</Button>
      </View>
      <View className="gap-2 mb-6">
        <Button variant="text">Primary Button</Button>
        <Button variant="link">Secondary Button</Button>
        <Button variant="icon">
          <PersonIcon />
        </Button>
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
        <Text>Tap the Explore tab to learn more about what&apos;s included in this starter app.</Text>
      </View>
      <View>
        <Text>Step 3: Get a fresh start</Text>
        <Text>
          When you&apos;re ready, run <Text>npm run reset-project</Text> to get a fresh <Text>app</Text> directory. This
          will move the current <Text>app</Text> to <Text>app-example</Text>.
        </Text>
      </View>
    </ScrollView>
  );
}
