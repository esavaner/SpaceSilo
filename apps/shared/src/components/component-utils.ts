import type { KeyboardEvent } from 'react';
import { Platform, type PressableProps, type ViewStyle } from 'react-native';
import { useEffect, useState } from 'react';

// Animate opacity on this same layer; an opacity ancestor isolates the blur.
export const modalBackdropStyle: ViewStyle & { backdropFilter?: string } = {
  backgroundColor: 'rgba(63, 44, 38, 0.4)',
  ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
};

// React Native Web handles Space for buttons, but not checkbox/radio/combobox/option roles.
export const webSpaceActivation =
  Platform.OS === 'web'
    ? {
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.target === event.currentTarget && (event.key === ' ' || event.key === 'Spacebar')) {
            event.preventDefault();
            if (!event.repeat && event.currentTarget.getAttribute('aria-disabled') !== 'true') {
              event.currentTarget.click();
            }
          }
        },
      }
    : {};

let locks = 0;
let previousOverflow = '';

export const useWebScrollLock = (enabled = true) => {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (--locks === 0) document.body.style.overflow = previousOverflow;
    };
  }, [enabled]);
};

type Handlers = Pick<PressableProps, 'onFocus' | 'onBlur' | 'onPressIn' | 'onPressOut'>;

export const useNativeInteraction = <T extends Handlers>(callbacks: T) => {
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  if (Platform.OS === 'web') {
    return { isActive: false, ...callbacks };
  }

  const handlers = {
    onFocus: (event) => {
      setFocused(true);
      callbacks.onFocus?.(event);
    },
    onBlur: (event) => {
      setFocused(false);
      callbacks.onBlur?.(event);
    },
    onPressIn: (event) => {
      setPressed(true);
      callbacks.onPressIn?.(event);
    },
    onPressOut: (event) => {
      setPressed(false);
      callbacks.onPressOut?.(event);
    },
  } satisfies Handlers;

  return { isActive: focused || pressed, ...handlers };
};
