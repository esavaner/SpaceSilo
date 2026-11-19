import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Platform, View, type PressableProps, type ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { theme } from '../config/theme';
import { Text } from './text';
import { Modal, ModalTitle } from './modal';

export type DropdownItem =
  | {
      label: ReactNode;
      onClick: () => void;
      icon?: ReactNode;
      color?: string;
      disabled?: boolean;
    }
  | undefined;

const Root = styled.View`
  position: relative;
`;

const Menu = styled.View`
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 150px;
  margin-top: ${theme.spacing[200]};
  padding: ${theme.spacing[300]};
  border: 1px solid ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
  background-color: ${theme.colors.surface.weak};
  box-shadow: 0 4px 24px rgba(162, 174, 169, 0.46);
`;

const Trigger = styled.Pressable`
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
`;

// Pressed feedback lives in the native-only style function; react-native-web drops Pressable style functions here.
export const DropdownOption = styled.Pressable<{ $selected?: boolean; $disabled?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[400]};
  min-height: 44px;
  padding: ${theme.spacing[300]} ${theme.spacing[200]};
  border-radius: ${theme.radius[200]};
  background-color: ${({ $selected }) => ($selected ? theme.colors.surface.stronger : 'transparent')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  ${
    Platform.OS === 'web' &&
    css`
      cursor: pointer;
      &:hover:not(:disabled),
      &:focus-visible {
        background-color: ${theme.colors.surface.medium};
        outline: none;
      }
    `
  }
`;

// Web lucide icons use currentColor; native callers still pass `color` explicitly.
const ItemIcon = styled.View<{ $color?: string }>`
  color: ${({ $color }) => $color ?? theme.colors.text.default};
`;

type MenuState = {
  isOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
  close: () => void;
  menuId: string;
};

/** Shared presentation; the viewport is sampled only when opening. */
export const DropdownMenu = ({
  trigger,
  children,
  label,
  closeLabel,
  onClose,
  style,
  matchTriggerWidth,
}: {
  trigger: (state: MenuState) => ReactNode;
  children: (state: MenuState) => ReactNode;
  label?: string;
  closeLabel?: string;
  onClose?: () => void;
  style?: ViewProps['style'];
  matchTriggerWidth?: boolean;
}) => {
  const rootId = `dropdown-${useId().replace(/:/g, '')}`;
  const menuId = `${rootId}-menu`;
  const [presentation, setPresentation] = useState<{ isMobile: boolean; closing?: boolean } | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isOpen = presentation !== null;

  const finishClose = () => {
    setPresentation(null);
    onCloseRef.current?.();
    if (Platform.OS === 'web' && presentation && !presentation.isMobile) {
      document.getElementById(rootId)?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
    }
  };
  // Mobile lets Modal play its exit animation; Modal calls finishClose when done.
  const close = () => {
    if (presentation?.isMobile) setPresentation({ isMobile: true, closing: true });
    else finishClose();
  };
  const toggle = () => {
    if (isOpen) close();
    else {
      setPresentation({
        isMobile: Platform.OS !== 'web' || window.innerWidth <= theme.breakpointNumbers.sm,
      });
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || !presentation || presentation.isMobile) return;
    const root = document.getElementById(rootId);
    const dismiss = () => {
      setPresentation(null);
      onCloseRef.current?.();
    };
    const onOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !root?.contains(event.target)) dismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        root?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
        return;
      }
      if (!root?.contains(document.activeElement)) return;
      const options = Array.from(
        root.querySelectorAll<HTMLElement>(
          '[role="option"]:not([aria-disabled="true"]), [role="menuitem"]:not([aria-disabled="true"])'
        )
      );
      if (!options.length) return;
      const index = options.findIndex((option) => option === document.activeElement);
      let nextIndex: number;
      if (event.key === 'ArrowDown') nextIndex = (index + 1) % options.length;
      else if (event.key === 'ArrowUp') nextIndex = index <= 0 ? options.length - 1 : index - 1;
      else if (index >= 0 && event.key === 'Home') nextIndex = 0;
      else if (index >= 0 && event.key === 'End') nextIndex = options.length - 1;
      else return;
      event.preventDefault();
      options[nextIndex]?.focus();
    };
    document.addEventListener('pointerdown', onOutsidePress, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onOutsidePress, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [presentation, rootId]);

  const state = { isOpen, isMobile: presentation?.isMobile ?? Platform.OS !== 'web', toggle, close, menuId };

  return (
    <Root nativeID={rootId} style={[style, isOpen && !state.isMobile && { zIndex: theme.zIndex.dropdown }]}>
      {trigger(state)}
      {isOpen &&
        (state.isMobile ? (
          <Modal
            closeOverride={finishClose}
            closing={presentation.closing}
            accessibilityLabel={label}
            closeLabel={closeLabel}
          >
            {label && <ModalTitle>{label}</ModalTitle>}
            {children(state)}
          </Modal>
        ) : (
          <Menu style={matchTriggerWidth ? { left: 0 } : undefined}>{children(state)}</Menu>
        ))}
    </Root>
  );
};

export type DropdownTriggerProps = PressableProps & {
  'aria-haspopup': 'menu';
  'aria-controls'?: string;
};

export type DropdownProps = {
  items: DropdownItem[];
  onSelect?: (data: ReactNode) => void;
  trigger?: ReactNode | ((props: DropdownTriggerProps) => ReactNode);
  label?: string;
  closeLabel?: string;
  disabled?: boolean;
  style?: ViewProps['style'];
};

export const Dropdown = ({ items, onSelect, trigger, label, closeLabel, disabled, style }: DropdownProps) => (
  <DropdownMenu
    label={label}
    closeLabel={closeLabel}
    style={[{ alignSelf: 'flex-start' }, style]}
    trigger={({ isOpen, toggle, menuId }) => {
      const triggerProps: DropdownTriggerProps = {
        role: 'button',
        accessibilityLabel: label,
        accessibilityState: { expanded: isOpen, disabled },
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        'aria-controls': isOpen ? menuId : undefined,
        disabled,
        onPress: toggle,
        style: { opacity: disabled ? 0.5 : 1 },
      };
      return typeof trigger === 'function' ? (
        trigger(triggerProps)
      ) : (
        <Trigger {...triggerProps}>{trigger ?? <Text.H3>{'\u22EE'}</Text.H3>}</Trigger>
      );
    }}
  >
    {({ close, menuId }) => (
      <View nativeID={menuId} role="menu" accessibilityLabel={label}>
        {items.map(
          (item, index) =>
            item && (
              <DropdownOption
                key={index}
                role="menuitem"
                disabled={item.disabled}
                $disabled={item.disabled}
                accessibilityState={{ disabled: item.disabled }}
                style={({ pressed }) => (pressed ? { backgroundColor: theme.colors.surface.medium } : null)}
                onPress={() => {
                  close();
                  item.onClick();
                  onSelect?.(item.label);
                }}
              >
                {item.icon && <ItemIcon $color={item.color}>{item.icon}</ItemIcon>}
                <Text.S color={item.color ?? theme.colors.text.default}>{item.label}</Text.S>
              </DropdownOption>
            )
        )}
      </View>
    )}
  </DropdownMenu>
);
