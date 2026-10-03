import { Button } from '@/components/general/button';
import { GalleryMediaInfo } from '@/components/gallery/GalleryMediaInfo';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
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

const CONTROL_BUTTON_CLASS = 'rounded-full bg-black/50 active:bg-black/70';

export function GalleryLightbox({ images, index, onClose, onIndexChange }: GalleryLightboxProps) {
  const { t } = useTranslation();
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
      <View className="flex-1 bg-black">
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
              <View className="rounded-full bg-black/50 px-3 py-1">
                <Text className="text-sm text-white">
                  {currentIndex + 1} / {images.length}
                </Text>
              </View>

              <View className="flex-row gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={CONTROL_BUTTON_CLASS}
                  onPress={() => setInfoOpen(true)}
                  accessibilityLabel={t('gallery.lightbox.info')}
                >
                  <Icon.Info className="text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={CONTROL_BUTTON_CLASS}
                  onPress={onClose}
                  accessibilityLabel={t('gallery.lightbox.close')}
                >
                  <Icon.Close className="text-white" />
                </Button>
              </View>
            </View>

            <View pointerEvents="box-none" className="absolute inset-y-0 left-0 z-10 justify-center px-4">
              <Button
                variant="ghost"
                size="icon"
                className={CONTROL_BUTTON_CLASS}
                disabled={!hasPrevious}
                onPress={() => onIndexChange(currentIndex - 1)}
                accessibilityLabel={t('gallery.lightbox.previous')}
              >
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                  <Icon.NavigateNext className="text-white" size={24} />
                </View>
              </Button>
            </View>

            <View pointerEvents="box-none" className="absolute inset-y-0 right-0 z-10 justify-center px-4">
              <Button
                variant="ghost"
                size="icon"
                className={CONTROL_BUTTON_CLASS}
                disabled={!hasNext}
                onPress={() => onIndexChange(currentIndex + 1)}
                accessibilityLabel={t('gallery.lightbox.next')}
              >
                <Icon.NavigateNext className="text-white" size={24} />
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
