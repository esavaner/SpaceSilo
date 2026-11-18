import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../assets/icons';
import styled, { css, keyframes } from 'styled-components';
import { MODAL_ANIMATION_MS, useModal } from '../context/modal-provider';
import { theme } from '../config/theme';
import { Text } from './text';

type Variant = 'default' | 'desktopOnly';

type SyledProps = {
  $isClosing?: boolean;
  $variant?: Variant;
  $mobileFullScreen?: boolean;
};

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;
const slideIn = keyframes`
  from { transform: translateY(max(120%, 1000px)); }
  to { transform: translateY(0); }
`;
const slideOut = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(max(120%, 1000px)); }
`;

const Wrapper = styled.div<SyledProps>`
  position: fixed;
  inset: 0;
  z-index: ${theme.zIndex.modal};
  height: 100svh;
  width: 100dvw;
  overflow-y: auto;
  background: rgba(63, 44, 38, 0.4);
  backdrop-filter: blur(10px);
  animation: ${({ $isClosing }) => ($isClosing ? fadeOut : fadeIn)} ${MODAL_ANIMATION_MS}ms ease forwards;
`;

const ScrollContainer = styled.div<SyledProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  min-width: 100%;
  padding: var(--spacing-1200) var(--spacing-400);

  ${({ $variant }) =>
    $variant !== 'desktopOnly' &&
    css`
      @media (max-width: 575px) {
        justify-content: flex-end;
        padding: var(--spacing-1200) 0 0;
        overflow-y: hidden;
      }
    `}

  ${({ $mobileFullScreen }) =>
    $mobileFullScreen &&
    css`
      @media (max-width: 575px) {
        padding-top: 0;
      }
    `}
`;

const ModalCard = styled.div<SyledProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-400);
  background-color: var(--fill-surface-weak);
  border-radius: var(--border-radius-600);
  padding: var(--spacing-600);
  min-width: 300px;
  width: fit-content;
  max-width: 840px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  animation: ${({ $isClosing }) => ($isClosing ? fadeOut : fadeIn)} ${MODAL_ANIMATION_MS}ms ease forwards;

  ${({ $variant, $isClosing }) =>
    $variant !== 'desktopOnly' &&
    css`
      @media (max-width: 575px) {
        padding-bottom: 100px;
        width: 100%;
        border-radius: var(--border-radius-800) var(--border-radius-800) 0 0;
        animation: ${$isClosing ? slideOut : slideIn} ${MODAL_ANIMATION_MS}ms ease forwards;
      }
    `}

  ${({ $mobileFullScreen }) =>
    $mobileFullScreen &&
    css`
      @media (max-width: 575px) {
        gap: var(--spacing-400);
        flex: 1;
        padding: var(--spacing-400);
        padding-bottom: 100px;
        border-radius: 0;
      }
    `}
`;

const CloseButton = styled.div`
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: ${theme.zIndex.raised};
  opacity: 0.7;
  cursor: pointer;
`;

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> & {
  onSubmit?: React.FormHTMLAttributes<HTMLFormElement>['onSubmit'];
  closeOverride?: () => void;
  disableClickOutside?: boolean;
  variant?: Variant;
  mobileFullScreen?: boolean;
};

export const Modal = ({
  children,
  style,
  className,
  onSubmit,
  closeOverride,
  mobileFullScreen,
  disableClickOutside,
  variant = 'default',
}: Props) => {
  const { isClosing, closeModal } = useModal();
  const cardRef = useRef<HTMLDivElement | HTMLFormElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const handleClose = closeOverride || closeModal;

  // detect if click was on scrollbar
  const isScrollbarClick = (e: MouseEvent) => {
    const el = backgroundRef.current;
    if (!el) return false;
    const verticalScrollbar = el.offsetWidth - el.clientWidth;
    const horizontalScrollbar = el.offsetHeight - el.clientHeight;
    if (verticalScrollbar <= 0 && horizontalScrollbar <= 0) return false;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (verticalScrollbar > 0 && x >= el.clientWidth) return true;
    if (horizontalScrollbar > 0 && y >= el.clientHeight) return true;
    return false;
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetNode = e.target as Node;
    if (!e.currentTarget.contains(targetNode)) {
      return;
    }
    if (cardRef.current?.contains(targetNode)) {
      return;
    }
    if (isScrollbarClick(e.nativeEvent)) {
      return;
    }
    if (!disableClickOutside) {
      handleClose();
    }
  };

  // prevent background scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // close on ESC key press
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose?.();
      }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [handleClose]);

  const modalContent = (
    <Wrapper ref={backgroundRef} $isClosing={isClosing} onMouseDown={handleBackdropMouseDown}>
      <ScrollContainer $variant={variant} $mobileFullScreen={mobileFullScreen}>
        <ModalCard
          // @ts-expect-error TypeScript doesn't know that this can be a form
          ref={cardRef}
          style={style}
          className={className}
          $variant={variant}
          $isClosing={isClosing}
          $mobileFullScreen={mobileFullScreen}
          {...(onSubmit ? { as: 'form', onSubmit } : {})}
        >
          <CloseButton aria-label="Close modal" onClick={() => handleClose?.()}>
            <CloseIcon />
          </CloseButton>
          {children}
        </ModalCard>
      </ScrollContainer>
    </Wrapper>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export const ModalTitle = styled(Text.H2)`
  margin-right: var(--spacing-800);
`;

export const ModalError = styled(Text.M)`
  color: var(--text-status-danger-default);
  margin: var(--spacing-200) auto var(--spacing-400);
`;

export const ModalButtons = styled.div`
  display: flex;
  gap: var(--spacing-400);
  margin-top: var(--spacing-400);
  justify-content: center;
`;
