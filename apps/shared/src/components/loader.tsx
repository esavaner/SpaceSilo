import { ActivityIndicator, Modal, Platform, type ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { Orbit } from '../assets/icons';
import { NoiseImage, ShapesAnimationImage } from '../assets/images';
import { theme } from '../config/theme';
import { useWebScrollLock } from './component-utils';

const InlineWrapper = styled.View`
  align-self: flex-start;
  ${
    Platform.OS === 'web' &&
    css`
      display: inline-flex;
    `
  }
`;

const BlockWrapper = styled.View`
  width: 100%;
  min-height: 120px;
  align-items: center;
  justify-content: center;
`;

const FullPageWrapper = styled.View`
  position: absolute;
  overflow: hidden;
  top: 0;
  left: 0;
  z-index: ${theme.zIndex.fullPageLoader};
  min-height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: ${theme.spacing[600]};
  gap: ${theme.spacing[400]};
  background-color: ${theme.colors.surface.brandPrimary};

  ${
    Platform.OS === 'web' &&
    css`
      position: fixed;
      min-height: 100svh;
      background-blend-mode: normal, overlay, normal;
      background: radial-gradient(85.49% 39.87% at 50% 50%, #5eb0a1 0%, #448b7e 100%) #fbf8f3;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('${NoiseImage}');
        background-repeat: repeat;
        opacity: 0.05;
        pointer-events: none;
        z-index: ${theme.zIndex.bg};
      }

      &::after {
        content: '';
        position: absolute;
        inset: -100px;
        background-image: url('${ShapesAnimationImage}');
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        pointer-events: none;
        transform: rotate(-15deg);
        z-index: ${theme.zIndex.bg};
      }
    `
  }
`;

const LogoContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[300]};
  border-radius: ${theme.radius[200]};
  border: 1px solid ${theme.colors.border.default};
  background: ${theme.colors.surface.weak};
`;

type Props = ViewProps & {
  className?: string;
  size?: number;
  color?: string;
  onRequestClose?: () => void;
} & (
    | {
        block?: false;
        fullPage?: false;
      }
    | {
        block: true;
        fullPage?: false;
      }
    | {
        block?: false;
        fullPage: true;
      }
  );

export const Loader = ({ block, fullPage, size, color = theme.colors.text.brand, onRequestClose, ...rest }: Props) => {
  useWebScrollLock(!!fullPage);

  const props = {
    accessibilityRole: 'progressbar' as const,
    accessibilityLiveRegion: 'polite' as const,
    accessibilityLabel: 'Loading',
    ...rest,
  };

  if (fullPage) {
    return (
      // Loading remains blocking unless the caller explicitly allows dismissal.
      <Modal transparent statusBarTranslucent navigationBarTranslucent onRequestClose={onRequestClose ?? (() => {})}>
        <FullPageWrapper {...props}>
          <LogoContainer>
            <Orbit size={24} color={theme.colors.text.brand} />
          </LogoContainer>
        </FullPageWrapper>
      </Modal>
    );
  }

  const indicator = <ActivityIndicator size={size ?? (block ? 28 : 18)} color={color} />;

  return block ? (
    <BlockWrapper {...props}>{indicator}</BlockWrapper>
  ) : (
    <InlineWrapper {...props}>{indicator}</InlineWrapper>
  );
};
