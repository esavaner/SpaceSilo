import { forwardRef, useId, useState, type ReactNode } from 'react';
import { Platform, View, type PressableProps, type ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { Check, Info } from '../assets/icons';
import { theme } from '../config/theme';
import { InputInfo as InputInfoBase } from './input';

type CheckboxVisualProps = {
  $isActive: boolean;
  $checked: boolean;
  $disabled?: boolean;
  $error?: boolean;
};

const Wrapper = styled.View<{ className?: string }>`
  flex-direction: column;
`;

const CheckboxVisual = styled.View<CheckboxVisualProps>`
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.radius[150]};
  border: 1px solid
    ${({ $disabled, $error, $isActive }) =>
      $disabled
        ? theme.colors.border.disabled
        : $error
          ? theme.colors.border.error.default
          : $isActive
            ? theme.colors.border.input.active
            : theme.colors.border.primary.default};
  background-color: ${({ $disabled, $checked }) =>
    $disabled ? theme.colors.disabled : $checked ? theme.colors.primary.default : theme.colors.tertiary.default};
  box-shadow: ${({ $isActive, $disabled }) => ($isActive && !$disabled ? '0 0 0 4px #f5f2ef' : 'none')};
`;

const Label = styled.Pressable<{ $disabled?: boolean }>`
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing[300]};

  ${({ $disabled }) =>
    Platform.OS === 'web' &&
    css`
      cursor: ${$disabled ? 'not-allowed' : 'pointer'};

      &:hover ${CheckboxVisual} {
        border-color: ${$disabled ? theme.colors.border.disabled : theme.colors.border.primary.hover};
        box-shadow: ${$disabled ? 'none' : '0 0 0 4px #e7f1e9'};
      }

      &:focus-visible ${CheckboxVisual} {
        outline: 2px solid ${theme.colors.text.brand};
        outline-offset: 2px;
      }
    `}
`;

const LabelText = styled.Text`
  ${theme.text.formMessage}
  flex: 1;
`;

const InputInfo = styled(InputInfoBase)`
  padding-left: 0;
`;

type Props = Omit<PressableProps, 'children' | 'disabled' | 'onPress' | 'style'> & {
  children?: ReactNode;
  className?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  error?: string;
  id?: string;
  info?: string;
  label?: string;
  name?: string;
  onPress?: PressableProps['onPress'];
  onValueChange?: (checked: boolean) => void;
  required?: boolean;
  checked?: boolean;
  style?: ViewProps['style'];
};

export const Checkbox = forwardRef<View, Props>(
  (
    {
      id,
      name,
      children,
      label,
      checked,
      defaultChecked,
      info,
      error,
      disabled,
      className,
      style,
      onPress,
      onValueChange,
      required,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
      ...rest
    },
    ref
  ) => {
    const inputId = id || name || `checkbox-${useId().replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const infoMessageId = `${inputId}-info`;
    const errorMessageId = `${inputId}-error`;
    const [internalChecked, setInternalChecked] = useState(() => !!defaultChecked);
    const [isFocused, setIsFocused] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;
    const hasInfo = !!info && !disabled;
    const hasError = !!error && !disabled;
    const describedBy = [hasInfo ? infoMessageId : undefined, hasError ? errorMessageId : undefined]
      .filter(Boolean)
      .join(' ');

    return (
      <Wrapper className={className} style={style}>
        <Label
          {...rest}
          ref={ref}
          nativeID={inputId}
          $disabled={disabled}
          disabled={disabled}
          accessibilityRole="checkbox"
          accessibilityLabel={label}
          accessibilityHint={hasError ? error : hasInfo ? info : undefined}
          accessibilityState={{ checked: isChecked, disabled }}
          aria-labelledby={labelId}
          aria-checked={isChecked}
          aria-describedby={describedBy || undefined}
          aria-invalid={!!error || undefined}
          aria-required={required || undefined}
          onFocus={(event) => {
            if (Platform.OS !== 'web') setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            if (Platform.OS !== 'web') setIsFocused(false);
            onBlur?.(event);
          }}
          onPressIn={(event) => {
            if (Platform.OS !== 'web') setIsPressed(true);
            onPressIn?.(event);
          }}
          onPressOut={(event) => {
            if (Platform.OS !== 'web') setIsPressed(false);
            onPressOut?.(event);
          }}
          onPress={(event) => {
            if (!isControlled) {
              setInternalChecked(!isChecked);
            }
            onValueChange?.(!isChecked);
            onPress?.(event);
          }}
        >
          <CheckboxVisual
            $checked={isChecked}
            $disabled={disabled}
            $error={!!error}
            $isActive={Platform.OS !== 'web' && (isFocused || isPressed)}
          >
            {isChecked && (
              <Check size={16} color={disabled ? theme.colors.text.disabled : theme.colors.text.inverted} />
            )}
          </CheckboxVisual>
          <LabelText nativeID={labelId}>{children || label}</LabelText>
        </Label>
        {hasInfo && (
          <InputInfo nativeID={infoMessageId} role="status" aria-live="polite" $isError={false}>
            <Info color={theme.colors.text.secondary} />
            {info}
          </InputInfo>
        )}
        {hasError && (
          <InputInfo nativeID={errorMessageId} role="alert" aria-live="assertive" $isError>
            <Info color={theme.colors.text.danger} />
            {error}
          </InputInfo>
        )}
      </Wrapper>
    );
  }
);

Checkbox.displayName = 'Checkbox';
