import { type GalleryImageResponse } from '@repo/shared';
import { Icon, Text, theme, useThemeColors } from '@repo/shared/components';
import { Image } from 'expo-image';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import styled, { css } from 'styled-components/native';

const TileCell = styled.View`
  padding: ${theme.spacing[100]};
`;

const Tile = styled.Pressable<{ $album: boolean; $selected: boolean }>`
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: ${theme.radius[200]};
  background-color: ${theme.colors.surface.medium};
  border-width: ${({ $album, $selected }) => ($selected ? theme.borderWeight[50] : $album ? theme.borderWeight[25] : '0px')};
  border-color: ${({ $album }) => ($album ? theme.colors.border.default : theme.colors.border.primary.default)};
`;

const EmptyTile = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.surface.stronger};
`;

const AttachmentBadge = styled.View`
  position: absolute;
  top: ${theme.spacing[200]};
  right: ${theme.spacing[200]};
  border-radius: ${theme.radius.full};
  padding: ${theme.spacing[100]};
  background-color: ${theme.colors.surface.darker};
`;

const AlbumTint = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${theme.colors.surface.darker};
`;

const SelectionButton = styled.Pressable<{ $selected: boolean; $visible: boolean }>`
  position: absolute;
  top: ${theme.spacing[200]};
  left: ${theme.spacing[200]};
  z-index: ${theme.zIndex.raised};
  width: ${theme.spacing[800]};
  height: ${theme.spacing[800]};
  align-items: center;
  justify-content: center;
  border-radius: ${theme.radius.full};
  border-width: ${theme.borderWeight[25]};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  background-color: ${({ $selected }) => ($selected ? theme.colors.primary.default : theme.colors.surface.darker)};
  border-color: ${({ $selected }) => ($selected ? theme.colors.border.primary.default : theme.colors.text.inverted)};
  ${
    Platform.OS === 'web' &&
    css`
      transition: opacity 150ms;
    `
  }
`;

const SelectionCircle = styled.View`
  width: ${theme.spacing[300]};
  height: ${theme.spacing[300]};
  border-radius: ${theme.radius.full};
  border-width: ${theme.borderWeight[25]};
  border-color: ${theme.colors.border.default};
`;

const AlbumCaption = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[300]};
  background-color: ${theme.colors.overlay};
`;

const AlbumName = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[200]};
`;

const SelectedBadge = styled.View`
  position: absolute;
  bottom: ${theme.spacing[200]};
  right: ${theme.spacing[200]};
  border-radius: ${theme.radius.full};
  padding: ${theme.spacing[100]} ${theme.spacing[200]};
  background-color: ${theme.colors.primary.default};
`;

const Groups = styled.View`
  gap: ${theme.spacing[600]};
`;

const GroupHeading = styled.View`
  margin-bottom: ${theme.spacing[300]};
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[300]};
`;

const GroupDivider = styled.View`
  height: ${theme.borderWeight[25]};
  flex: 1;
  background-color: ${theme.colors.border.default};
`;

