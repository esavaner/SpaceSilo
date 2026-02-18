import { useRootNavigationState } from 'expo-router';
import { Text } from '@/components/general/text';
import { View } from 'react-native';

export default function IndexPage() {
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  return (
    <View className="flex-1 bg-background relative">
      <Text>Dashboard</Text>
    </View>
  );
}
