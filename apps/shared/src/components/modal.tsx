import { Children, isValidElement, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal as NativeModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { css } from 'styled-components/native';
import { X } from '../assets/icons';
import { ModalContext } from '../context/modal-provider';
import { theme } from '../config/theme';
import { Text } from './text';

type StyledProps = {
  $drawer: boolean;
};

const Wrapper = styled(KeyboardAvoidingView)`
  flex: 1;
`;

// Blur must share the opacity layer; an opacity ancestor isolates the backdrop until it reaches 1.
const backdropBaseStyle: ViewStyle & Pick<React.CSSProperties, 'backdropFilter'> = {
  backgroundColor: 'rgba(63, 44, 38, 0.4)',
  ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
};

const ModalCard = styled.View<StyledProps>`
  flex-shrink: 1;
  max-height: 100%;
  background-color: ${theme.colors.surface.weak};
  border-radius: ${theme.radius[600]};
  overflow: hidden;

  ${({ $drawer }) =>
    $drawer
      ? css`
          width: 100%;
          border-radius: ${theme.radius[800]} ${theme.radius[800]} 0 0;
        `
      : css`
          width: auto;
        `}
`;

const CloseButton = styled.Pressable`
  position: absolute;
  top: ${theme.spacing[300]};
  right: ${theme.spacing[300]};
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.radius.full};
  z-index: ${theme.zIndex.raised};
  ${
    Platform.OS === 'web' &&
    css`
      cursor: pointer;
    `
  }
`;

export type ModalProps = ViewProps & {
  className?: string;
  closeOverride?: () => void;
  /** With closeOverride: start the exit animation from outside; closeOverride runs when it ends. */
  closing?: boolean;
  /** Pass a translated label, e.g. t('common.actions.close'). */
  closeLabel?: string;
  disableClickOutside?: boolean;
};

let openWebModals = 0;
let previousBodyOverflow = '';

export const Modal = ({
  children,
  style,
  closeOverride,
  closing,
  closeLabel = 'Close modal',
  disableClickOutside,
  accessibilityLabel,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  ...props
}: ModalProps) => {
  const context = useContext(ModalContext);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const onClosedRef = useRef(closeOverride ?? context?.completeClose);
  const [isShown, setIsShown] = useState(false);
  const [cardHeight, setCardHeight] = useState(0);
  const [locallyClosing, setLocallyClosing] = useState(false);
  const isClosing = closeOverride ? locallyClosing || !!closing : !!context?.isClosing;
  const drawer = Platform.OS !== 'web' || width <= theme.breakpointNumbers.sm;
  const maxWidth = drawer ? width : Math.min(840, Math.max(0, width - insets.left - insets.right - 32));
  const childArray = Children.toArray(children);
  const titles = childArray.filter((child) => isValidElement(child) && child.type === ModalTitle);
  const buttons = childArray.filter((child) => isValidElement(child) && child.type === ModalButtons);
  const body = childArray.filter(
    (child) => !isValidElement(child) || (child.type !== ModalTitle && child.type !== ModalButtons)
  );
  const horizontalPadding = {
    paddingLeft: 24 + (drawer ? insets.left : 0),
    paddingRight: 24 + (drawer ? insets.right : 0),
  };
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() =>
    drawer
      ? { transform: [{ translateY: (1 - progress.value) * cardHeight }], opacity: cardHeight === 0 ? 0 : 1 }
      : { opacity: progress.value }
  );
  const onClosed = useCallback(() => onClosedRef.current?.(), []);

  useEffect(() => {
    onClosedRef.current = closeOverride ?? context?.completeClose;
  }, [closeOverride, context?.completeClose]);

  useEffect(() => {
    if (!isShown || cardHeight === 0) return;
    progress.value = withTiming(isClosing ? 0 : 1, { duration: 300, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished && isClosing) scheduleOnRN(onClosed);
    });
    return () => cancelAnimation(progress);
  }, [progress, isClosing, isShown, cardHeight, onClosed]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (openWebModals++ === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (--openWebModals === 0) document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  if (!closeOverride && !context) {
    throw new Error('Modal requires a ModalProvider or closeOverride.');
  }

  const handleClose = () => {
    if (isClosing) return;
    if (closeOverride) setLocallyClosing(true);
    else context?.closeModal();
  };

  const content = (
    <>
      {titles.length > 0 && (
        <View style={{ ...horizontalPadding, paddingTop: 24, paddingBottom: 16, flexShrink: 0 }}>{titles}</View>
      )}
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          ...horizontalPadding,
          paddingTop: titles.length ? 0 : 24,
          paddingBottom: buttons.length ? 16 : 24 + (drawer ? insets.bottom : 0),
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {body}
      </ScrollView>
      {buttons.length > 0 && (
        <View style={{ ...horizontalPadding, paddingBottom: 24 + (drawer ? insets.bottom : 0), flexShrink: 0 }}>
          {buttons}
        </View>
      )}
      <CloseButton
        role="button"
        accessibilityLabel={closeLabel}
        onPress={handleClose}
        disabled={isClosing}
        style={({ pressed }) => ({ opacity: pressed ? 1 : 0.7, right: 12 + (drawer ? insets.right : 0) })}
      >
        <X color={theme.colors.text.default} aria-hidden />
      </CloseButton>
    </>
  );

  return (
    <NativeModal
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onShow={() => setIsShown(true)}
      onRequestClose={handleClose}
      accessibilityLabel={accessibilityLabel || ariaLabel}
      aria-labelledby={labelledBy}
    >
      <Wrapper behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, backdropBaseStyle, backdropStyle]} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={disableClickOutside ? undefined : handleClose}
          accessible={false}
          aria-hidden
          tabIndex={-1}
        />
        <View
          pointerEvents="box-none"
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: drawer ? 'flex-end' : 'center',
            paddingTop: insets.top + 48,
            paddingBottom: drawer ? 0 : insets.bottom + 48,
            paddingLeft: drawer ? 0 : insets.left + 16,
            paddingRight: drawer ? 0 : insets.right + 16,
          }}
        >
          <Animated.View
            style={[
              {
                flexShrink: 1,
                maxHeight: '100%',
                width: drawer ? '100%' : undefined,
                maxWidth,
                minWidth: drawer ? undefined : Math.min(300, maxWidth),
              },
              cardStyle,
            ]}
          >
            <ModalCard
              {...props}
              $drawer={drawer}
              onLayout={(event) => {
                setCardHeight(event.nativeEvent.layout.height);
                props.onLayout?.(event);
              }}
              accessibilityViewIsModal
              onAccessibilityEscape={handleClose}
              style={style}
            >
              {content}
            </ModalCard>
          </Animated.View>
        </View>
      </Wrapper>
    </NativeModal>
  );
};

export const ModalTitle = styled(Text.H2)`
  margin-right: ${theme.spacing[800]};
`;

export const ModalError = styled(Text.M)`
  color: ${theme.colors.text.danger};
  margin: ${theme.spacing[200]} auto ${theme.spacing[400]};
`;

export const ModalButtons = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[400]};
  margin-top: ${theme.spacing[400]};
  justify-content: center;
`;
