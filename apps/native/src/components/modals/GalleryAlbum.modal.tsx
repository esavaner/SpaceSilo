import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { Input } from '@/components/input';
import { toast } from '@/lib/toast';
import { useUi } from '@/providers/UiProvider';
import { type ServerConnectionWithClient } from '@/providers/ServerProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AlbumResponse } from '@repo/shared';
import { useEffect, useMemo, useState } from 'react';
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

const describeAlbum = (album: AlbumResponse) => {
  const parts: string[] = [];

  if (album.subalbumCount) {
    parts.push(`${album.subalbumCount} album${album.subalbumCount === 1 ? '' : 's'}`);
  }

  if (album.photoCount) {
    parts.push(`${album.photoCount} photo${album.photoCount === 1 ? '' : 's'}`);
  }

  return parts.join(' / ') || 'Empty album';
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
  const { closeModal } = useUi();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedServerId, setSelectedServerId] = useState(parentAlbum?.serverId ?? servers[0]?.id ?? '');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(parentAlbum?.id ?? null);

  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId) ?? null,
    [selectedServerId, servers]
  );

  const { data: albums = [], isPending: isLoadingAlbums } = useQuery({
    queryKey: ['albums', selectedServerId],
    queryFn: () => selectedServer!.client.album.findAll(),
    enabled: Boolean(selectedServer),
  });

  const albumRows = useMemo(() => buildAlbumRows(albums), [albums]);

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
        throw new Error('Album name is required');
      }

      if (!selectedServer) {
        throw new Error('Select a server first');
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
      toast.success(
        selectedPhotos.length > 0
          ? `Album created with ${selectedPhotos.length} photo${selectedPhotos.length === 1 ? '' : 's'}`
          : parentAlbum
            ? 'Subalbum created'
            : 'Album created'
      );
      closeModal();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create album');
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {selectedPhotos.length > 0 ? 'Create album from selection' : parentAlbum ? 'Create subalbum' : 'Create album'}
        </DialogTitle>
        <DialogDescription>
          {selectedPhotos.length > 0
            ? `Create an album with ${selectedPhotos.length} selected photo${selectedPhotos.length === 1 ? '' : 's'}`
            : parentAlbum
              ? `New album inside ${parentAlbum.name}`
              : 'Create a new album on one of your active servers'}
        </DialogDescription>
      </DialogHeader>

      {!selectedPhotos.length && !parentAlbum && servers.length > 1 ? (
        <View className="gap-2">
          <Text>Select a server</Text>
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

      <Input
        label="Album name"
        value={name}
        onChangeText={setName}
        placeholder={parentAlbum ? 'Subalbum name' : 'Album name'}
        autoFocus
      />

      <View className="gap-2">
        <Text>Parent album</Text>
        <Button
          variant={selectedParentId === null ? 'default' : 'outline'}
          onPress={() => setSelectedParentId(null)}
          disabled={isPending}
          className="justify-start px-3"
        >
          <Icon.Folder className={selectedParentId === null ? 'text-primary-foreground' : 'text-foreground'} />
          <View className="shrink">
            <Text>{selectedPhotos.length > 0 ? 'Top level album' : 'No parent'}</Text>
            <Text className="text-left text-xs text-muted-foreground">Album will be created at the root level</Text>
          </View>
        </Button>

        {isLoadingAlbums ? <Text className="text-muted-foreground">Loading albums...</Text> : null}
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
        okText={parentAlbum ? 'Create subalbum' : 'Create album'}
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
  const { closeModal } = useUi();
  const queryClient = useQueryClient();

  const { data: albums = [], isPending: isLoadingAlbums } = useQuery({
    queryKey: ['albums', server.id],
    queryFn: () => server.client.album.findAll(),
  });

  const albumRows = useMemo(() => buildAlbumRows(albums), [albums]);

  const { mutate: addPhotos, isPending } = useMutation({
    mutationFn: (albumId: string) =>
      server.client.album.addPhotos(albumId, {
        photoIds: selectedPhotos.map((photo) => photo.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['albums', server.id] });
      onAdded?.();
      toast.success('Photos added to album');
      closeModal();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add photos to album');
    },
  });

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Add to album</DialogTitle>
        <DialogDescription>
          {selectedPhotos.length} photo{selectedPhotos.length === 1 ? '' : 's'} selected on {server.label}
        </DialogDescription>
      </DialogHeader>

      {isLoadingAlbums ? <Text className="text-muted-foreground">Loading albums...</Text> : null}
      {!isLoadingAlbums && albumRows.length === 0 ? (
        <Text className="text-muted-foreground">No albums yet. Create one first, then add the selected photos.</Text>
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
            Close
          </Button>
        </DialogClose>
      </View>
    </DialogContent>
  );
};
