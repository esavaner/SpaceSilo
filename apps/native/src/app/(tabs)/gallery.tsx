import { BaseLayout } from '@/components/base-layout';
import { Breadcrumb } from '@/components/breadcrumb';
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { GalleryAddToAlbumModal, GalleryCreateAlbumModal } from '@/components/modals/GalleryAlbum.modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/dropdowns/dropdown';
import { toast } from '@/lib/toast';
import { useServerContext, type ServerConnectionWithClient } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { cn } from '@/utils/cn';
import { type FindGalleryImagesRequest, type GalleryImageResponse, type GalleryViewMode } from '@repo/shared';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { Image } from 'expo-image';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, View, useWindowDimensions } from 'react-native';

type HydratedGalleryBase = GalleryImageResponse & {
  serverId: string;
  baseUrl: string;
  label: string;
  headers?: Record<string, string>;
};

type GalleryPhotoItem = HydratedGalleryBase & {
  type: 'photo';
  imagePath: string;
  previewPath: string;
  thumbnailPath: string;
};

type GalleryAlbumItem = HydratedGalleryBase & {
  type: 'album';
  name: string;
};

type GalleryItem = GalleryPhotoItem | GalleryAlbumItem;

type GroupBy = 'day' | 'week' | 'month' | 'year' | 'none';

type GalleryGroup = {
  key: string;
  label: string;
  items: GalleryItem[];
};

type AlbumPathEntry = {
  id: string;
  name: string;
  serverId: string;
  label: string;
};

type SelectedPhoto = {
  key: string;
  id: string;
  serverId: string;
  label: string;
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

const galleryViewModeOptions: { label: string; value: GalleryViewMode }[] = [
  { label: 'Photos only', value: 'photos-only' },
  { label: 'Photos + albums', value: 'photos-and-albums' },
  { label: 'Albums only', value: 'albums-only' },
  { label: 'Photos not in albums only', value: 'photos-not-in-albums-only' },
];

const sortGalleryItems = (left: GalleryItem, right: GalleryItem) =>
  +new Date(right.capturedAt ?? right.createdAt) - +new Date(left.capturedAt ?? left.createdAt) ||
  right.id.localeCompare(left.id);

const formatAlbumSummary = (item: GalleryAlbumItem) => {
  const parts: string[] = [];

  if (item.subalbumCount) {
    parts.push(`${item.subalbumCount} album${item.subalbumCount === 1 ? '' : 's'}`);
  }

  if (item.photoCount) {
    parts.push(`${item.photoCount} photo${item.photoCount === 1 ? '' : 's'}`);
  }

  return parts.join(' / ') || 'Empty album';
};

const hydrateGalleryItem = (
  item: GalleryImageResponse,
  server: ServerConnectionWithClient,
  headers?: Record<string, string>
): GalleryItem[] => {
  if (item.type === 'album') {
    if (!item.name) {
      return [];
    }

    return [
      {
        ...item,
        type: 'album',
        name: item.name,
        serverId: server.id,
        baseUrl: server.baseUrl,
        label: server.label,
        headers,
      },
    ];
  }

  if (!item.imagePath || !item.previewPath || !item.thumbnailPath) {
    return [];
  }

  return [
    {
      ...item,
      type: 'photo',
      imagePath: item.imagePath,
      previewPath: item.previewPath,
      thumbnailPath: item.thumbnailPath,
      serverId: server.id,
      baseUrl: server.baseUrl,
      label: server.label,
      headers,
    },
  ];
};

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
  viewMode,
  currentAlbum,
  pageParam,
  serversById,
}: {
  batchSize: number;
  viewMode: GalleryViewMode;
  currentAlbum: AlbumPathEntry | null;
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
          viewMode,
          parentAlbumId: currentAlbum?.id,
        };
        const page = await server.client.gallery.findAll(request);

        if (!page.items.length) {
          hasMore = false;
          break;
        }

        const headers = server.client.getAuthHeaders();
        buffer = buffer.concat(page.items.flatMap((item) => hydrateGalleryItem(item, server, headers)));
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

