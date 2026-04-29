import { BaseLayout } from '@/components/base-layout';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { type GalleryImageResponse } from '@/api/core.client';
import { useServerContext } from '@/providers/ServerProvider';
import { toast } from '@/lib/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';

type GalleryItem = GalleryImageResponse & {
  serverId: string;
  baseUrl: string;
  label: string;
  headers?: Record<string, string>;
};

export default function GalleryPage() {
  const { t } = useTranslation();
  const { servers } = useServerContext();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const columnCount = width > 1280 ? 5 : width > 1024 ? 4 : width > 768 ? 3 : 2;

  const { data: photos = [], isPending } = useQuery({
    queryKey: ['gallery', servers.map((server) => server.id)],
    queryFn: async () => {
      if (!servers.length) return [] as GalleryItem[];

      const responses = await Promise.all(
        servers.map(async (server) => {
          try {
            const data = await server.client.gallery.findAll();
            const headers = server.client.getAuthHeaders();
            return data.map((item) => ({
              ...item,
              serverId: server.id,
              baseUrl: server.baseUrl,
              label: server.label,
              headers,
            }));
          } catch {
            return [] as GalleryItem[];
          }
        })
      );

      return responses.flat().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    enabled: servers.length > 0,
  });

  const { mutate: uploadFiles, isPending: isUploading } = useMutation({
    mutationKey: ['gallery-upload'],
    mutationFn: async (files: File[]) => {
      const targetServer = servers[0];
      if (!targetServer) {
        throw new Error('No active server connections');
      }

      const settled = await Promise.allSettled(
        files.map((file) => targetServer.client.gallery.uploadFile(file, file.name))
      );

      const successCount = settled.filter((item) => item.status === 'fulfilled').length;
      const failedCount = settled.length - successCount;
      return { successCount, failedCount };
    },
    onSuccess: ({ successCount, failedCount }) => {
      if (successCount > 0) {
        toast.success(`Uploaded ${successCount} file${successCount === 1 ? '' : 's'}`);
      }
      if (failedCount > 0) {
        toast.error(`Failed uploads: ${failedCount}`);
      }
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: () => {
      toast.error('Upload failed');
    },
  });

  const handleUploadButtonPress = () => {
    if (Platform.OS !== 'web') {
      toast.error('Gallery upload is currently available on web only');
      return;
    }
    uploadInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (!selected?.length) return;
    const files = Array.from(selected);
    uploadFiles(files);
    event.target.value = '';
  };

  return (
    <BaseLayout>
      <View className="mb-4 flex-row justify-between items-center gap-3">
        <Text variant="h1">{t('Gallery')}</Text>
        <Button onPress={handleUploadButtonPress} loading={isUploading}>
          <Icon.Add className="text-primary-foreground" />
          <Text>Upload</Text>
        </Button>
      </View>

      {Platform.OS === 'web' && (
        <input ref={uploadInputRef} type="file" multiple onChange={handleFileInputChange} style={{ display: 'none' }} />
      )}

      {isPending && <Text className="text-muted-foreground">Loading photos...</Text>}
      {!isPending && photos.length === 0 && <Text className="text-muted-foreground">No photos yet</Text>}

      <View className="flex-row flex-wrap -mx-1">
        {photos.map((item) => {
          const imageUri = `${item.baseUrl}${item.thumbnailPath}`;
          const tileWidth = `${100 / columnCount}%` as `${number}%`;

          return (
            <View key={`${item.serverId}:${item.id}`} className="p-1" style={{ width: tileWidth }}>
              <Pressable className="overflow-hidden rounded-lg bg-layer-secondary aspect-square">
                <Image
                  source={{ uri: imageUri, headers: item.headers }}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  transition={120}
                  className="w-full h-full"
                />
              </Pressable>
            </View>
          );
        })}
      </View>
    </BaseLayout>
  );
}
