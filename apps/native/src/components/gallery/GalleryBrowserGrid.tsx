import { cn } from '@/utils/cn';
import { type GalleryImageResponse } from '@repo/shared';
import { Text, theme, useThemeColors } from '@repo/shared/components';
import { Image } from 'expo-image';
import { Check, FileText, Folder, Paperclip } from 'lucide-react-native';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';

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
    <View className="p-1" style={{ width: `${100 / columnCount}%` as `${number}%` }}>
      <Pressable
        className={cn(
          'group overflow-hidden rounded-lg aspect-square',
          item.type === 'album' && 'border',
          isSelected && item.type === 'photo' && 'border-2'
        )}
        style={{
          backgroundColor: colors.surface.medium,
          borderColor: item.type === 'album' ? colors.border.default : colors.border.primary.default,
        }}
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
            className="w-full h-full"
          />
        ) : (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: colors.surface.stronger }}
          >
            {isEmptyBox ? (
              <FileText color={colors.text.secondary} size={36} aria-hidden />
            ) : (
              <Folder color={colors.text.default} size={36} aria-hidden />
            )}
          </View>
        )}

        {item.type === 'photo' && (item.sidecarCount ?? 0) > 0 ? (
          <View className="absolute right-2 top-2 rounded-full p-1" style={{ backgroundColor: colors.media.scrim }}>
            <Paperclip color={colors.media.text} size={14} aria-hidden />
          </View>
        ) : null}

        {item.type === 'album' ? (
          <View className="absolute inset-0" style={{ backgroundColor: colors.media.tint }} />
        ) : null}

        {item.type === 'photo' && (isSelected || isSelectionMode || supportsHoverSelection) ? (
          <Pressable
            className={cn(
              'absolute left-2 top-2 z-10 h-8 w-8 items-center justify-center rounded-full border transition-opacity',
              isSelected && 'opacity-100',
              supportsHoverSelection && !isSelected && !isSelectionMode && 'opacity-0 group-hover:opacity-100'
            )}
            style={{
              backgroundColor: isSelected ? colors.primary.default : colors.media.scrim,
              borderColor: isSelected ? colors.border.primary.default : colors.media.textMuted,
            }}
            onPress={(event) => {
              event.stopPropagation();
              onTogglePhotoSelection(item);
            }}
          >
            {isSelected ? (
              <Check color={colors.text.inverted} size={16} aria-hidden />
            ) : (
              <View className="h-3 w-3 rounded-full border" style={{ borderColor: colors.media.text }} />
            )}
          </Pressable>
        ) : null}

        {item.type === 'album' ? (
          <View className="absolute inset-x-0 bottom-0 gap-1 p-3" style={{ backgroundColor: colors.media.scrimStrong }}>
            <View className="flex-row items-center gap-2">
              <Folder color={colors.media.text} size={16} aria-hidden />
              <Text color={theme.colors.media.text} style={{ flex: 1 }}>
                {item.name}
              </Text>
            </View>
            <Text.Caption color={theme.colors.media.textMuted}>
              {[
                item.subalbumCount ? `${item.subalbumCount} ${t('common.nouns.albums')}` : '',
                item.photoCount ? `${item.photoCount} ${t('common.nouns.photos')}` : '',
              ]
                .filter(Boolean)
                .join(' / ') || t('gallery.albumModal.emptyAlbum')}
            </Text.Caption>
          </View>
        ) : null}

        {isSelected && item.type === 'photo' ? (
          <View
            className="absolute bottom-2 right-2 rounded-full px-2 py-1"
            style={{ backgroundColor: colors.primary.default }}
          >
            <Text.Caption color={theme.colors.text.inverted}>{t('gallery.selected')}</Text.Caption>
          </View>
        ) : null}
      </Pressable>
    </View>
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
  const colors = useThemeColors();

  return (
    <View className="gap-6">
      {galleryGroups.map((group) => (
        <View key={group.key}>
          {group.label && (
            <View className="mb-3 flex-row items-center gap-3">
              <Text.H3>{group.label}</Text.H3>
              <View className="h-px flex-1" style={{ backgroundColor: colors.border.default }} />
            </View>
          )}
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
