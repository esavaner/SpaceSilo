import { useRootNavigationState } from 'expo-router';
import { Text } from '@/components/general/text';
import { BaseLayout } from '@/components/base-layout';

export default function IndexPage() {
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  return (
    <BaseLayout>
      <Text variant="h1">Dashboard</Text>
    </BaseLayout>
  );
}
