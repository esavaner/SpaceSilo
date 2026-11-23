import { forwardRef, useId, useState, type ReactNode } from 'react';
import { Platform, View, type PressableProps, type ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { theme } from '../config/theme';
import { getFieldA11y, InputInfo } from './input';
import { useNativeInteraction, webSpaceActivation } from './component-utils';

type StyledProps = {
  $active: boolean;
  $checked: boolean;
  $disabled?: boolean;
  $error?: boolean;
};

const Wrapper = styled.View`
  flex-direction: column;
`;

const Control = styled.Pressable<{ $disabled?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[300]};

  ${
    Platform.OS === 'web' &&
    css`
      cursor: pointer;

      &[aria-disabled='true'] {
        cursor: not-allowed;
      }
    `
  }
`;

const Track = styled.View<StyledProps>`
  position: relative;
  width: 44px;
  height: 24px;
  justify-content: center;
  border-width: ${theme.borderWeight[25]};
  border-radius: ${theme.radius.full};
  border-color: ${({ $checked, $disabled, $error }) =>
    $disabled
      ? theme.colors.border.disabled
      : $error
        ? theme.colors.border.error.default
        : $checked
          ? theme.colors.border.primary.default
          : theme.colors.border.input.default};
  background-color: ${({ $checked, $disabled }) =>
    $disabled ? theme.colors.disabled : $checked ? theme.colors.primary.default : theme.colors.surface.stronger};
  ${({ $active, $disabled }) =>
    $active && !$disabled
      ? css`
          box-shadow: 0 0 0 4px ${theme.colors.shadow.focus};
        `
      : ''}
`;

const Thumb = styled.View<StyledProps>`
  position: absolute;
  left: ${({ $checked }) => ($checked ? '21px' : '2px')};
  width: 18px;
  height: 18px;
  border-radius: ${theme.radius.full};
  background-color: ${({ $disabled }) => ($disabled ? theme.colors.text.disabled : theme.colors.text.inverted)};

  ${
    Platform.OS === 'web' &&
    css`
      transition: left 0.15s ease;
    `
  }
`;

const LabelText = styled.Text<{ $disabled?: boolean }>`
  ${theme.text.formMessage}
  color: ${({ $disabled }) => ($disabled ? theme.colors.text.disabled : theme.colors.text.default)};
  flex: 1;
`;

type Props = Omit<PressableProps, 'children' | 'disabled' | 'onPress' | 'style'> & {
  checked?: boolean;
  children?: ReactNode;
  defaultChecked?: boolean;
  disabled?: boolean;
  error?: string;
  hideLabel?: boolean;
  id?: string;
  info?: string;
  label?: string;
  onPress?: PressableProps['onPress'];
  onValueChange?: (checked: boolean) => void;
  required?: boolean;
  style?: ViewProps['style'];
};

export const Switch = forwardRef<View, Props>(
  (
    {
      accessibilityLabel,
      accessibilityState,
      checked,
      children,
      defaultChecked,
      disabled,
      error,
      hideLabel,
      id,
      info,
      label,
      nativeID,
      onBlur,
      onFocus,
      onPress,
      onPressIn,
      onPressOut,
      onValueChange,
      required,
      style,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || nativeID || `switch-${generatedId.replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const [internalChecked, setInternalChecked] = useState(!!defaultChecked);
    const { isActive, ...interactionHandlers } = useNativeInteraction({ onFocus, onBlur, onPressIn, onPressOut });
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;
    const { hasInfo, hasError, infoId, errorId, describedBy, accessibilityHint } = getFieldA11y(inputId, {
      info,
      error,
      disabled,
    });

    return (
      <Wrapper style={style}>
        <Control
          {...rest}
          ref={ref}
          nativeID={inputId}
          $disabled={disabled}
          disabled={disabled}
          accessibilityRole="switch"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ ...accessibilityState, checked: isChecked, disabled: !!disabled }}
          aria-checked={isChecked}
          aria-describedby={describedBy}
          aria-invalid={!!error || undefined}
          aria-labelledby={hideLabel ? undefined : labelId}
          aria-required={required || undefined}
          {...interactionHandlers}
          {...webSpaceActivation}
          onPress={(event) => {
            if (!isControlled) setInternalChecked(!isChecked);
            onValueChange?.(!isChecked);
            onPress?.(event);
          }}
        >
          <Track $active={isActive} $checked={isChecked} $disabled={disabled} $error={!!error}>
            <Thumb $active={isActive} $checked={isChecked} $disabled={disabled} />
          </Track>
          {!hideLabel ? <LabelText nativeID={labelId}>{children || label}</LabelText> : null}
        </Control>
        {hasInfo ? (
          <InputInfo id={infoId} style={{ paddingLeft: 0 }}>
            {info}
          </InputInfo>
        ) : null}
        {hasError ? (
          <InputInfo id={errorId} error style={{ paddingLeft: 0 }}>
            {error}
          </InputInfo>
        ) : null}
      </Wrapper>
    );
  }
);

Switch.displayName = 'Switch';
