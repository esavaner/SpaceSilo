import { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../config/theme';

// buffer to determine how near the top/bottom the fade should disappear
const BUFFER = 15;
// padding on the right side to add some distance to the scrollbar
const RIGHT_PADDING = 12;

type FadeProps = {
  $topVisible: boolean;
  $bottomVisible: boolean;
  $fadeHeight: number;
  $rightPadding: string;
  $dark: boolean;
  $fill: boolean;
};

const Wrapper = styled.div<FadeProps>`
  position: relative;
  transition: all 0.5s ease;

  ${({ $fill }) =>
    $fill &&
    css`
      flex: 1 1 auto;
      min-height: 0;
    `}

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
    transition: all 0.5s ease;
    width: 100%;
    left: 0;
    right: ${({ $rightPadding }) => $rightPadding};
  }

  &::before {
    border-radius: ${theme.radius[300]} ${theme.radius[300]} 0 0;
    top: 0;
    ${({ $topVisible, $fadeHeight, $dark }) => css`
      height: ${$fadeHeight}px;
      opacity: ${$topVisible ? 1 : 0};
      background: linear-gradient(to bottom, ${$dark ? theme.colors.surface.darker : 'white'} 0%, transparent 100%);
    `}
  }

  &::after {
    bottom: 0;
    border-radius: 0 0 ${theme.radius[300]} ${theme.radius[300]};
    ${({ $bottomVisible, $fadeHeight, $dark }) => css`
      height: ${$fadeHeight}px;
      opacity: ${$bottomVisible ? 1 : 0};
      background: linear-gradient(to top, ${$dark ? theme.colors.surface.darker : 'white'} 0%, transparent 100%);
    `}
  }
`;

const Content = styled.div<{ $maxHeight?: number; $rightPadding: string }>`
  overflow-y: auto;
  padding-right: ${({ $rightPadding }) => $rightPadding};
  transition: all 0.5s ease;
  height: 100%;
  max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : '100%')};

  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  ::-webkit-scrollbar-track {
    background: transparent;
  }
`;

type Props = React.HTMLAttributes<HTMLDivElement> & {
  fadeHeight?: number;
  maxHeight?: number;
  rightPadding?: string;
  dark?: boolean;
  fill?: boolean;
};

export const OverflowFade = ({
  children,
  className,
  style,
  fadeHeight = 64,
  maxHeight,
  rightPadding = `${RIGHT_PADDING}px`,
  dark = false,
  fill = false,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  const handleScroll = useCallback(() => {
    if (ref.current) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      setAtTop(scrollTop <= BUFFER);
      setAtBottom(scrollTop + clientHeight >= scrollHeight - BUFFER);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    handleScroll();
    el.addEventListener('scroll', handleScroll);
    let resizeObserver: ResizeObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(el);
    }
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(handleScroll);
      mutationObserver.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    }
    return () => {
      el.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [handleScroll]);

  useEffect(() => {
    handleScroll();
  }, [handleScroll, maxHeight]);

  return (
    <Wrapper
      className={className}
      style={style}
      $fadeHeight={fadeHeight}
      $topVisible={!atTop}
      $bottomVisible={!atBottom}
      $rightPadding={rightPadding}
      $dark={dark}
      $fill={fill}
    >
      <Content ref={ref} $maxHeight={maxHeight} $rightPadding={rightPadding}>
        {children}
      </Content>
    </Wrapper>
  );
};
