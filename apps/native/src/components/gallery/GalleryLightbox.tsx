import { GalleryMediaInfo } from '@/components/gallery/GalleryMediaInfo';
import { Button, Icon, Text, theme, useThemeColors } from '@repo/shared/components';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';

type GalleryLightboxImage = {
  key: string;
  uri: string;
  headers?: Record<string, string>;
  serverId: string;
  mediaId: string;
};

type GalleryLightboxProps = {
  images: GalleryLightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function GalleryLightbox({ images, index, onClose, onIndexChange }: GalleryLightboxProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const controlStyle = { backgroundColor: colors.media.scrim, borderRadius: 999 };
  const [controlsVisible, setControlsVisible] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const hasImage = index !== null && index >= 0 && index < images.length;
  const currentIndex = hasImage ? index : 0;
  const currentImage = hasImage ? images[currentIndex] : null;
  const hasPrevious = hasImage && currentIndex > 0;
  const hasNext = hasImage && currentIndex < images.length - 1;

  useEffect(() => {
    if (!hasImage) {
      setControlsVisible(true);
      setInfoOpen(false);
    }
  }, [hasImage]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !hasImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (infoOpen) {
          setInfoOpen(false);
        } else {
          onClose();
        }
        return;
      }

      if (event.key === 'ArrowLeft' && hasPrevious) {
        event.preventDefault();
        onIndexChange(currentIndex - 1);
        return;
      }

      if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault();
        onIndexChange(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, hasImage, hasNext, hasPrevious, infoOpen, onClose, onIndexChange]);

  const swipeGesture = Gesture.Exclusive(
    Gesture.Fling()
      .runOnJS(true)
      .enabled(Platform.OS !== 'web' && hasPrevious)
      .direction(Directions.RIGHT)
      .onEnd(() => {
        onIndexChange(currentIndex - 1);
      }),
    Gesture.Fling()
      .runOnJS(true)
      .enabled(Platform.OS !== 'web' && hasNext)
      .direction(Directions.LEFT)
      .onEnd(() => {
        onIndexChange(currentIndex + 1);
      })
  );

  if (!currentImage) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.media.background }}>
        <GestureDetector gesture={swipeGesture}>
          <Pressable
            className="absolute inset-0"
            onPress={() => setControlsVisible((visible) => !visible)}
            accessibilityRole="button"
          >
            <Image
              source={{ uri: currentImage.uri, headers: currentImage.headers }}
              cachePolicy="memory-disk"
              contentFit="contain"
              transition={150}
              style={{ width: '100%', height: '100%' }}
            />
          </Pressable>
        </GestureDetector>

        {controlsVisible ? (
          <>
            <View
              pointerEvents="box-none"
              className="absolute left-0 right-0 top-0 z-20 flex-row items-center justify-between px-4 py-4"
            >
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: colors.media.scrim }}>
                <Text.S color={theme.colors.media.text}>
                  {currentIndex + 1} / {images.length}
                </Text.S>
              </View>

              <View className="flex-row gap-2">
                <Button
                  variant="tertiary"
                  size="small"
                  style={controlStyle}
                  onPress={() => setInfoOpen(true)}
                  accessibilityLabel={t('gallery.lightbox.info')}
                >
                  <Icon.Info size={18} color={colors.media.text} aria-hidden />
                </Button>
                <Button
                  variant="tertiary"
                  size="small"
                  style={controlStyle}
                  onPress={onClose}
                  accessibilityLabel={t('gallery.lightbox.close')}
                >
                  <Icon.X size={18} color={colors.media.text} aria-hidden />
                </Button>
              </View>
            </View>

            <View pointerEvents="box-none" className="absolute inset-y-0 left-0 z-10 justify-center px-4">
              <Button
                variant="tertiary"
                size="small"
                style={[controlStyle, !hasPrevious && { opacity: 0.5 }]}
                disabled={!hasPrevious}
                onPress={() => onIndexChange(currentIndex - 1)}
                accessibilityLabel={t('gallery.lightbox.previous')}
              >
                <Icon.ChevronLeft size={24} color={colors.media.text} aria-hidden />
              </Button>
            </View>

            <View pointerEvents="box-none" className="absolute inset-y-0 right-0 z-10 justify-center px-4">
              <Button
                variant="tertiary"
                size="small"
                style={[controlStyle, !hasNext && { opacity: 0.5 }]}
                disabled={!hasNext}
                onPress={() => onIndexChange(currentIndex + 1)}
                accessibilityLabel={t('gallery.lightbox.next')}
              >
                <Icon.ChevronRight size={24} color={colors.media.text} aria-hidden />
              </Button>
            </View>
          </>
        ) : null}

        {infoOpen ? (
          <GalleryMediaInfo
            key={currentImage.key}
            serverId={currentImage.serverId}
            mediaId={currentImage.mediaId}
            onClose={() => setInfoOpen(false)}
          />
        ) : null}
      </View>
    </Modal>
  );
}
