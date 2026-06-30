import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { cn } from '@/utils/cn';
import { type GalleryImageResponse } from '@repo/shared';
import { Image } from 'expo-image';
import { memo, useEffect, useRef, useState } from 'react';
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
  const imageUri = item.thumbnailPath ? `${item.baseUrl}${item.thumbnailPath}` : null;
  const supportsHoverSelection = useSupportsHoverSelection();
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
    } else {
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
          'group overflow-hidden rounded-lg bg-layer-secondary aspect-square',
          item.type === 'album' && 'border border-border',
          isSelected && item.type === 'photo' && 'border-2 border-primary'
        )}
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
          <View className="absolute inset-0 items-center justify-center bg-accent/40">
            <Icon.Folder className="text-foreground" size={36} />
          </View>
        )}

        {item.type === 'album' ? <View className="absolute inset-0 bg-black/25" /> : null}

        {item.type === 'photo' && (isSelected || isSelectionMode || supportsHoverSelection) ? (
          <Pressable
            className={cn(
              'absolute left-2 top-2 z-10 h-8 w-8 items-center justify-center rounded-full border transition-opacity',
              isSelected ? 'border-primary bg-primary opacity-100' : 'border-white/80 bg-black/40',
              supportsHoverSelection && !isSelected && !isSelectionMode && 'opacity-0 group-hover:opacity-100'
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
    <View className="gap-6">
      {galleryGroups.map((group) => (
        <View key={group.key}>
          {group.label && (
            <View className="mb-3 flex-row items-center gap-3">
              <Text variant="large">{group.label}</Text>
              <View className="h-px flex-1 bg-border" />
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
