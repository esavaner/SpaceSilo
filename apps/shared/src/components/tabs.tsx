import { Platform, type PressableProps, type ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { theme } from '../config/theme';
import { useNativeInteraction } from './component-utils';
import { Text } from './text';

type StyledProps = {
  $active: boolean;
  $disabled: boolean;
  $selected: boolean;
};

const Container = styled.View`
  flex-direction: row;
  width: 100%;
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[100]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
  background-color: ${theme.colors.surface.medium};
`;

const TabButton = styled.Pressable<StyledProps>`
  flex: 1;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[200]} ${theme.spacing[300]};
  border-radius: ${theme.radius[200]};
  background-color: ${({ $disabled, $selected }) =>
    $disabled ? 'transparent' : $selected ? theme.colors.surface.weak : 'transparent'};

  ${
    Platform.OS === 'web' &&
    css`
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        box-shadow 0.15s ease;

      &[aria-disabled='true'] {
        cursor: not-allowed;
      }

      &:hover:not([aria-disabled='true']) {
        background-color: ${theme.colors.surface.stronger};
      }

      &:focus-visible {
        outline: 2px solid ${theme.colors.border.input.active};
        outline-offset: 1px;
      }
    `
  }

  ${({ $active, $disabled, $selected }) =>
    $active && !$disabled
      ? css`
          background-color: ${$selected ? theme.colors.surface.stronger : theme.colors.surface.darker};
        `
      : ''}
`;

export type TabItem = {
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  value: string;
};

type TabProps = Pick<PressableProps, 'onBlur' | 'onFocus' | 'onPressIn' | 'onPressOut'> & {
  item: TabItem;
  onValueChange: (value: string) => void;
  selected: boolean;
};

const Tab = ({ item, onBlur, onFocus, onPressIn, onPressOut, onValueChange, selected }: TabProps) => {
  const { isActive, ...interactionHandlers } = useNativeInteraction({ onBlur, onFocus, onPressIn, onPressOut });

  return (
    <TabButton
      $active={isActive}
      $disabled={!!item.disabled}
      $selected={selected}
      accessibilityLabel={item.accessibilityLabel ?? item.label}
      accessibilityRole="tab"
      accessibilityState={{ disabled: !!item.disabled, selected }}
      aria-disabled={item.disabled || undefined}
      aria-selected={selected}
      disabled={item.disabled}
      onPress={() => onValueChange(item.value)}
      role="tab"
      {...interactionHandlers}
    >
      <Text.M
        weight={selected ? 700 : 500}
        color={
          item.disabled
            ? theme.colors.text.disabled
            : selected
              ? theme.colors.text.default
              : theme.colors.text.secondary
        }
        center
      >
        {item.label}
      </Text.M>
    </TabButton>
  );
};

type Props = Omit<ViewProps, 'children'> & {
  items: readonly TabItem[];
  onValueChange: (value: string) => void;
  value: string;
};

export const Tabs = ({ items, onValueChange, value, ...rest }: Props) => (
  <Container {...rest} role="tablist">
    {items.map((item) => (
      <Tab key={item.value} item={item} onValueChange={onValueChange} selected={item.value === value} />
    ))}
  </Container>
);
