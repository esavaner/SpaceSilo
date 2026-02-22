import { BaseLayout } from '@/components/base-layout';
import { Text } from '@/components/general/text';
import { View } from 'react-native';

export default function ConnectionsPage() {
  return (
    <BaseLayout>
      <Text variant="h1">Connections</Text>
      <Text variant="p">Here you can manage your connections to external services.</Text>
      <View className="border-border border p-4 rounded my-5">
        <Text variant="h3">Add New Connection</Text>
        <Text variant="muted">Select a provider to expand your storage capabilities.</Text>
        <View className="flex-row mt-4 gap-4">
          <View className="flex-1 border border-muted rounded p-4">
            <Text>Google Drive</Text>
          </View>
          <View className="flex-1 border border-muted rounded p-4">
            <Text>Dropbox</Text>
          </View>
          <View className="flex-1 border border-muted rounded p-4">
            <Text>OneDrive</Text>
          </View>
        </View>
      </View>
      <Text variant="h3">Existing Connections</Text>
    </BaseLayout>
  );
}
