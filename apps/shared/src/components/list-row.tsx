import { forwardRef, type ReactNode } from 'react';
import { Platform, View, type PressableProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { theme } from '../config/theme';
import { useNativeInteraction } from './component-utils';
import { Text } from './text';

type StyledProps = {
  $active: boolean;
  $bordered: boolean;
  $disabled: boolean;
  $pressable: boolean;
  $selected: boolean;
};

const Container = styled.Pressable<StyledProps>`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[300]};
  padding: ${({ $bordered }) => ($bordered ? theme.spacing[400] : '0px')};
  border-width: ${({ $bordered }) => ($bordered ? theme.borderWeight[25] : '0px')};
  border-color: ${({ $selected }) => ($selected ? theme.colors.border.primary.default : theme.colors.border.default)};
  border-radius: ${theme.radius[300]};
  background-color: ${({ $bordered, $selected }) =>
    !$bordered ? 'transparent' : $selected ? theme.colors.surface.stronger : theme.colors.surface.medium};

  ${({ $disabled, $pressable }) =>
    $pressable &&
    !$disabled &&
    Platform.OS === 'web' &&
    css`
      cursor: pointer;

      &:hover {
        background-color: ${theme.colors.surface.stronger};
      }

      &:focus-visible {
        outline: 2px solid ${theme.colors.border.input.active};
        outline-offset: 2px;
      }
    `}

  ${({ $active, $disabled, $pressable }) =>
    $active &&
    !$disabled &&
    $pressable &&
    css`
      background-color: ${theme.colors.surface.stronger};
    `}
`;

const Leading = styled.View`
  flex-shrink: 0;
`;

const Content = styled.View`
  flex: 1;
  gap: ${theme.spacing[100]};
`;

const Trailing = styled.View`
  flex-shrink: 0;
`;

type Props = Omit<PressableProps, 'children'> & {
  bordered?: boolean;
  description?: ReactNode;
  leading?: ReactNode;
  selected?: boolean;
  title: ReactNode;
  trailing?: ReactNode;
};

export const ListRow = forwardRef<View, Props>(
  (
    {
      accessibilityState,
      bordered = true,
      description,
      disabled,
      leading,
      onBlur,
      onFocus,
      onPress,
      onPressIn,
      onPressOut,
      selected = false,
      title,
      trailing,
      ...rest
    },
    ref
  ) => {
    const { isActive, ...interactionHandlers } = useNativeInteraction({ onFocus, onBlur, onPressIn, onPressOut });

    return (
      <Container
        {...rest}
        ref={ref}
        $active={isActive}
        $bordered={bordered}
        $disabled={!!disabled}
        $pressable={!!onPress}
        $selected={selected}
        disabled={disabled}
        onPress={onPress}
        accessibilityState={{
          ...accessibilityState,
          disabled: !!disabled,
          selected: selected || accessibilityState?.selected,
        }}
        {...interactionHandlers}
      >
        {leading ? <Leading>{leading}</Leading> : null}
        <Content>
          {typeof title === 'string' || typeof title === 'number' ? <Text.M weight={600}>{title}</Text.M> : title}
          {description ? (
            typeof description === 'string' || typeof description === 'number' ? (
              <Text.S color={theme.colors.text.secondary}>{description}</Text.S>
            ) : (
              description
            )
          ) : null}
        </Content>
        {trailing ? <Trailing>{trailing}</Trailing> : null}
      </Container>
    );
  }
);

ListRow.displayName = 'ListRow';
