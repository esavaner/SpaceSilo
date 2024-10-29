import { SText } from '@repo/ui';
import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View>
        <SText>This screen doesn't exist.</SText>
        <Link href="/">
          <SText>Go to home screen!</SText>
        </Link>
      </View>
    </>
  );
}
