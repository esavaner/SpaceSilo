import { useId, useState } from 'react';
import { Platform, type NativeScrollEvent, type NativeSyntheticEvent, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import styled, { css } from 'styled-components/native';
import { theme } from '../config/theme';

const BUFFER = 15;
const RIGHT_PADDING = 12;

type Props = Omit<ViewProps, 'role'> & {
  className?: string;
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
    `
  }
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  ::-webkit-scrollbar-track {
    background: transparent;
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
  className,
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
  const [scrollTop, setScrollTop] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const atTop = scrollTop <= BUFFER;
  const atBottom = scrollTop + containerHeight >= contentHeight - BUFFER;
  const fadeColor = dark ? theme.colors.surface.darker : 'white';
  // React Native Web consumes these DOM props even though React Native's types omit them.
  const wrapperProps = { ...rest, className, role } as ViewProps;

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
      >
        {children}
      </Scroller>
      <FadeOverlay $fadeHeight={fadeHeight} $rightPadding={rightPadding} $visible={!atTop} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={`${gradientId}-top`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={fadeColor} />
              <Stop offset="100%" stopColor={fadeColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId}-top)`} />
        </Svg>
      </FadeOverlay>
      <FadeOverlay
        $fadeHeight={fadeHeight}
        $rightPadding={rightPadding}
        $bottom
        $visible={!atBottom}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={`${gradientId}-bottom`} x1="0%" y1="100%" x2="0%" y2="0%">
              <Stop offset="0%" stopColor={fadeColor} />
              <Stop offset="100%" stopColor={fadeColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId}-bottom)`} />
        </Svg>
      </FadeOverlay>
    </Wrapper>
  );
};
