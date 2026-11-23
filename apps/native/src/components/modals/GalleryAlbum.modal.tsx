import { toast } from '@repo/shared/toast';
import { type ServerConnectionWithClient } from '@/providers/ServerProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AlbumResponse } from '@repo/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import {
  Button,
  Icon,
  Input,
  Modal,
  ModalButtons,
  ModalTitle,
  Text,
  theme,
  useModal,
  useThemeColors,
} from '@repo/shared/components';

const Field = styled.View`
  gap: ${theme.spacing[200]};
`;

const ButtonGroup = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[200]};
`;

const AlbumList = styled.ScrollView<{ $maxHeight: number }>`
  max-height: ${({ $maxHeight }) => `${$maxHeight}px`};
`;

const AlbumRows = styled.View`
  gap: ${theme.spacing[200]};
`;

const AlbumDepth = styled.View<{ $depth: number }>`
  margin-left: ${({ $depth }) => `${$depth * 18}px`};
`;

const AlbumButton = styled(Button)`
  width: 100%;
  align-self: stretch;
  justify-content: flex-start;
  padding: ${theme.spacing[300]};
`;

const AlbumDetails = styled.View`
  flex-shrink: 1;
`;

const AlbumName = styled(Text.M)<{ $selected?: boolean }>`
  color: ${({ $selected }) => ($selected ? theme.colors.text.inverted : theme.colors.text.default)};
  text-align: left;
`;

const AlbumDescription = styled(Text.Caption)<{ $selected?: boolean }>`
  color: ${({ $selected }) => ($selected ? theme.colors.text.inverted : theme.colors.text.secondary)};
  text-align: left;
`;

const SecondaryText = styled(Text.S)`
  color: ${theme.colors.text.secondary};
`;

const Actions = styled(ModalButtons)`
  justify-content: flex-end;
`;

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
  const { closeModal } = useModal();
  const colors = useThemeColors();
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
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={createAlbumCopy.title}>
      <ModalTitle>{createAlbumCopy.title}</ModalTitle>
      <SecondaryText>{createAlbumCopy.description}</SecondaryText>

      {!selectedPhotoCount && !parentAlbum && servers.length > 1 ? (
        <Field>
          <Text>{t('gallery.albumModal.selectServer')}</Text>
          <ButtonGroup>
            {servers.map((server) => (
              <Button
                key={server.id}
                variant={selectedServerId === server.id ? 'primary' : 'secondary'}
                onPress={() => setSelectedServerId(server.id)}
              >
                {server.label}
              </Button>
            ))}
          </ButtonGroup>
        </Field>
      ) : null}

      <Field>
        <Input
          label={t('common.labels.albumName')}
          value={name}
          onChangeText={setName}
          placeholder={parentAlbum ? t('gallery.albumModal.subalbumName') : t('common.labels.albumName')}
          autoFocus
        />
      </Field>

      <Field>
        <Text>{t('common.labels.parentAlbum')}</Text>
        <AlbumButton
          variant={selectedParentId === null ? 'primary' : 'secondary'}
          onPress={() => setSelectedParentId(null)}
          disabled={isPending}
        >
          <Icon.Folder color={selectedParentId === null ? colors.text.inverted : colors.text.default} size={18} />
          <AlbumDetails>
            <AlbumName $selected={selectedParentId === null}>
              {selectedPhotoCount > 0 ? t('gallery.albumModal.topLevelAlbum') : t('gallery.albumModal.noParent')}
            </AlbumName>
            <AlbumDescription $selected={selectedParentId === null}>
              {t('gallery.albumModal.rootLevelDescription')}
            </AlbumDescription>
          </AlbumDetails>
        </AlbumButton>

        {isLoadingAlbums ? <SecondaryText>{t('gallery.albumModal.loadingAlbums')}</SecondaryText> : null}
        {!isLoadingAlbums && albumRows.length > 0 ? (
          <AlbumList $maxHeight={256}>
            <AlbumRows>
              {albumRows.map(({ album, depth }) => (
                <AlbumDepth key={album.id} $depth={depth}>
                  <AlbumButton
                    variant={selectedParentId === album.id ? 'primary' : 'secondary'}
                    onPress={() => setSelectedParentId(album.id)}
                    disabled={isPending}
                  >
                    <Icon.Folder
                      color={selectedParentId === album.id ? colors.text.inverted : colors.text.default}
                      size={18}
                    />
                    <AlbumDetails>
                      <AlbumName $selected={selectedParentId === album.id}>{album.name}</AlbumName>
                      <AlbumDescription $selected={selectedParentId === album.id}>
                        {describeAlbum(album)}
                      </AlbumDescription>
                    </AlbumDetails>
                  </AlbumButton>
                </AlbumDepth>
              ))}
            </AlbumRows>
          </AlbumList>
        ) : null}
      </Field>

      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button onPress={() => createAlbum()} loading={isPending}>
          {parentAlbum ? t('gallery.albumModal.createSubalbum') : t('gallery.albumModal.createAlbum')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};

type GalleryAddToAlbumModalProps = {
  server: ServerConnectionWithClient;
  selectedPhotos: SelectedPhoto[];
  onAdded?: () => void;
};

export const GalleryAddToAlbumModal = ({ server, selectedPhotos, onAdded }: GalleryAddToAlbumModalProps) => {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const colors = useThemeColors();
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
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('gallery.albumModal.addToAlbumTitle')}>
      <ModalTitle>{t('gallery.albumModal.addToAlbumTitle')}</ModalTitle>
      <SecondaryText>
        {t('gallery.albumModal.selectedOnServer', {
          photoCount: formatCount(selectedPhotos.length, 'photo'),
          server: server.label,
        })}
      </SecondaryText>

      {isLoadingAlbums ? <SecondaryText>{t('gallery.albumModal.loadingAlbums')}</SecondaryText> : null}
      {!isLoadingAlbums && albumRows.length === 0 ? (
        <SecondaryText>{t('gallery.albumModal.emptyState')}</SecondaryText>
      ) : null}

      {!isLoadingAlbums && albumRows.length > 0 ? (
        <AlbumList $maxHeight={320}>
          <AlbumRows>
            {albumRows.map(({ album, depth }) => (
              <AlbumDepth key={album.id} $depth={depth}>
                <AlbumButton variant="secondary" onPress={() => addPhotos(album.id)} disabled={isPending}>
                  <Icon.Folder color={colors.text.default} size={18} />
                  <AlbumDetails>
                    <AlbumName>{album.name}</AlbumName>
                    <AlbumDescription>{describeAlbum(album)}</AlbumDescription>
                  </AlbumDetails>
                </AlbumButton>
              </AlbumDepth>
            ))}
          </AlbumRows>
        </AlbumList>
      ) : null}

      <Actions>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.close')}
        </Button>
      </Actions>
    </Modal>
  );
};
