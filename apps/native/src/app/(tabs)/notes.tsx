import { BaseLayout } from '@/components/base-layout';
import { Text } from '@/components/general/text';

export default function NotesPage() {
  return (
    <BaseLayout>
      <Text variant="h1">Notes</Text>
      <Text className="text-muted-foreground">This screen is reserved for the upcoming notes feature.</Text>
    </BaseLayout>
  );
}
