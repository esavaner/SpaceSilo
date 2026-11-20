import { useId, useState } from 'react';
import { Platform, type NativeScrollEvent, type NativeSyntheticEvent, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import styled, { css } from 'styled-components/native';
import { theme, useThemeColors } from '../config/theme';

const BUFFER = 15;
const RIGHT_PADDING = 12;

type Props = Omit<ViewProps, 'role'> & {
  role?: string;
  fadeHeight?: number;
  maxHeight?: number;
  rightPadding?: string;
  dark?: boolean;
  fill?: boolean;
};

const Wrapper = styled.View<{ $fill: boolean }>`
  position: relative;
  ${({ $fill }) =>
    $fill &&
    css`
      flex: 1 1 auto;
      min-height: 0;
    `}
  ${
    Platform.OS === 'web' &&
    css`
      transition: all 0.5s ease;
    `
  }
`;

type ScrollerProps = {
  $maxHeight?: number;
  $rightPadding: string;
};
const Scroller = styled.ScrollView<ScrollerProps>`
  flex-grow: 0;
  max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : '100%')};
  padding-right: ${({ $rightPadding }) => $rightPadding};
  ${
    Platform.OS === 'web' &&
    css`
      transition: all 0.5s ease;
      scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
      ::-webkit-scrollbar-track {
        background: transparent;
      }
    `
  }
`;

type FadeOverlayProps = {
  $fadeHeight: number;
  $rightPadding: string;
  $bottom?: boolean;
  $visible: boolean;
};
const FadeOverlay = styled.View<FadeOverlayProps>`
  position: absolute;
  left: 0;
  right: ${({ $rightPadding }) => $rightPadding};
  height: ${({ $fadeHeight }) => `${$fadeHeight}px`};
  ${({ $bottom }) => ($bottom ? 'bottom: 0;' : 'top: 0;')}
  ${({ $bottom }) =>
    $bottom
      ? css`
          border-bottom-left-radius: ${theme.radius[300]};
          border-bottom-right-radius: ${theme.radius[300]};
        `
      : css`
          border-top-left-radius: ${theme.radius[300]};
          border-top-right-radius: ${theme.radius[300]};
        `}
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: none;
  ${
    Platform.OS === 'web' &&
    css`
      transition: all 0.5s ease;
    `
  }
`;

export const OverflowFade = ({
  children,
  role,
  style,
  fadeHeight = 64,
  maxHeight,
  rightPadding = `${RIGHT_PADDING}px`,
  dark = false,
  fill = false,
  ...rest
}: Props) => {
  const gradientId = useId().replace(/:/g, '');
  const colors = useThemeColors();
  const [scrollTop, setScrollTop] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const canScroll = contentHeight > containerHeight + BUFFER;
  const atTop = !canScroll || scrollTop <= BUFFER;
  const atBottom = !canScroll || scrollTop + containerHeight >= contentHeight - BUFFER;
  const fadeColor = dark ? colors.surface.darker : colors.surface.weak;
  // React Native Web accepts DOM roles that React Native's types omit.
  const wrapperProps = { ...rest, role } as ViewProps;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollTop(event.nativeEvent.contentOffset.y);
  };

  return (
    <Wrapper style={style} $fill={fill} {...wrapperProps}>
      <Scroller
        $maxHeight={maxHeight}
        $rightPadding={rightPadding}
        onLayout={(event) => setContainerHeight(event.nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Scroller>
      {(['top', 'bottom'] as const).map((edge) => (
        <FadeOverlay
          key={edge}
          $fadeHeight={fadeHeight}
          $rightPadding={rightPadding}
          $bottom={edge === 'bottom'}
          $visible={edge === 'top' ? !atTop : !atBottom}
          pointerEvents="none"
        >
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient
                id={`${gradientId}-${edge}`}
                x1="0%"
                y1={edge === 'top' ? '0%' : '100%'}
                x2="0%"
                y2={edge === 'top' ? '100%' : '0%'}
              >
                <Stop offset="0%" stopColor={fadeColor} />
                <Stop offset="100%" stopColor={fadeColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${gradientId}-${edge})`} />
          </Svg>
        </FadeOverlay>
      ))}
    </Wrapper>
  );
};
