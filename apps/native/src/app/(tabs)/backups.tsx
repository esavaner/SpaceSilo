import { BaseLayout } from '@/components/base-layout';
import { Text } from '@/components/general/text';

export default function BackupsPage() {
  return (
    <BaseLayout>
      <Text variant="h1">Backups</Text>
      <Text className="text-muted-foreground">This screen is reserved for the upcoming backups feature.</Text>
    </BaseLayout>
  );
}
