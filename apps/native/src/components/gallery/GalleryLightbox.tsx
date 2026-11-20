import { GalleryMediaInfo } from '@/components/gallery/GalleryMediaInfo';
import { Button, Icon, Text, theme, useThemeColors } from '@repo/shared/components';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import styled from 'styled-components/native';

const Background = styled.View`
  flex: 1;
  background-color: ${theme.baseColors.base.black};
`;

const ImageTarget = styled.Pressable`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const TopControls = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing[400]};
`;

const ImageCount = styled.View`
  border-radius: ${theme.radius.full};
  padding: ${theme.spacing[100]} ${theme.spacing[300]};
  background-color: ${theme.colors.surface.darker};
`;

const ControlButtons = styled.View`
  flex-direction: row;
  gap: ${theme.spacing[200]};
`;

const SideControl = styled.View<{ $right?: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  ${({ $right }) => ($right ? 'right: 0;' : 'left: 0;')}
  z-index: ${theme.zIndex.raised};
  justify-content: center;
  padding: 0 ${theme.spacing[400]};
`;

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
  const controlStyle = { backgroundColor: colors.surface.darker, borderRadius: 999 };
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
      <Background>
        <GestureDetector gesture={swipeGesture}>
          <ImageTarget onPress={() => setControlsVisible((visible) => !visible)} accessibilityRole="button">
            <Image
              source={{ uri: currentImage.uri, headers: currentImage.headers }}
              cachePolicy="memory-disk"
              contentFit="contain"
              transition={150}
              style={{ width: '100%', height: '100%' }}
            />
          </ImageTarget>
        </GestureDetector>

        {controlsVisible ? (
          <>
            <TopControls pointerEvents="box-none">
              <ImageCount>
                <Text.S color={theme.colors.text.inverted}>
                  {currentIndex + 1} / {images.length}
                </Text.S>
              </ImageCount>

              <ControlButtons>
                <Button
                  variant="tertiary"
                  size="small"
                  style={controlStyle}
                  onPress={() => setInfoOpen(true)}
                  accessibilityLabel={t('gallery.lightbox.info')}
                >
                  <Icon.Info size={18} color={colors.text.inverted} aria-hidden />
                </Button>
                <Button
                  variant="tertiary"
                  size="small"
                  style={controlStyle}
                  onPress={onClose}
                  accessibilityLabel={t('gallery.lightbox.close')}
                >
                  <Icon.X size={18} color={colors.text.inverted} aria-hidden />
                </Button>
              </ControlButtons>
            </TopControls>

            <SideControl pointerEvents="box-none">
              <Button
                variant="tertiary"
                size="small"
                style={[controlStyle, !hasPrevious && { opacity: 0.5 }]}
                disabled={!hasPrevious}
                onPress={() => onIndexChange(currentIndex - 1)}
                accessibilityLabel={t('gallery.lightbox.previous')}
              >
                <Icon.ChevronLeft size={24} color={colors.text.inverted} aria-hidden />
              </Button>
            </SideControl>

            <SideControl $right pointerEvents="box-none">
              <Button
                variant="tertiary"
                size="small"
                style={[controlStyle, !hasNext && { opacity: 0.5 }]}
                disabled={!hasNext}
                onPress={() => onIndexChange(currentIndex + 1)}
                accessibilityLabel={t('gallery.lightbox.next')}
              >
                <Icon.ChevronRight size={24} color={colors.text.inverted} aria-hidden />
              </Button>
            </SideControl>
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
      </Background>
    </Modal>
  );
}
