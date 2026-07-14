import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { Input } from '@/components/form/input';
import { toast } from '@/lib/toast';
import { useUi } from '@/providers/UiProvider';
import { type ServerConnectionWithClient } from '@/providers/ServerProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AlbumResponse } from '@repo/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';

type AlbumParentContext = {
  id: string;
  name: string;
  serverId: string;
};

type SelectedPhoto = {
  id: string;
};

type AlbumRow = {
  album: AlbumResponse;
  depth: number;
};

const compareAlbums = (left: AlbumResponse, right: AlbumResponse) => {
  const dateDifference = +new Date(right.capturedAt ?? right.createdAt) - +new Date(left.capturedAt ?? left.createdAt);

  if (dateDifference !== 0) {
    return dateDifference;
  }

  return left.name.localeCompare(right.name);
};

const buildAlbumRows = (albums: AlbumResponse[]) => {
  const rows: AlbumRow[] = [];
  const albumsByParent = new Map<string | null, AlbumResponse[]>();

  for (const album of albums) {
    const parentId = album.parentId ?? null;
    const siblingAlbums = albumsByParent.get(parentId) ?? [];
    siblingAlbums.push(album);
    albumsByParent.set(parentId, siblingAlbums);
  }

  for (const siblingAlbums of albumsByParent.values()) {
    siblingAlbums.sort(compareAlbums);
  }

  const walk = (parentId: string | null, depth: number) => {
    const siblingAlbums = albumsByParent.get(parentId) ?? [];

    for (const album of siblingAlbums) {
      rows.push({ album, depth });
      walk(album.id, depth + 1);
    }
  };

  walk(null, 0);
  return rows;
};

type GalleryCreateAlbumModalProps = {
  servers: ServerConnectionWithClient[];
  parentAlbum?: AlbumParentContext | null;
  selectedPhotos?: SelectedPhoto[];
  onCreated?: () => void;
};

