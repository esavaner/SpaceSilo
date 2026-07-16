import { BaseLayout } from '@/components/base-layout';
import { GalleryBrowserHeader } from '@/components/gallery/GalleryBrowserHeader';
import {
  GalleryGrid,
  type GalleryAlbumItem,
  type GalleryGroup,
  type GalleryItem,
  type GalleryPhotoItem,
} from '@/components/gallery/GalleryBrowserGrid';
import { Text } from '@/components/general/text';
import { GalleryAddToAlbumModal, GalleryCreateAlbumModal } from '@/components/modals/GalleryAlbum.modal';
import { toast } from '@/lib/toast';
import { resolveAppLanguage } from '@/i18n';
import { useServerContext, type ServerConnectionWithClient } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { type FindGalleryImagesRequest, type GalleryImageResponse, type GalleryViewMode } from '@repo/shared';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { enUS, pl } from 'date-fns/locale';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, NativeScrollEvent, NativeSyntheticEvent, Platform, useWindowDimensions } from 'react-native';
import { GalleryLightbox } from './GalleryLightbox';

export type GalleryBrowserMode = 'gallery' | 'trash';

type GroupBy = 'day' | 'week' | 'month' | 'year' | 'none';

type GalleryGroupMeta = Omit<GalleryGroup, 'items'>;

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

type SelectedPhotoAction = 'trash' | 'restore' | 'delete-permanently';

type AllTrashAction = 'restore-all' | 'delete-all';

type PendingAction = SelectedPhotoAction | AllTrashAction | null;

type LabelledOption<T extends string> = {
  label: string;
  value: T;
};

const GALLERY_BATCH_ROWS = 10;
const LOAD_MORE_THRESHOLD_PX = 720;

const sortGalleryItems = (left: GalleryItem, right: GalleryItem) =>
  +new Date(right.capturedAt ?? right.createdAt) - +new Date(left.capturedAt ?? left.createdAt) ||
  right.id.localeCompare(left.id);

