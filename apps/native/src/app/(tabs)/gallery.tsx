import { BaseLayout } from '@/components/base-layout';
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/dropdowns/dropdown';
import { useServerContext, type ServerConnectionWithClient } from '@/providers/ServerProvider';
import { toast } from '@/lib/toast';
import { type FindGalleryImagesRequest, type GalleryImageResponse } from '@repo/shared';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { Image } from 'expo-image';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, View, useWindowDimensions } from 'react-native';

type GalleryItem = GalleryImageResponse & {
  serverId: string;
  baseUrl: string;
  label: string;
  headers?: Record<string, string>;
};

type GroupBy = 'day' | 'week' | 'month' | 'year' | 'none';

type GalleryGroup = {
  key: string;
  label: string;
  items: GalleryItem[];
};

type GalleryLightboxItem = {
  key: string;
  uri: string;
  headers?: Record<string, string>;
};

type ServerGalleryState = {
  serverId: string;
  skip: number;
  hasMore: boolean;
  buffer: GalleryItem[];
};

type GalleryPageParam = {
  serverStates: ServerGalleryState[];
};

type GalleryBatchResponse = {
  items: GalleryItem[];
  nextPageParam?: GalleryPageParam;
};

const groupByOptions: { label: string; value: GroupBy }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'None', value: 'none' },
];

const GALLERY_BATCH_ROWS = 10;
const LOAD_MORE_THRESHOLD_PX = 720;

const sortGalleryItems = (left: GalleryItem, right: GalleryItem) =>
  +new Date(right.capturedAt ?? right.createdAt) - +new Date(left.capturedAt ?? left.createdAt);

const createInitialPageParam = (servers: ServerConnectionWithClient[]): GalleryPageParam => ({
  serverStates: servers.map((server) => ({
    serverId: server.id,
    skip: 0,
    hasMore: true,
    buffer: [],
  })),
});

const loadGalleryBatch = async ({
  batchSize,
  pageParam,
  serversById,
}: {
  batchSize: number;
  pageParam: GalleryPageParam;
  serversById: Map<string, ServerConnectionWithClient>;
}): Promise<GalleryBatchResponse> => {
  const hydratedStates = await Promise.all(
    pageParam.serverStates.map(async (state) => {
      const server = serversById.get(state.serverId);

      if (!server) {
        return {
          ...state,
          hasMore: false,
          buffer: [],
        };
      }

      let buffer = state.buffer;
      let skip = state.skip;
      let hasMore = state.hasMore;

      while (hasMore && buffer.length < batchSize) {
        const request: FindGalleryImagesRequest = {
          skip,
          take: batchSize - buffer.length,
        };
        const page = await server.client.gallery.findAll(request);

        if (!page.items.length) {
          hasMore = false;
          break;
        }

        const headers = server.client.getAuthHeaders();
        buffer = buffer.concat(
          page.items.map((item) => ({
            ...item,
            serverId: server.id,
            baseUrl: server.baseUrl,
            label: server.label,
            headers,
          }))
        );
        skip = page.nextSkip ?? skip + page.items.length;
        hasMore = page.hasMore;
      }

      return {
        ...state,
        skip,
        hasMore,
        buffer,
      };
    })
  );

  const items = hydratedStates
    .flatMap((state) => state.buffer)
    .sort(sortGalleryItems)
    .slice(0, batchSize);

  if (!items.length) {
    return { items };
  }

  const consumedByServer = new Map<string, number>();
  for (const item of items) {
    consumedByServer.set(item.serverId, (consumedByServer.get(item.serverId) ?? 0) + 1);
  }

  const nextServerStates = hydratedStates.map((state) => ({
    ...state,
    buffer: state.buffer.slice(consumedByServer.get(state.serverId) ?? 0),
  }));
  const hasMore = nextServerStates.some((state) => state.hasMore || state.buffer.length > 0);

  return {
    items,
    nextPageParam: hasMore ? { serverStates: nextServerStates } : undefined,
  };
};

const getGroupMetadata = (date: Date, groupBy: Exclude<GroupBy, 'none'>) => {
  switch (groupBy) {
    case 'day':
      return {
        key: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEEE, d MMMM yyyy'),
      };
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return {
        key: format(start, "yyyy-'W'II"),
        label: `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}`,
      };
    }
    case 'month':
      return {
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
      };
    case 'year':
      return {
        key: format(date, 'yyyy'),
        label: format(date, 'yyyy'),
      };
  }
};

const groupPhotos = (items: GalleryItem[], groupBy: GroupBy): GalleryGroup[] => {
  if (groupBy === 'none') {
    return [{ key: 'all', label: '', items }];
  }

  const groups = new Map<string, GalleryGroup>();

  for (const item of items) {
    const metadata = getGroupMetadata(new Date(item.capturedAt ?? item.createdAt), groupBy);
    const group = groups.get(metadata.key);

    if (group) {
      group.items.push(item);
      continue;
    }

    groups.set(metadata.key, {
      key: metadata.key,
      label: metadata.label,
      items: [item],
    });
  }

  return Array.from(groups.values());
};

const GalleryTile = memo(function GalleryTile({
  item,
  columnCount,
  photoIndex,
  onSelectPhoto,
}: {
  item: GalleryItem;
  columnCount: number;
  photoIndex: number | null;
  onSelectPhoto: (index: number | null) => void;
}) {
  const itemKey = `${item.serverId}:${item.id}`;
  const imageUri = `${item.baseUrl}${item.thumbnailPath}`;
  const tileWidth = `${100 / columnCount}%` as `${number}%`;

  return (
    <View key={itemKey} className="p-1" style={{ width: tileWidth }}>
      <Pressable
        className="overflow-hidden rounded-lg bg-layer-secondary aspect-square"
        onPress={() => onSelectPhoto(photoIndex)}
      >
        <Image
          source={{ uri: imageUri, headers: item.headers }}
          cachePolicy="memory-disk"
          contentFit="cover"
          transition={0}
          className="w-full h-full"
        />
      </Pressable>
    </View>
  );
});