const groupGalleryItems = (items: GalleryItem[], groupBy: GroupBy): GalleryGroup[] => {
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
  isSelected,
  isSelectionMode,
  photoIndex,
  onOpenAlbum,
  onSelectPhoto,
  onTogglePhotoSelection,
}: {
  item: GalleryItem;
  columnCount: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  photoIndex: number | null;
  onOpenAlbum: (item: GalleryAlbumItem) => void;
  onSelectPhoto: (index: number | null) => void;
  onTogglePhotoSelection: (item: GalleryPhotoItem) => void;
}) {
  const itemKey = `${item.serverId}:${item.id}`;
  const tileWidth = `${100 / columnCount}%` as `${number}%`;
  const imageUri = item.thumbnailPath ? `${item.baseUrl}${item.thumbnailPath}` : null;
  const showSelectionIndicator = item.type === 'photo' && (isSelected || isSelectionMode || Platform.OS === 'web');

  const handlePress = () => {
    if (item.type === 'album') {
      onOpenAlbum(item);
      return;
    }

    if (isSelectionMode) {
      onTogglePhotoSelection(item);
      return;
    }

    onSelectPhoto(photoIndex);
  };

  return (
    <View key={itemKey} className="p-1" style={{ width: tileWidth }}>
      <Pressable
        className={cn(
          'group overflow-hidden rounded-lg bg-layer-secondary aspect-square',
          item.type === 'album' && 'border border-border',
          isSelected && item.type === 'photo' && 'border-2 border-primary'
        )}
        onLongPress={item.type === 'photo' && Platform.OS !== 'web' ? () => onTogglePhotoSelection(item) : undefined}
        delayLongPress={180}
        onPress={handlePress}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri, headers: item.headers }}
            cachePolicy="memory-disk"
            contentFit="cover"
            transition={0}
            className="w-full h-full"
          />
        ) : (
          <View className="absolute inset-0 items-center justify-center bg-accent/40">
            <Icon.Folder className="text-foreground" size={36} />
          </View>
        )}

        {item.type === 'album' ? <View className="absolute inset-0 bg-black/25" /> : null}

        {showSelectionIndicator ? (
          <Pressable
            className={cn(
              'absolute left-2 top-2 z-10 h-8 w-8 items-center justify-center rounded-full border transition-opacity',
              isSelected ? 'border-primary bg-primary opacity-100' : 'border-white/80 bg-black/40',
              Platform.OS === 'web' && !isSelected && !isSelectionMode && 'opacity-0 group-hover:opacity-100'
            )}
            onPress={(event) => {
              event.stopPropagation();
              onTogglePhotoSelection(item);
            }}
          >
            {isSelected ? (
              <Icon.Check className="text-primary-foreground" size={16} />
            ) : (
              <View className="h-3 w-3 rounded-full border border-white" />
            )}
          </Pressable>
        ) : null}

        {item.type === 'album' ? (
          <View className="absolute inset-x-0 bottom-0 gap-1 bg-black/70 p-3">
            <View className="flex-row items-center gap-2">
              <Icon.Folder className="text-white" size={16} />
              <Text className="flex-1 text-white">{item.name}</Text>
            </View>
            <Text className="text-xs text-white/80">{formatAlbumSummary(item)}</Text>
          </View>
        ) : null}

        {isSelected && item.type === 'photo' ? (
          <View className="absolute bottom-2 right-2 rounded-full bg-primary px-2 py-1">
            <Text className="text-xs text-primary-foreground">Selected</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
});

