import { type GalleryScanResponse, type GalleryStatsResponse } from '@repo/shared';
import { BaseLayout } from '@/components/base-layout';
import { Button } from '@/components/general/button';
import { Text } from '@/components/general/text';
import { serverIcons } from '@/constants/server-icons';
import { toast } from '@/lib/toast';
import { useServerContext } from '@/providers/ServerProvider';
import { fileSize } from '@/utils/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View className="border border-border rounded-lg p-4 gap-1 bg-layer-secondary/40 min-w-40 flex-1">
    <Text variant="small" className="text-muted-foreground">
      {label}
    </Text>
    <Text variant="h3">{value}</Text>
  </View>
);

export default function ConnectionDetailsPage() {
  const queryClient = useQueryClient();
  const { serverId } = useLocalSearchParams<{ serverId: string }>();
  const { allServers } = useServerContext();

  const server = allServers.find((item) => item.id === serverId);
  const canQuery = !!server && !server.disabled && server.client.status === 'logged_in';

  const { data: stats, isPending } = useQuery({
    queryKey: ['server-gallery-stats', serverId],
    queryFn: () => server!.client.gallery.getStats(),
    enabled: canQuery,
  });

  const { mutate: triggerScan, isPending: isScanning } = useMutation({
    mutationKey: ['server-gallery-scan', serverId],
    mutationFn: () => server!.client.gallery.scan(),
    onSuccess: (result: GalleryScanResponse) => {
      toast.success(`Scanned ${result.scannedImages} images, added ${result.addedImages} new`);
      queryClient.invalidateQueries({ queryKey: ['server-gallery-stats', serverId] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: () => {
      toast.error('Scan failed');
    },
  });

  if (!server) {
    return (
      <BaseLayout>
        <Text variant="h1">Connection</Text>
        <Text variant="muted" className="mt-4">
          Server connection not found.
        </Text>
      </BaseLayout>
    );
  }

  const statValues: GalleryStatsResponse = stats ?? {
    totalFiles: 0,
    totalImages: 0,
    indexedImages: 0,
    storageSize: 0,
  };

  return (
    <BaseLayout>
      <View className="flex-row items-start justify-between gap-4 mb-6">
        <View className="flex-row gap-4 items-center shrink">
          <View className="mt-1">{serverIcons[server.type]}</View>
          <View className="shrink gap-1">
            <Text variant="h1">{server.label}</Text>
            <Text variant="muted">{server.baseUrl}</Text>
            <Text variant="small">
              {server.disabled ? 'Disabled' : server.client.status === 'logged_in' ? 'Connected' : 'Disconnected'}
            </Text>
            {server.client.account?.email && <Text variant="muted">{server.client.account.email}</Text>}
          </View>
        </View>

        <Button onPress={() => triggerScan()} loading={isScanning} disabled={!canQuery}>
          Scan images
        </Button>
      </View>

      {!canQuery && (
        <Text variant="muted" className="mb-4">
          This server must be enabled and logged in before stats and scanning are available.
        </Text>
      )}

      <View className="gap-3 grid md:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Stored files" value={isPending ? '...' : String(statValues.totalFiles)} />
        <StatCard label="Image files" value={isPending ? '...' : String(statValues.totalImages)} />
        <StatCard label="Indexed images" value={isPending ? '...' : String(statValues.indexedImages)} />
        <StatCard label="Storage size" value={isPending ? '...' : fileSize(statValues.storageSize)} />
      </View>

      <View className="border border-border rounded-lg p-4 gap-2">
        <Text variant="h3">Actions</Text>
        <Text variant="muted">
          Run a scan after adding image files directly to the server storage folders. The server will scan supported
          image files, skip ones already indexed, and create entries for new images.
        </Text>
        <Button className="self-start mt-2" onPress={() => triggerScan()} loading={isScanning} disabled={!canQuery}>
          Scan and index new images
        </Button>
      </View>
    </BaseLayout>
  );
}
