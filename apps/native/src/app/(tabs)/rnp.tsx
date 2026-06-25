import { BaseLayout } from '@/components/base-layout';
import { Text } from '@/components/general/text';

export default function RnpPage() {
  return (
    <BaseLayout>
      <Text variant="h1">RNP Test</Text>
      <Text className="text-muted-foreground">This route is kept as a native primitives playground.</Text>
    </BaseLayout>
  );
}
