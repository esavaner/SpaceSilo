import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';

type GalleryLightboxImage = {
  key: string;
  uri: string;
  headers?: Record<string, string>;
};

type GalleryLightboxProps = {
  images: GalleryLightboxImage[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function GalleryLightbox({ images, index, onClose, onIndexChange }: GalleryLightboxProps) {
  const { width, height } = useWindowDimensions();
  const hasImage = index !== null && index >= 0 && index < images.length;
  const currentIndex = hasImage ? index : 0;
  const currentImage = hasImage ? images[currentIndex] : null;
  const hasPrevious = hasImage && currentIndex > 0;
  const hasNext = hasImage && currentIndex < images.length - 1;
  const imageWidth = Math.max(width - 112, 160);
  const imageHeight = Math.max(height - 160, 160);

  useEffect(() => {
    if (Platform.OS !== 'web' || !hasImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
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
  }, [currentIndex, hasImage, hasNext, hasPrevious, onClose, onIndexChange]);

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
      <View className="flex-1 bg-black/95">
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityRole="button" />

        <View className="absolute left-0 right-0 top-0 z-20 flex-row items-center justify-between px-4 py-4">
          <Text className="text-sm text-white/80">
            {currentIndex + 1} / {images.length}
          </Text>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 active:bg-white/20"
            onPress={onClose}
            accessibilityLabel="Close image viewer"
          >
            <Icon.Close className="text-white" />
          </Button>
        </View>

        <GestureDetector gesture={swipeGesture}>
          <View className="flex-1 items-center justify-center px-16 py-16">
            <Image
              source={{ uri: currentImage.uri, headers: currentImage.headers }}
              cachePolicy="memory-disk"
              contentFit="contain"
              transition={150}
              style={{ width: imageWidth, height: imageHeight }}
            />
          </View>
        </GestureDetector>

        <View className="absolute inset-y-0 left-0 justify-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 active:bg-white/20"
            disabled={!hasPrevious}
            onPress={() => onIndexChange(currentIndex - 1)}
            accessibilityLabel="Previous image"
          >
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon.NavigateNext className="text-white" size={24} />
            </View>
          </Button>
        </View>

        <View className="absolute inset-y-0 right-0 justify-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 active:bg-white/20"
            disabled={!hasNext}
            onPress={() => onIndexChange(currentIndex + 1)}
            accessibilityLabel="Next image"
          >
            <Icon.NavigateNext className="text-white" size={24} />
          </Button>
        </View>
      </View>
    </Modal>
  );
}
