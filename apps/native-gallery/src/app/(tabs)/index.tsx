import { Image, Platform, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Button, SText } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { api } from '@/components/providers/TRPCProvider';

export default function HomeScreen() {
  const { setColorScheme } = useColorScheme();
  const { t } = useTranslation();
  const { data } = api.files.hello.useQuery();
  console.log(data);
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<Image source={require('@/assets/images/partial-react-logo.png')} />}
    >
      <View>
        <Button onClick={() => setColorScheme('light')} text="light" />
        <Button onClick={() => setColorScheme('dark')} text="dark" />
        <Button onClick={() => setColorScheme('system')} text="system" />
        <SText className="SText-primary-900">test</SText>
        <SText>Welcome!</SText>
        <SText>{t('test')}</SText>
        <SText>{data?.message}</SText>
        <HelloWave />
      </View>
      <View>
        <SText>Step 1: Try it</SText>
        <SText>
          Edit <SText>app/(tabs)/index.tsx</SText> to see changes. Press{' '}
          <SText>{Platform.select({ ios: 'cmd + d', android: 'cmd + m' })}</SText> to open developer tools.
        </SText>
      </View>
      <View>
        <SText>Step 2: Explore</SText>
        <SText>Tap the Explore tab to learn more about what's included in this starter app.</SText>
      </View>
      <View>
        <SText>Step 3: Get a fresh start</SText>
        <SText>
          When you're ready, run <SText>npm run reset-project</SText> to get a fresh <SText>app</SText> directory. This
          will move the current <SText>app</SText> to <SText>app-example</SText>.
        </SText>
      </View>
    </ParallaxScrollView>
  );
}