const Grid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin: 0 -${theme.spacing[100]};
`;

type HydratedGalleryBase = GalleryImageResponse & {
  serverId: string;
  baseUrl: string;
  label: string;
  headers?: Record<string, string>;
};

export type GalleryPhotoItem = HydratedGalleryBase & {
  type: 'photo';
  imagePath: string;
  previewPath: string;
  thumbnailPath: string;
};

export type GalleryAlbumItem = HydratedGalleryBase & {
  type: 'album';
  name: string;
};

export type GalleryItem = GalleryPhotoItem | GalleryAlbumItem;

export type GalleryGroup = {
  key: string;
  label: string;
  items: GalleryItem[];
};

const LONG_PRESS_DELAY_MS = 320;

const getSupportsHoverSelection = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
};

function useSupportsHoverSelection() {
  const [supportsHoverSelection, setSupportsHoverSelection] = useState(getSupportsHoverSelection);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setSupportsHoverSelection(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
    };
  }, []);

  return supportsHoverSelection;
}

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
  const imageUri = item.thumbnailPath && item.displayable !== false ? `${item.baseUrl}${item.thumbnailPath}` : null;
  const isEmptyBox = item.type === 'photo' && !imageUri;
  const supportsHoverSelection = useSupportsHoverSelection();
  const [hovered, setHovered] = useState(false);
  const { t } = useTranslation();
  const colors = useThemeColors();
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressHandledRef = useRef(false);

  const clearLongPressTimeout = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  useEffect(() => clearLongPressTimeout, []);

  const handlePress = () => {
    if (longPressHandledRef.current) {
      longPressHandledRef.current = false;
      return;
    }

    if (item.type === 'album') {
      onOpenAlbum(item);
    } else if (isSelectionMode) {
      onTogglePhotoSelection(item);
    } else if (!isEmptyBox) {
      onSelectPhoto(photoIndex);
    }
  };

  const handlePressIn = () => {
    if (item.type !== 'photo' || supportsHoverSelection) {
      return;
    }

    longPressHandledRef.current = false;
    clearLongPressTimeout();
    longPressTimeoutRef.current = setTimeout(() => {
      longPressHandledRef.current = true;
      onTogglePhotoSelection(item);
      clearLongPressTimeout();
    }, LONG_PRESS_DELAY_MS);
  };

  const handlePressOut = () => {
    clearLongPressTimeout();
  };

  return (
    <TileCell style={{ width: `${100 / columnCount}%` as `${number}%` }}>
      <Tile
        $album={item.type === 'album'}
        $selected={isSelected && item.type === 'photo'}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onLongPress={Platform.OS !== 'web' && item.type === 'photo' ? () => onTogglePhotoSelection(item) : undefined}
        delayLongPress={LONG_PRESS_DELAY_MS}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri, headers: item.headers }}
            cachePolicy="memory-disk"
            contentFit="cover"
            transition={0}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <EmptyTile>
            {isEmptyBox ? (
              <Icon.FileText color={colors.text.secondary} size={36} aria-hidden />
            ) : (
              <Icon.Folder color={colors.text.default} size={36} aria-hidden />
            )}
          </EmptyTile>
        )}

        {item.type === 'photo' && (item.sidecarCount ?? 0) > 0 ? (
          <AttachmentBadge>
            <Icon.Paperclip color={colors.text.inverted} size={14} aria-hidden />
          </AttachmentBadge>
        ) : null}

        {item.type === 'album' ? <AlbumTint /> : null}

        {item.type === 'photo' && (isSelected || isSelectionMode || supportsHoverSelection) ? (
          <SelectionButton
            $selected={isSelected}
            $visible={isSelected || isSelectionMode || !supportsHoverSelection || hovered}
            onPress={(event) => {
              event.stopPropagation();
              onTogglePhotoSelection(item);
            }}
          >
            {isSelected ? <Icon.Check color={colors.text.inverted} size={16} aria-hidden /> : <SelectionCircle />}
          </SelectionButton>
        ) : null}

        {item.type === 'album' ? (
          <AlbumCaption>
            <AlbumName>
              <Icon.Folder color={colors.text.inverted} size={16} aria-hidden />
              <Text color={theme.colors.text.inverted} style={{ flex: 1 }}>
                {item.name}
              </Text>
            </AlbumName>
            <Text.Caption color={theme.colors.text.inverted}>
              {[
                item.subalbumCount ? `${item.subalbumCount} ${t('common.nouns.albums')}` : '',
                item.photoCount ? `${item.photoCount} ${t('common.nouns.photos')}` : '',
              ]
                .filter(Boolean)
                .join(' / ') || t('gallery.albumModal.emptyAlbum')}
            </Text.Caption>
          </AlbumCaption>
        ) : null}

        {isSelected && item.type === 'photo' ? (
          <SelectedBadge>
            <Text.Caption color={theme.colors.text.inverted}>{t('gallery.selected')}</Text.Caption>
          </SelectedBadge>
        ) : null}
      </Tile>
    </TileCell>
  );
});

export const GalleryGrid = memo(function GalleryGrid({
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
    <Groups>
      {galleryGroups.map((group) => (
        <View key={group.key}>
          {group.label && (
            <GroupHeading>
              <Text.H3>{group.label}</Text.H3>
              <GroupDivider />
            </GroupHeading>
          )}
          <Grid>
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
          </Grid>
        </View>
      ))}
    </Groups>
  );
});