const hydrateGalleryItem = (
  item: GalleryImageResponse,
  server: ServerConnectionWithClient,
  headers?: Record<string, string>
): GalleryItem[] => {
  const base = { ...item, serverId: server.id, baseUrl: server.baseUrl, label: server.label, headers };

  if (item.type === 'album') {
    return item.name ? [{ ...base, type: 'album', name: item.name }] : [];
  }

  return item.imagePath && item.previewPath && item.thumbnailPath
    ? [
        {
          ...base,
          type: 'photo',
          imagePath: item.imagePath,
          previewPath: item.previewPath,
          thumbnailPath: item.thumbnailPath,
        },
      ]
    : [];
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
  trash,
  pageParam,
  serversById,
}: {
  batchSize: number;
  viewMode: GalleryViewMode;
  currentAlbum: AlbumPathEntry | null;
  trash: boolean;
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
          parentAlbumId: trash ? undefined : currentAlbum?.id,
          trash: trash ? true : undefined,
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

const groupGalleryItems = (
  items: GalleryItem[],
  groupBy: GroupBy,
  formatters: Record<Exclude<GroupBy, 'none'>, (date: Date) => GalleryGroupMeta>
): GalleryGroup[] => {
  if (groupBy === 'none') {
    return [{ key: 'all', label: '', items }];
  }

  const groups = new Map<string, GalleryGroup>();

  for (const item of items) {
    const { key, label } = formatters[groupBy](new Date(item.capturedAt ?? item.createdAt));
    const group = groups.get(key);

    if (group) {
      group.items.push(item);
    } else {
      groups.set(key, { key, label, items: [item] });
    }
  }

  return [...groups.values()];
};

export function GalleryBrowser({ mode = 'gallery' }: { mode?: GalleryBrowserMode }) {
  const isTrashMode = mode === 'trash';
  const { i18n, t } = useTranslation();
  const { servers } = useServerContext();
  const { openModal } = useUi();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [viewMode, setViewMode] = useState<GalleryViewMode>('photos-only');
  const [albumPath, setAlbumPath] = useState<AlbumPathEntry[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedPhotoMap, setSelectedPhotoMap] = useState<Record<string, SelectedPhoto>>({});
  const [galleryRevision, setGalleryRevision] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const currentAlbum = isTrashMode || albumPath.length === 0 ? null : albumPath[albumPath.length - 1];
  const appLanguage = resolveAppLanguage(i18n.language);
  const dateLocale = appLanguage === 'pl' ? pl : enUS;
  const formatPhotoCount = (count: number) => `${count} ${t('common.nouns.photos')}`;
  const formatServerCount = (count: number) => `${count} ${t('common.nouns.servers')}`;
  const groupByOptions: LabelledOption<GroupBy>[] = [
    { label: t('gallery.groupBy.day'), value: 'day' },
    { label: t('gallery.groupBy.week'), value: 'week' },
    { label: t('gallery.groupBy.month'), value: 'month' },
    { label: t('gallery.groupBy.year'), value: 'year' },
    { label: t('gallery.groupBy.none'), value: 'none' },
  ];
  const galleryViewModeOptions: LabelledOption<GalleryViewMode>[] = [
    { label: t('gallery.viewModes.photosOnly'), value: 'photos-only' },
    { label: t('gallery.viewModes.photosAndAlbums'), value: 'photos-and-albums' },
    { label: t('gallery.viewModes.albumsOnly'), value: 'albums-only' },
    { label: t('gallery.viewModes.photosNotInAlbumsOnly'), value: 'photos-not-in-albums-only' },
  ];
  const groupFormatters: Record<Exclude<GroupBy, 'none'>, (date: Date) => GalleryGroupMeta> = {
    day: (date) => ({
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE, d MMMM yyyy', { locale: dateLocale }),
    }),
    week: (date) => {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });

      return {
        key: format(start, "yyyy-'W'II"),
        label: `${format(start, 'd MMM', { locale: dateLocale })} - ${format(end, 'd MMM yyyy', { locale: dateLocale })}`,
      };
    },
    month: (date) => ({
      key: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: dateLocale }),
    }),
    year: (date) => ({
      key: format(date, 'yyyy'),
      label: format(date, 'yyyy', { locale: dateLocale }),
    }),
  };
  const selectedActions: Record<
    SelectedPhotoAction,
    {
      run: (server: ServerConnectionWithClient, photoIds: string[]) => Promise<{ count: number }>;
      success: (count: number) => string;
      failure: (count: number) => string;
      confirm?: (count: number) => { title: string; message: string };
    }
  > = {
    trash: {
      run: (server, photoIds) => server.client.photo.trashMany({ photoIds }),
      success: (count) => t('gallery.toasts.trashSuccess', { photoCount: formatPhotoCount(count) }),
      failure: (count) => t('gallery.toasts.trashFailure', { serverCount: formatServerCount(count) }),
    },
    restore: {
      run: (server, photoIds) => server.client.photo.restoreMany({ photoIds }),
      success: (count) => t('gallery.toasts.restoreSuccess', { photoCount: formatPhotoCount(count) }),
      failure: (count) => t('gallery.toasts.restoreFailure', { serverCount: formatServerCount(count) }),
    },
    'delete-permanently': {
      run: (server, photoIds) => server.client.photo.removeManyPermanently({ photoIds }),
      success: (count) => t('gallery.toasts.deleteSuccess', { photoCount: formatPhotoCount(count) }),
      failure: (count) => t('gallery.toasts.deleteFailure', { serverCount: formatServerCount(count) }),
      confirm: (count) => ({
        title: t('gallery.confirmations.deletePermanentTitle'),
        message: t('gallery.confirmations.deletePermanentMessage', { photoCount: formatPhotoCount(count) }),
      }),
    },
  };
  const allTrashActions: Record<
    AllTrashAction,
    {
      run: (server: ServerConnectionWithClient) => Promise<{ count: number }>;
      success: (count: number) => string;
      failure: (count: number) => string;
      empty: string;
      confirm?: { title: string; message: string };
    }
  > = {
    'restore-all': {
      run: (server) => server.client.photo.restoreAll(),
      success: (count) => t('gallery.toasts.allRestoreSuccess', { photoCount: formatPhotoCount(count) }),
      failure: (count) => t('gallery.toasts.allRestoreFailure', { serverCount: formatServerCount(count) }),
      empty: t('gallery.toasts.allRestoreEmpty'),
    },
    'delete-all': {
      run: (server) => server.client.photo.removeAllTrashed(),
      success: (count) => t('gallery.toasts.allDeleteSuccess', { photoCount: formatPhotoCount(count) }),
      failure: (count) => t('gallery.toasts.allDeleteFailure', { serverCount: formatServerCount(count) }),
      empty: t('gallery.toasts.allDeleteEmpty'),
      confirm: {
        title: t('gallery.confirmations.deleteAllTitle'),
        message: t('gallery.confirmations.deleteAllMessage'),
      },
    },
  };
  const effectiveGroupBy = isTrashMode ? 'day' : groupBy;
  const effectiveViewMode = isTrashMode ? 'photos-only' : viewMode;
  const scopedServers = currentAlbum ? servers.filter((server) => server.id === currentAlbum.serverId) : servers;
  const columnCount = width > 1280 ? 5 : width > 1024 ? 4 : width > 768 ? 3 : 2;
  const batchSize = columnCount * GALLERY_BATCH_ROWS;
  const initialPageParam = createInitialPageParam(scopedServers);
  const scopedServersById = new Map(scopedServers.map((server) => [server.id, server]));

  useEffect(() => {
    if (isTrashMode) {
      setAlbumPath([]);
      setGroupBy('day');
      setViewMode('photos-only');
    }
  }, [isTrashMode]);

  useEffect(() => {
    if (currentAlbum && scopedServers.length === 0) {
      setAlbumPath([]);
    }
  }, [currentAlbum, scopedServers.length]);

  useEffect(() => {
    setSelectedPhotoMap({});
    setSelectedPhotoIndex(null);
  }, [currentAlbum?.id, effectiveViewMode, isTrashMode]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } = useInfiniteQuery({
    queryKey: [
      'gallery',
      galleryRevision,
      isTrashMode ? 'trash' : 'active',
      scopedServers.map((server) => server.id),
      currentAlbum?.serverId ?? null,
      currentAlbum?.id ?? null,
      effectiveViewMode,
    ],
    initialPageParam,
    queryFn: ({ pageParam }) =>
      loadGalleryBatch({
        batchSize,
        viewMode: effectiveViewMode,
        currentAlbum,
        trash: isTrashMode,
        pageParam: pageParam as GalleryPageParam,
        serversById: scopedServersById,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    enabled: scopedServers.length > 0,
  });

  const galleryItems = data?.pages.flatMap((page) => page.items) ?? [];
  const photos = galleryItems.filter((item): item is GalleryPhotoItem => item.type === 'photo');
  const selectedPhotos = Object.values(selectedPhotoMap);
  const selectedPhotoKeys = new Set(Object.keys(selectedPhotoMap));
  const selectedPhotoGroups = servers
    .map((server) => ({
      server,
      photoIds: selectedPhotos.filter((photo) => photo.serverId === server.id).map((photo) => photo.id),
    }))
    .filter((group) => group.photoIds.length > 0);
  const selectedServerIds = new Set(selectedPhotos.map((photo) => photo.serverId));
  const selectedServer = selectedServerIds.size === 1 ? (selectedPhotoGroups[0]?.server ?? null) : null;
  const isSelectionMode = selectedPhotos.length > 0;
  const hasMorePhotos = Boolean(hasNextPage);
  const galleryGroups = groupGalleryItems(galleryItems, effectiveGroupBy, groupFormatters);
  const lightboxImages: GalleryLightboxItem[] = photos.map((item) => ({
    key: `${item.serverId}:${item.id}`,
    uri: `${item.baseUrl}${item.previewPath}`,
    headers: item.headers,
  }));
  const photoIndexByKey = new Map(lightboxImages.map((item, index) => [item.key, index]));

  const refreshGalleryQueries = () => {
    setGalleryRevision((current) => current + 1);
    void queryClient.invalidateQueries({ queryKey: ['gallery'] });
  };

  const handleTogglePhotoSelection = (item: GalleryPhotoItem) => {
    const key = `${item.serverId}:${item.id}`;

    setSelectedPhotoMap((current) => {
      if (current[key]) {
        const next = { ...current };
        delete next[key];
        return next;
      }

      return { ...current, [key]: { key, id: item.id, serverId: item.serverId, label: item.label } };
    });
  };

  const handleClearSelection = () => {
    setSelectedPhotoMap({});
  };

  const handleOpenAlbum = (item: GalleryAlbumItem) => {
    if (!isTrashMode) {
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
    }
  };

  const handleNavigateToRoot = () => {
    setAlbumPath([]);
    setSelectedPhotoIndex(null);
  };

  const handleNavigateToAlbum = (index: number) => {
    setAlbumPath((current) => current.slice(0, index + 1));
    setSelectedPhotoIndex(null);
  };

  const confirmAction = (title: string, message: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(typeof window === 'undefined' ? true : window.confirm(message))
      : new Promise<boolean>((resolve) => {
          let finished = false;
          const finish = (value: boolean) => {
            if (!finished) {
              finished = true;
              resolve(value);
            }
          };

          Alert.alert(
            title,
            message,
            [
              { text: t('common.actions.cancel'), style: 'cancel', onPress: () => finish(false) },
              { text: t('common.actions.continue'), style: 'destructive', onPress: () => finish(true) },
            ],
            { cancelable: true, onDismiss: () => finish(false) }
          );
        });

  const runServerTasks = async ({
    action,
    tasks,
    confirm,
    messages,
    onSuccess,
  }: {
    action: PendingAction;
    tasks: { serverId: string; photoIds: string[]; run: () => Promise<{ count: number }> }[];
    confirm?: { title: string; message: string };
    messages: { success: (count: number) => string; failure: (count: number) => string; empty?: string };
    onSuccess: (successful: { serverId: string; photoIds: string[] }[]) => void;
  }) => {
    if (!tasks.length) {
      return;
    }

    if (confirm && !(await confirmAction(confirm.title, confirm.message))) {
      return;
    }

    setPendingAction(action);

    const settled = await Promise.allSettled(tasks.map(async (task) => ({ ...task, count: (await task.run()).count })));
    const successful = settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const successCount = successful.reduce((total, result) => total + result.count, 0);
    const failedCount = settled.length - successful.length;

    if (successCount > 0) {
      onSuccess(successful);
      toast.success(messages.success(successCount));
    } else if (failedCount === 0 && messages.empty) {
      toast.info(messages.empty);
    }

    if (failedCount > 0) {
      toast.error(messages.failure(failedCount));
    }

    setPendingAction(null);
  };

  const handleSelectedPhotoAction = (action: SelectedPhotoAction) => {
    const config = selectedActions[action];

    return runServerTasks({
      action,
      tasks: selectedPhotoGroups.map(({ server, photoIds }) => ({
        serverId: server.id,
        photoIds,
        run: () => config.run(server, photoIds),
      })),
      confirm: config.confirm?.(selectedPhotos.length),
      messages: config,
      onSuccess: (successful) => {
        const successfulKeys = new Set(
          successful.flatMap(({ serverId, photoIds }) => photoIds.map((photoId) => `${serverId}:${photoId}`))
        );

        setSelectedPhotoMap((current) =>
          Object.fromEntries(Object.entries(current).filter(([key]) => !successfulKeys.has(key)))
        );
        setSelectedPhotoIndex(null);
        refreshGalleryQueries();
      },
    });
  };

  const handleAllTrashAction = (action: AllTrashAction) => {
    const config = allTrashActions[action];

    return runServerTasks({
      action,
      tasks: scopedServers.map((server) => ({ serverId: server.id, photoIds: [], run: () => config.run(server) })),
      confirm: config.confirm,
      messages: config,
      onSuccess: () => {
        handleClearSelection();
        setSelectedPhotoIndex(null);
        refreshGalleryQueries();
      },
    });
  };

  const albumBreadcrumbItems = currentAlbum
    ? [
        {
          key: 'gallery-root',
          label: t('navigation.gallery'),
          onPress: handleNavigateToRoot,
        },
        ...albumPath.map((album, index) => ({
          key: `${album.serverId}:${album.id}`,
          label: album.name,
          onPress: index === albumPath.length - 1 ? undefined : () => handleNavigateToAlbum(index),
        })),
      ]
    : [];

  const handleOpenCreateAlbumModal = () => {
    if (selectedPhotos.length > 0 && !selectedServer) {
      toast.error(t('gallery.errors.createAlbumDifferentServer'));
      return;
    }

    const candidateServers =
      selectedPhotos.length > 0 && selectedServer ? [selectedServer] : currentAlbum ? scopedServers : servers;

    if (!candidateServers.length) {
      toast.error(t('gallery.errors.noActiveServers'));
    } else
      openModal(
        <GalleryCreateAlbumModal
          servers={candidateServers}
          parentAlbum={
            currentAlbum ? { id: currentAlbum.id, name: currentAlbum.name, serverId: currentAlbum.serverId } : null
          }
          selectedPhotos={selectedPhotos}
          onCreated={() => (selectedPhotos.length > 0 ? setSelectedPhotoMap({}) : refreshGalleryQueries())}
        />
      );
  };

  const handleOpenAddToAlbumModal = () => {
    if (selectedPhotos.length) {
      if (!selectedServer) {
        toast.error(t('gallery.errors.addToAlbumDifferentServer'));
      } else
        openModal(
          <GalleryAddToAlbumModal
            server={selectedServer}
            selectedPhotos={selectedPhotos}
            onAdded={() => {
              setSelectedPhotoMap({});
              refreshGalleryQueries();
            }}
          />
        );
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (hasMorePhotos) {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom <= LOAD_MORE_THRESHOLD_PX && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  const { mutate: uploadFiles, isPending: isUploading } = useMutation({
    mutationKey: ['gallery-upload'],
    mutationFn: async (files: File[]) => {
      const targetServer = servers[0];
      if (!targetServer) {
        throw new Error(t('gallery.errors.noActiveServers'));
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
        toast.success(t('gallery.toasts.uploadSuccess', { fileCount: `${successCount} ${t('common.nouns.files')}` }));
      }
      if (failedCount > 0) {
        toast.error(t('gallery.toasts.uploadFailedCount', { fileCount: `${failedCount} ${t('common.nouns.files')}` }));
      }
      refreshGalleryQueries();
    },
    onError: () => {
      toast.error(t('gallery.toasts.uploadFailed'));
    },
  });

  const handleUploadButtonPress = () => {
    if (Platform.OS !== 'web') toast.error(t('gallery.toasts.uploadWebOnly'));
    else uploadInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (selected?.length) {
      uploadFiles(Array.from(selected));
      event.target.value = '';
    }
  };

  const header = (
    <GalleryBrowserHeader
      isTrashMode={isTrashMode}
      title={isTrashMode ? t('navigation.trash') : currentAlbum ? currentAlbum.name : t('navigation.gallery')}
      breadcrumbItems={albumBreadcrumbItems}
      viewModeOptions={galleryViewModeOptions}
      viewMode={effectiveViewMode}
      onViewModeChange={setViewMode}
      groupByOptions={groupByOptions}
      groupBy={effectiveGroupBy}
      onGroupByChange={setGroupBy}
      isSelectionMode={isSelectionMode}
      selectedPhotoCountLabel={t('gallery.selectionCount', { photoCount: formatPhotoCount(selectedPhotos.length) })}
      hasSelectedServer={Boolean(selectedServer)}
      pendingAction={pendingAction}
      serverCount={isTrashMode ? scopedServers.length : servers.length}
      isUploading={isUploading}
      onCreateAlbum={handleOpenCreateAlbumModal}
      onUpload={handleUploadButtonPress}
      onClearSelection={handleClearSelection}
      onAddToAlbum={handleOpenAddToAlbumModal}
      onTrashSelected={() => void handleSelectedPhotoAction('trash')}
      onRestoreSelected={() => void handleSelectedPhotoAction('restore')}
      onDeleteSelectedPermanently={() => void handleSelectedPhotoAction('delete-permanently')}
      onRestoreAll={() => void handleAllTrashAction('restore-all')}
      onDeleteAll={() => void handleAllTrashAction('delete-all')}
    />
  );

  return (
    <BaseLayout onScroll={handleScroll} scrollEventThrottle={16} header={header}>
      {!isTrashMode && Platform.OS === 'web' ? (
        <input ref={uploadInputRef} type="file" multiple onChange={handleFileInputChange} style={{ display: 'none' }} />
      ) : null}

      {isPending ? <Text className="text-muted-foreground">{t('gallery.loading')}</Text> : null}
      {!isPending && galleryItems.length === 0 ? (
        <Text className="text-muted-foreground">
          {isTrashMode
            ? t('gallery.empty.trash')
            : currentAlbum
              ? t('gallery.empty.album')
              : t('gallery.empty.library')}
        </Text>
      ) : null}

      <GalleryGrid
        galleryGroups={galleryGroups}
        columnCount={columnCount}
        isSelectionMode={isSelectionMode}
        photoIndexByKey={photoIndexByKey}
        selectedPhotoKeys={selectedPhotoKeys}
        onOpenAlbum={handleOpenAlbum}
        onSelectPhoto={setSelectedPhotoIndex}
        onTogglePhotoSelection={handleTogglePhotoSelection}
      />

      {!isPending && hasMorePhotos && !isFetchingNextPage ? (
        <Text className="pt-4 text-center text-muted-foreground">{t('gallery.scrollToLoadMore')}</Text>
      ) : null}
      {isFetchingNextPage ? (
        <Text className="pt-4 text-center text-muted-foreground">{t('gallery.loadingMore')}</Text>
      ) : null}

      <GalleryLightbox
        images={lightboxImages}
        index={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(null)}
        onIndexChange={setSelectedPhotoIndex}
      />
    </BaseLayout>
  );
}
