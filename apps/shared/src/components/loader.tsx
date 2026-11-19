import styled, { keyframes } from 'styled-components';
import { Orbit, LoaderCircle } from '../assets/icons';
import { theme } from '../config/theme';
import { useEffect } from 'react';
import { NoiseImage, ShapesAnimationImage } from '../assets/images';

const spin = keyframes`
  from { transform: rotate(0deg) }
  to { transform: rotate(360deg) }
`;
const resize = keyframes`
  0% { transform: scale(1) }
  50% { transform: scale(1.07) }
  100% { transform: scale(1) }
`;

const Spinner = styled(LoaderCircle)<{ $size: number; $color: string }>`
  width: ${({ $size }) => `calc(${$size}rem/16)`};
  height: ${({ $size }) => `calc(${$size}rem/16)`};
  stroke: ${({ $color }) => $color};
  animation: ${spin} 1s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const InlineWrapper = styled.div`
  display: inline-flex;
`;
const BlockWrapper = styled.div`
  width: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const FullPageWrapper = styled.div`
  position: fixed;
  overflow: hidden;
  top: 0;
  left: 0;
  z-index: ${theme.zIndex.fullPageLoader};
  min-height: 100svh;
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: ${theme.spacing[600]};
  gap: ${theme.spacing[400]};
  background-blend-mode: normal, overlay, normal;
  background: ${theme.colors.surface.brandPrimary};
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
`;
const LogoContainer = styled.div`
  display: flex;
  padding: ${theme.spacing[300]};
  border-radius: ${theme.radius[200]};
  border: 1px solid ${theme.colors.border.default};
  background: ${theme.colors.surface.weak};
  margin: auto;
  max-width: min(360px, 80%);
  animation: ${resize} 2s ease-in-out infinite;
  svg,
  img {
    width: 100%;
    height: auto;
  }
`;
const DefaultLogo = styled(Orbit)`
  animation: ${resize} 2s ease-in-out infinite;
  margin: auto;
`;

type Props = React.HTMLAttributes<HTMLDivElement> & {
  size?: number;
  color?: string;
} & (
    | {
        // inline
        block?: false;
        fullPage?: false;
      }
    | {
        // block
        block: true;
        fullPage?: false;
      }
    | {
        // full page
        block?: false;
        fullPage: true;
      }
  );

export const Loader = ({ block, fullPage, size, color = theme.colors.text.brand, ...rest }: Props) => {
  const props = {
    role: 'status',
    'aria-live': 'polite',
    'aria-label': 'Loading',
    ...rest,
  } as const;

  useEffect(() => {
    if (fullPage) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [fullPage]);

  if (fullPage) {
    return (
      <FullPageWrapper {...props}>
        <LogoContainer>
          <DefaultLogo />
        </LogoContainer>
      </FullPageWrapper>
    );
  }

  if (block) {
    return (
      <BlockWrapper {...props}>
        <Spinner $size={size ?? 28} $color={color} />
      </BlockWrapper>
    );
  }

  return (
    <InlineWrapper {...props}>
      <Spinner $size={size ?? 18} $color={color} />
    </InlineWrapper>
  );
};