const GalleryGrid = memo(function GalleryGrid({
  galleryGroups,
  columnCount,
  isSelectionMode,
  photoIndexByKey,
  selectedPhotoKeys,
  onOpenAlbum,
  onSelectPhoto,
  onTogglePhotoSelection,
}: {
  galleryGroups: GalleryGroup[];
  columnCount: number;
  isSelectionMode: boolean;
  photoIndexByKey: Map<string, number>;
  selectedPhotoKeys: Set<string>;
  onOpenAlbum: (item: GalleryAlbumItem) => void;
  onSelectPhoto: (index: number | null) => void;
  onTogglePhotoSelection: (item: GalleryPhotoItem) => void;
}) {
  return (
    <View className="gap-6">
      {galleryGroups.map((group) => (
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
                  isSelected={selectedPhotoKeys.has(itemKey)}
                  isSelectionMode={isSelectionMode}
                  photoIndex={item.type === 'photo' ? (photoIndexByKey.get(itemKey) ?? null) : null}
                  onOpenAlbum={onOpenAlbum}
                  onSelectPhoto={onSelectPhoto}
                  onTogglePhotoSelection={onTogglePhotoSelection}
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
  const { openModal } = useUi();
  const { width } = useWindowDimensions();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [viewMode, setViewMode] = useState<GalleryViewMode>('photos-only');
  const [albumPath, setAlbumPath] = useState<AlbumPathEntry[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedPhotoMap, setSelectedPhotoMap] = useState<Record<string, SelectedPhoto>>({});
  const [galleryRevision, setGalleryRevision] = useState(0);

  const currentAlbum = albumPath.length > 0 ? albumPath[albumPath.length - 1] : null;
  const scopedServers = useMemo(
    () => (currentAlbum ? servers.filter((server) => server.id === currentAlbum.serverId) : servers),
    [currentAlbum, servers]
  );
  const columnCount = width > 1280 ? 5 : width > 1024 ? 4 : width > 768 ? 3 : 2;
  const batchSize = columnCount * GALLERY_BATCH_ROWS;
  const initialPageParam = useMemo(() => createInitialPageParam(scopedServers), [scopedServers]);
  const serversById = useMemo(() => new Map(scopedServers.map((server) => [server.id, server])), [scopedServers]);

  useEffect(() => {
    if (currentAlbum && scopedServers.length === 0) {
      setAlbumPath([]);
    }
  }, [currentAlbum, scopedServers.length]);

  useEffect(() => {
    setSelectedPhotoMap({});
    setSelectedPhotoIndex(null);
  }, [currentAlbum?.id, viewMode]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: [
      'gallery',
      galleryRevision,
      scopedServers.map((server) => server.id),
      currentAlbum?.serverId ?? null,
      currentAlbum?.id ?? null,
      viewMode,
    ],
    initialPageParam,
    queryFn: ({ pageParam }) =>
      loadGalleryBatch({
        batchSize,
        viewMode,
        currentAlbum,
        pageParam: pageParam as GalleryPageParam,
        serversById,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    enabled: scopedServers.length > 0,
  });

  const galleryItems = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const photos = useMemo(
    () => galleryItems.filter((item): item is GalleryPhotoItem => item.type === 'photo'),
    [galleryItems]
  );
  const selectedPhotos = useMemo(() => Object.values(selectedPhotoMap), [selectedPhotoMap]);
  const selectedPhotoKeys = useMemo(() => new Set(Object.keys(selectedPhotoMap)), [selectedPhotoMap]);
  const selectedServer = useMemo(() => {
    const serverIds = Array.from(new Set(selectedPhotos.map((photo) => photo.serverId)));
    if (serverIds.length !== 1) {
      return null;
    }

    return servers.find((server) => server.id === serverIds[0]) ?? null;
  }, [selectedPhotos, servers]);
  const isSelectionMode = selectedPhotos.length > 0;
  const hasMorePhotos = Boolean(hasNextPage);
  const galleryGroups = useMemo(() => groupGalleryItems(galleryItems, groupBy), [galleryItems, groupBy]);
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

  const handleTogglePhotoSelection = useCallback((item: GalleryPhotoItem) => {
    const itemKey = `${item.serverId}:${item.id}`;

    setSelectedPhotoMap((current) => {
      if (current[itemKey]) {
        const next = { ...current };
        delete next[itemKey];
        return next;
      }

      return {
        ...current,
        [itemKey]: {
          key: itemKey,
          id: item.id,
          serverId: item.serverId,
          label: item.label,
        },
      };
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedPhotoMap({});
  }, []);

  const handleOpenAlbum = useCallback((item: GalleryAlbumItem) => {
    setAlbumPath((current) => [
      ...current,
      {
        id: item.id,
        name: item.name,
        serverId: item.serverId,
        label: item.label,
      },
    ]);
    setSelectedPhotoIndex(null);
  }, []);

  const handleNavigateToRoot = useCallback(() => {
    setAlbumPath([]);
    setSelectedPhotoIndex(null);
  }, []);

  const handleNavigateToAlbum = useCallback((index: number) => {
    setAlbumPath((current) => current.slice(0, index + 1));
    setSelectedPhotoIndex(null);
  }, []);

  const albumBreadcrumbItems = currentAlbum
    ? [
        {
          key: 'gallery-root',
          label: t('Gallery'),
          onPress: handleNavigateToRoot,
        },
        ...albumPath.map((album, index) => ({
          key: `${album.serverId}:${album.id}`,
          label: album.name,
          onPress: index === albumPath.length - 1 ? undefined : () => handleNavigateToAlbum(index),
        })),
      ]
    : [];

  const handleOpenCreateAlbumModal = useCallback(() => {
    if (selectedPhotos.length > 0 && !selectedServer) {
      toast.error('Select photos from a single server to create an album from them');
      return;
    }

    const candidateServers =
      selectedPhotos.length > 0 && selectedServer ? [selectedServer] : currentAlbum ? scopedServers : servers;

    if (!candidateServers.length) {
      toast.error('No active server connections');
      return;
    }

    openModal(
      <GalleryCreateAlbumModal
        servers={candidateServers}
        parentAlbum={
          currentAlbum ? { id: currentAlbum.id, name: currentAlbum.name, serverId: currentAlbum.serverId } : null
        }
        selectedPhotos={selectedPhotos}
        onCreated={() => {
          if (selectedPhotos.length > 0) {
            setSelectedPhotoMap({});
          }
          setGalleryRevision((current) => current + 1);
        }}
      />
    );
  }, [currentAlbum, openModal, scopedServers, selectedPhotos, selectedServer, servers]);

  const handleOpenAddToAlbumModal = useCallback(() => {
    if (!selectedPhotos.length) {
      return;
    }

    if (!selectedServer) {
      toast.error('Select photos from a single server to add them to an album');
      return;
    }

    openModal(
      <GalleryAddToAlbumModal
        server={selectedServer}
        selectedPhotos={selectedPhotos}
        onAdded={() => {
          setSelectedPhotoMap({});
          setGalleryRevision((current) => current + 1);
        }}
      />
    );
  }, [openModal, selectedPhotos, selectedServer]);

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

  const header = (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-start justify-between gap-3">
        <View className="gap-2">
          <Text variant="h1">{currentAlbum ? currentAlbum.name : t('Gallery')}</Text>
          {currentAlbum && <Breadcrumb items={albumBreadcrumbItems} />}
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline">
                <Text>
                  {galleryViewModeOptions.find((option) => option.value === viewMode)?.label ?? 'Photos only'}
                </Text>
                <Icon.ChevronDown className="text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {galleryViewModeOptions.map((option) => (
                <DropdownMenuItem key={option.value} onPress={() => setViewMode(option.value)}>
                  <Text className="flex-1">{option.label}</Text>
                  {viewMode === option.value && <Icon.Check className="text-foreground" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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

          <Button variant="outline" onPress={handleOpenCreateAlbumModal} disabled={servers.length === 0}>
            <Icon.Folder className="text-foreground" />
            <Text>{currentAlbum ? 'New subalbum' : 'New album'}</Text>
          </Button>

          <Button onPress={handleUploadButtonPress} loading={isUploading}>
            <Icon.Add className="text-primary-foreground" />
            <Text>Upload</Text>
          </Button>
        </View>
      </View>

      {isSelectionMode ? (
        <View className="gap-2 rounded-lg border border-border bg-background p-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" onPress={handleClearSelection}>
              <Icon.Close />
            </Button>
            <Text className="mr-auto">
              {selectedPhotos.length} photo{selectedPhotos.length === 1 ? '' : 's'} selected
            </Text>
            <Button variant="outline" onPress={handleOpenCreateAlbumModal} disabled={!selectedServer}>
              <Icon.Folder className="text-foreground" />
              <Text>New album</Text>
            </Button>
            <Button variant="outline" onPress={handleOpenAddToAlbumModal} disabled={!selectedServer}>
              <Icon.Folder className="text-foreground" />
              <Text>Add to album</Text>
            </Button>
          </View>

          {!selectedServer ? (
            <Text className="text-sm text-muted-foreground">Album actions require photos from a single server.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <BaseLayout onScroll={handleScroll} scrollEventThrottle={16} header={header}>
      {Platform.OS === 'web' && (
        <input ref={uploadInputRef} type="file" multiple onChange={handleFileInputChange} style={{ display: 'none' }} />
      )}

      {isPending && <Text className="text-muted-foreground">Loading gallery...</Text>}
      {!isPending && galleryItems.length === 0 && (
        <Text className="text-muted-foreground">
          {currentAlbum ? 'This album is empty' : 'No photos or albums yet'}
        </Text>
      )}

      <GalleryGrid
        galleryGroups={galleryGroups}
        columnCount={columnCount}
        isSelectionMode={isSelectionMode}
        photoIndexByKey={photoIndexByKey}
        selectedPhotoKeys={selectedPhotoKeys}
        onOpenAlbum={handleOpenAlbum}
        onSelectPhoto={handleSelectPhoto}
        onTogglePhotoSelection={handleTogglePhotoSelection}
      />

      {!isPending && hasMorePhotos && !isFetchingNextPage && (
        <Text className="pt-4 text-center text-muted-foreground">Scroll to load more items</Text>
      )}
      {isFetchingNextPage && <Text className="pt-4 text-center text-muted-foreground">Loading more items...</Text>}

      <GalleryLightbox
        images={lightboxImages}
        index={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(null)}
        onIndexChange={setSelectedPhotoIndex}
      />
    </BaseLayout>
  );
}