const GalleryGrid = memo(function GalleryGrid({
  photoGroups,
  columnCount,
  photoIndexByKey,
  onSelectPhoto,
}: {
  photoGroups: GalleryGroup[];
  columnCount: number;
  photoIndexByKey: Map<string, number>;
  onSelectPhoto: (index: number | null) => void;
}) {
  return (
    <View className="gap-6">
      {photoGroups.map((group) => (
        <View key={group.key}>
          {group.label ? (
            <View className="mb-3 flex-row items-center gap-3">
              <Text variant="large">{group.label}</Text>
              <View className="h-px flex-1 bg-border" />
            </View>
          ) : null}

          <View className="flex-row flex-wrap -mx-1">
            {group.items.map((item) => {
              const itemKey = `${item.serverId}:${item.id}`;

              return (
                <GalleryTile
                  key={itemKey}
                  item={item}
                  columnCount={columnCount}
                  photoIndex={photoIndexByKey.get(itemKey) ?? null}
                  onSelectPhoto={onSelectPhoto}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
});

export default function GalleryPage() {
  const { t } = useTranslation();
  const { servers } = useServerContext();
  const { width } = useWindowDimensions();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [galleryRevision, setGalleryRevision] = useState(0);

  const columnCount = width > 1280 ? 5 : width > 1024 ? 4 : width > 768 ? 3 : 2;
  const batchSize = columnCount * GALLERY_BATCH_ROWS;
  const initialPageParam = useMemo(() => createInitialPageParam(servers), [servers]);
  const serversById = useMemo(() => new Map(servers.map((server) => [server.id, server])), [servers]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: ['gallery', galleryRevision, servers.map((server) => server.id)],
    initialPageParam,
    queryFn: ({ pageParam }) =>
      loadGalleryBatch({
        batchSize,
        pageParam: pageParam as GalleryPageParam,
        serversById,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    enabled: servers.length > 0,
  });

  const photos = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const hasMorePhotos = Boolean(hasNextPage);
  const photoGroups = useMemo(() => groupPhotos(photos, groupBy), [photos, groupBy]);
  const lightboxImages = useMemo<GalleryLightboxItem[]>(
    () =>
      photos.map((item) => ({
        key: `${item.serverId}:${item.id}`,
        uri: `${item.baseUrl}${item.previewPath}`,
        headers: item.headers,
      })),
    [photos]
  );
  const photoIndexByKey = useMemo(
    () => new Map(lightboxImages.map((item, index) => [item.key, index])),
    [lightboxImages]
  );

  const handleSelectPhoto = useCallback((index: number | null) => {
    setSelectedPhotoIndex(index);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasMorePhotos) {
        return;
      }

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromBottom <= LOAD_MORE_THRESHOLD_PX && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasMorePhotos, isFetchingNextPage]
  );

  const { mutate: uploadFiles, isPending: isUploading } = useMutation({
    mutationKey: ['gallery-upload'],
    mutationFn: async (files: File[]) => {
      const targetServer = servers[0];
      if (!targetServer) {
        throw new Error('No active server connections');
      }

      const settled = await Promise.allSettled(
        files.map((file) => targetServer.client.photo.uploadFile(file, file.name))
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
      setGalleryRevision((current) => current + 1);
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
    <BaseLayout onScroll={handleScroll} scrollEventThrottle={16}>
      <View className="mb-4 flex-row justify-between items-center gap-3">
        <Text variant="h1">{t('Gallery')}</Text>
        <View className="flex-row items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline">
                <Text>{groupByOptions.find((option) => option.value === groupBy)?.label ?? 'Day'}</Text>
                <Icon.ChevronDown className="text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {groupByOptions.map((option) => (
                <DropdownMenuItem key={option.value} onPress={() => setGroupBy(option.value)}>
                  <Text className="flex-1">{option.label}</Text>
                  {groupBy === option.value && <Icon.Check className="text-foreground" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onPress={handleUploadButtonPress} loading={isUploading}>
            <Icon.Add className="text-primary-foreground" />
            <Text>Upload</Text>
          </Button>
        </View>
      </View>

      {Platform.OS === 'web' && (
        <input ref={uploadInputRef} type="file" multiple onChange={handleFileInputChange} style={{ display: 'none' }} />
      )}

      {isPending && <Text className="text-muted-foreground">Loading photos...</Text>}
      {!isPending && photos.length === 0 && <Text className="text-muted-foreground">No photos yet</Text>}

      <GalleryGrid
        photoGroups={photoGroups}
        columnCount={columnCount}
        photoIndexByKey={photoIndexByKey}
        onSelectPhoto={handleSelectPhoto}
      />

      {!isPending && hasMorePhotos && !isFetchingNextPage && (
        <Text className="pt-4 text-center text-muted-foreground">Scroll to load more photos</Text>
      )}
      {isFetchingNextPage && <Text className="pt-4 text-center text-muted-foreground">Loading more photos...</Text>}

      <GalleryLightbox
        images={lightboxImages}
        index={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(null)}
        onIndexChange={setSelectedPhotoIndex}
      />
    </BaseLayout>
  );
}