export const GalleryCreateAlbumModal = ({
  servers,
  parentAlbum = null,
  selectedPhotos = [],
  onCreated,
}: GalleryCreateAlbumModalProps) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedServerId, setSelectedServerId] = useState(parentAlbum?.serverId ?? servers[0]?.id ?? '');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(parentAlbum?.id ?? null);
  const selectedPhotoCount = selectedPhotos.length;
  const formatCount = (count: number, label: 'album' | 'photo') => {
    const nounKey = label === 'album' ? 'albums' : 'photos';
    return `${count} ${t(`common.nouns.${nounKey}`)}`;
  };
  const describeAlbum = (album: AlbumResponse) =>
    [
      album.subalbumCount && formatCount(album.subalbumCount, 'album'),
      album.photoCount && formatCount(album.photoCount, 'photo'),
    ]
      .filter(Boolean)
      .join(' / ') || t('gallery.albumModal.emptyAlbum');

  const createAlbumCopy =
    selectedPhotoCount > 0
      ? {
          title: t('gallery.albumModal.createFromSelectionTitle'),
          description: t('gallery.albumModal.createFromSelectionDescription', {
            photoCount: formatCount(selectedPhotoCount, 'photo'),
          }),
          success: t('gallery.albumModal.createAlbumWithPhotosSuccess', {
            photoCount: formatCount(selectedPhotoCount, 'photo'),
          }),
        }
      : parentAlbum
        ? {
            title: t('gallery.albumModal.createSubalbumTitle'),
            description: t('gallery.albumModal.createSubalbumDescription', { name: parentAlbum.name }),
            success: t('gallery.albumModal.subalbumCreated'),
          }
        : {
            title: t('gallery.albumModal.createTitle'),
            description: t('gallery.albumModal.createDescription'),
            success: t('gallery.albumModal.createAlbumSuccess'),
          };

  const selectedServer = servers.find((server) => server.id === selectedServerId) ?? null;

  const { data: albums = [], isPending: isLoadingAlbums } = useQuery({
    queryKey: ['albums', selectedServerId],
    queryFn: () => selectedServer!.client.album.findAll(),
    enabled: Boolean(selectedServer),
  });

  const albumRows = buildAlbumRows(albums);

  useEffect(() => {
    const nextParentId = parentAlbum?.serverId === selectedServerId ? (parentAlbum.id ?? null) : null;
    setSelectedParentId(nextParentId);
  }, [parentAlbum?.id, parentAlbum?.serverId, selectedServerId]);

  useEffect(() => {
    if (!selectedParentId) {
      return;
    }

    const stillExists = albums.some((album) => album.id === selectedParentId);
    if (!stillExists) {
      setSelectedParentId(null);
    }
  }, [albums, selectedParentId]);

  const { mutate: createAlbum, isPending } = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error(t('gallery.albumModal.nameRequired'));
      }

      if (!selectedServer) {
        throw new Error(t('common.messages.selectServerFirst'));
      }

      return selectedServer.client.album.create({
        name: trimmedName,
        parentId: selectedParentId,
        photoIds: selectedPhotos.map((photo) => photo.id),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      if (selectedServer) {
        queryClient.invalidateQueries({ queryKey: ['albums', selectedServer.id] });
      }
      onCreated?.();
      toast.success(createAlbumCopy.success);
      closeModal();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('gallery.toasts.createAlbumFailure'));
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{createAlbumCopy.title}</DialogTitle>
        <DialogDescription>{createAlbumCopy.description}</DialogDescription>
      </DialogHeader>

      {!selectedPhotoCount && !parentAlbum && servers.length > 1 ? (
        <View className="gap-2">
          <Text>{t('gallery.albumModal.selectServer')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {servers.map((server) => (
              <Button
                key={server.id}
                variant={selectedServerId === server.id ? 'default' : 'outline'}
                onPress={() => setSelectedServerId(server.id)}
              >
                <Text>{server.label}</Text>
              </Button>
            ))}
          </View>
        </View>
      ) : null}

      <View className="gap-2">
        <Text>{t('common.labels.albumName')}</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={parentAlbum ? t('gallery.albumModal.subalbumName') : t('common.labels.albumName')}
          autoFocus
        />
      </View>

      <View className="gap-2">
        <Text>{t('common.labels.parentAlbum')}</Text>
        <Button
          variant={selectedParentId === null ? 'default' : 'outline'}
          onPress={() => setSelectedParentId(null)}
          disabled={isPending}
          className="justify-start px-3"
        >
          <Icon.Folder className={selectedParentId === null ? 'text-primary-foreground' : 'text-foreground'} />
          <View className="shrink">
            <Text>
              {selectedPhotoCount > 0 ? t('gallery.albumModal.topLevelAlbum') : t('gallery.albumModal.noParent')}
            </Text>
            <Text className="text-left text-xs text-muted-foreground">
              {t('gallery.albumModal.rootLevelDescription')}
            </Text>
          </View>
        </Button>

        {isLoadingAlbums ? (
          <Text className="text-muted-foreground">{t('gallery.albumModal.loadingAlbums')}</Text>
        ) : null}
        {!isLoadingAlbums && albumRows.length > 0 ? (
          <ScrollView className="max-h-64">
            <View className="gap-2">
              {albumRows.map(({ album, depth }) => (
                <View key={album.id} style={{ paddingLeft: depth * 18 }}>
                  <Button
                    variant={selectedParentId === album.id ? 'default' : 'outline'}
                    onPress={() => setSelectedParentId(album.id)}
                    disabled={isPending}
                    className="justify-start px-3 py-3"
                  >
                    <Icon.Folder
                      className={selectedParentId === album.id ? 'text-primary-foreground' : 'text-foreground'}
                    />
                    <View className="shrink">
                      <Text className="text-left">{album.name}</Text>
                      <Text className="text-left text-xs text-muted-foreground">{describeAlbum(album)}</Text>
                    </View>
                  </Button>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </View>

      <DialogFooter
        okText={parentAlbum ? t('gallery.albumModal.createSubalbum') : t('gallery.albumModal.createAlbum')}
        onOk={() => createAlbum()}
        loading={isPending}
      />
    </DialogContent>
  );
};

type GalleryAddToAlbumModalProps = {
  server: ServerConnectionWithClient;
  selectedPhotos: SelectedPhoto[];
  onAdded?: () => void;
};

export const GalleryAddToAlbumModal = ({ server, selectedPhotos, onAdded }: GalleryAddToAlbumModalProps) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const queryClient = useQueryClient();
  const formatCount = (count: number, label: 'album' | 'photo') => {
    const nounKey = label === 'album' ? 'albums' : 'photos';
    return `${count} ${t(`common.nouns.${nounKey}`)}`;
  };
  const describeAlbum = (album: AlbumResponse) =>
    [
      album.subalbumCount && formatCount(album.subalbumCount, 'album'),
      album.photoCount && formatCount(album.photoCount, 'photo'),
    ]
      .filter(Boolean)
      .join(' / ') || t('gallery.albumModal.emptyAlbum');

  const { data: albums = [], isPending: isLoadingAlbums } = useQuery({
    queryKey: ['albums', server.id],
    queryFn: () => server.client.album.findAll(),
  });

  const albumRows = buildAlbumRows(albums);

  const { mutate: addPhotos, isPending } = useMutation({
    mutationFn: (albumId: string) =>
      server.client.album.addPhotos(albumId, {
        photoIds: selectedPhotos.map((photo) => photo.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['albums', server.id] });
      onAdded?.();
      toast.success(t('gallery.toasts.addToAlbumSuccess'));
      closeModal();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('gallery.albumModal.addToAlbumFailure'));
    },
  });

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{t('gallery.albumModal.addToAlbumTitle')}</DialogTitle>
        <DialogDescription>
          {t('gallery.albumModal.selectedOnServer', {
            photoCount: formatCount(selectedPhotos.length, 'photo'),
            server: server.label,
          })}
        </DialogDescription>
      </DialogHeader>

      {isLoadingAlbums ? <Text className="text-muted-foreground">{t('gallery.albumModal.loadingAlbums')}</Text> : null}
      {!isLoadingAlbums && albumRows.length === 0 ? (
        <Text className="text-muted-foreground">{t('gallery.albumModal.emptyState')}</Text>
      ) : null}

      {!isLoadingAlbums && albumRows.length > 0 ? (
        <ScrollView className="max-h-80">
          <View className="gap-2">
            {albumRows.map(({ album, depth }) => (
              <View key={album.id} style={{ paddingLeft: depth * 18 }}>
                <Button
                  variant="outline"
                  onPress={() => addPhotos(album.id)}
                  disabled={isPending}
                  className="justify-start px-3 py-3"
                >
                  <Icon.Folder />
                  <View className="shrink">
                    <Text className="text-left">{album.name}</Text>
                    <Text className="text-left text-xs text-muted-foreground">{describeAlbum(album)}</Text>
                  </View>
                </Button>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View className="flex-row justify-end">
        <DialogClose asChild>
          <Button variant="secondary" disabled={isPending}>
            {t('common.actions.close')}
          </Button>
        </DialogClose>
      </View>
    </DialogContent>
  );
};
