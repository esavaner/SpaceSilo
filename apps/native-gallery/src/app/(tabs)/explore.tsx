import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Platform, View } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { SText } from '@repo/ui';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" />}
    >
      <View>
        <SText className="color-primary-dark">Explore</SText>
      </View>
      <SText>This app includes example code to help you get started.</SText>
      <Collapsible title="File-based routing">
        <SText>
          This app has two screens: <SText>app/(tabs)/index.tsx</SText> and <SText>app/(tabs)/explore.tsx</SText>
        </SText>
        <SText>
          The layout file in <SText>app/(tabs)/_layout.tsx</SText> sets up the tab navigator.
        </SText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <SText>Learn more</SText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <SText>
          You can open this project on Android, iOS, and the web. To open the web version, press <SText>w</SText> in the
          terminal running this project.
        </SText>
      </Collapsible>
      <Collapsible title="Images">
        <SText>
          For static images, you can use the <SText>@2x</SText> and <SText>@3x</SText> suffixes to provide files for
          different screen densities
        </SText>
        <Image source={require('@/assets/images/react-logo.png')} style={{ alignSelf: 'center' }} />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <SText>Learn more</SText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Custom fonts">
        <SText>
          Open <SText>app/_layout.tsx</SText> to see how to load{' '}
          <SText style={{ fontFamily: 'SpaceMono' }}>custom fonts such as this one.</SText>
        </SText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <SText>Learn more</SText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <SText>
          This template has light and dark mode support. The <SText>useColorScheme()</SText> hook lets you inspect what
          the user's current color scheme is, and so you can adjust UI colors accordingly.
        </SText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <SText>Learn more</SText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <SText>
          This template includes an example of an animated component. The <SText>components/HelloWave.tsx</SText>{' '}
          component uses the powerful <SText>react-native-reanimated</SText> library to create a waving hand animation.
        </SText>
        {Platform.select({
          ios: (
            <SText>
              The <SText>components/ParallaxScrollView.tsx</SText> component provides a parallax effect for the header
              image.
            </SText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}
