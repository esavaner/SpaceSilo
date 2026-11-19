import styled, { css } from 'styled-components/native';
import {
  Platform,
  Pressable,
  TextInput,
  type GestureResponderEvent,
  type TextInputProps,
  type ViewProps,
  type PressableProps,
} from 'react-native';
import { theme } from '../config/theme';
import { Text } from './text';
import { Info } from '../assets/icons';
import { forwardRef, JSX, useId, useRef, useState } from 'react';

export type InputInfoProps = {
  $isError?: boolean;
  $hasIcon?: boolean;
  $hasIconLeft?: boolean;
  $disabled?: boolean;
  $isActive?: boolean;
  $customInputDefaultStyle?: boolean;
};

export const InputWrapper = styled.Pressable.attrs({ accessible: false })`
  display: flex;
`;
export const InputLabel = styled(Text.FormLabel)`
  ${theme.text.formLabel}
  color: ${theme.colors.text.default};
  display: flex;
  gap: ${theme.spacing[50]};
  padding-bottom: ${theme.spacing[100]};
  padding-left: ${theme.spacing[150]};
  width: fit-content;
`;
export const InputContainer = styled.View`
  position: relative;
  border-radius: ${theme.radius[300]};
  background: ${theme.colors.surface.weak};
`;
// Absolute children without top/bottom are centered by justify-content on native and web.
const InputField = styled.View`
  position: relative;
  justify-content: center;
`;
const Icon = styled.View.attrs({ pointerEvents: 'none' })<{ $left?: boolean }>`
  position: absolute;
  z-index: ${theme.zIndex.raised};
  color: ${theme.colors.text.secondary};

  ${({ $left }) =>
    $left
      ? css`
          left: ${theme.spacing[400]};
        `
      : css`
          right: ${theme.spacing[400]};
        `}

  & > svg {
    display: block;
  }
`;
export const commonInputStyles = css<InputInfoProps>`
  ${theme.text.formPlaceholder}
  width: 100%;
  padding: ${theme.spacing[300]} ${theme.spacing[400]};
  padding-right: ${({ $hasIcon }) => ($hasIcon ? `${theme.spacing[1200]}` : `${theme.spacing[400]}`)};
  padding-left: ${({ $hasIconLeft }) => ($hasIconLeft ? `${theme.spacing[1200]}` : `${theme.spacing[400]}`)};
  border-radius: ${theme.radius[300]};
  background-color: ${({ $disabled }) => ($disabled ? theme.colors.disabled : theme.colors.surface.weak)};
  border: 1px solid
    ${({ $isError, $disabled, $isActive }) =>
      $disabled
        ? theme.colors.border.disabled
        : $isActive
          ? theme.colors.border.input.active
          : $isError
            ? theme.colors.text.danger
            : theme.colors.border.input.default};
  color: ${({ $disabled }) => ($disabled ? theme.colors.text.disabled : theme.colors.text.default)};
  cursor: pointer;
`;
export const inputStateStyles = css`
  &:hover:not(:disabled) {
    border: 1px solid ${theme.colors.border.input.hover};
    box-shadow: 0 0 0 4px #f5f2ef;
  }
  &:active:not(:disabled),
  &:focus:not(:disabled) {
    border: 1px solid ${theme.colors.border.input.active};
    outline: none;
  }
  &:disabled {
    background-color: ${theme.colors.disabled};
    border: 1px solid ${theme.colors.border.disabled};
    color: ${theme.colors.text.disabled};
    cursor: not-allowed;
  }
`;
const StyledInput = styled.TextInput<InputInfoProps>`
  ${commonInputStyles}
  ${inputStateStyles}
`;
const CustomInputWrapper = styled.View<InputInfoProps>`
  ${({ $customInputDefaultStyle, $disabled }) =>
    $customInputDefaultStyle
      ? ''
      : css`
          ${commonInputStyles}
          padding-top: ${theme.spacing[100]};
          padding-bottom: 0;
          ${
            !$disabled &&
            css`
              &:hover {
                border: 1px solid ${theme.colors.border.input.hover};
                box-shadow: 0 0 0 4px #f5f2ef;
              }
              &:focus-within {
                border: 1px solid ${theme.colors.border.input.active};
              }
            `
          }
        `}
`;
export const InputInfo = styled(Text.FormMessage)<InputInfoProps>`
  display: flex;
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[150]};
  padding-bottom: 0;
  color: ${({ $isError }) => ($isError ? theme.colors.text.danger : theme.colors.text.secondary)};
  * {
    flex-shrink: 0;
  }
  &:last-child {
    padding-bottom: ${theme.spacing[150]};
  }
`;

/** Uses TextInput props and refs on native and React Native Web. */
export type InputProps = TextInputProps & {
  disabled?: boolean;
  required?: boolean;
  label?: string;
  hideLabel?: boolean;
  info?: string;
  error?: string;
  icon?: JSX.Element;
  iconComponent?: JSX.Element;
  leftIcon?: JSX.Element;
  leftIconComponent?: JSX.Element;
  customInput?: JSX.Element;
  customInputDefaultStyle?: boolean;
  wrapperStyle?: ViewProps['style'];
  wrapperOnPress?: PressableProps['onPress'];
};

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      hideLabel,
      info,
      error,
      icon,
      iconComponent,
      leftIcon,
      leftIconComponent,
      customInput,
      customInputDefaultStyle = false,
      wrapperStyle,
      wrapperOnPress,
      id,
      nativeID,
      label,
      placeholder,
      required,
      disabled,
      editable,
      onPress,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
      accessibilityState,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const inputId = id || nativeID || `input-${generatedId.replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const infoMessageId = `${inputId}-info`;
    const errorMessageId = `${inputId}-error`;
    const hasInfo = !!info && !disabled;
    const hasError = !!error && !disabled;
    const describedBy = [hasInfo ? infoMessageId : undefined, hasError ? errorMessageId : undefined]
      .filter(Boolean)
      .join(' ');
    const isError = !!error;
    const hasIcon = !!icon || !!iconComponent;
    const hasLeftIcon = !!leftIcon || !!leftIconComponent;

    const inputProps = {
      id: inputId,
      ref: (node: TextInput | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          return ref(node);
        }
        if (ref) {
          ref.current = node;
        }
      },
      editable: !disabled && editable !== false,
      ...(Platform.OS === 'web' ? { disabled } : {}),
      accessibilityState: { ...accessibilityState, disabled: disabled || editable === false },
      onPress: (e: GestureResponderEvent) => {
        e.stopPropagation();
        onPress?.(e);
      },
      onFocus: (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      onPressIn: (e: GestureResponderEvent) => {
        setIsPressed(true);
        onPressIn?.(e);
      },
      onPressOut: (e: GestureResponderEvent) => {
        setIsPressed(false);
        onPressOut?.(e);
      },
      placeholder: placeholder || label,
      placeholderTextColor: disabled ? theme.colors.text.disabled : theme.colors.text.secondary,
      accessibilityLabel: label,
      accessibilityHint: [hasInfo && info, hasError && error].filter(Boolean).join(' ') || undefined,
      'aria-labelledby': !hideLabel ? labelId : undefined,
      'aria-label': hideLabel ? label : undefined,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': isError || undefined,
      'aria-required': required || undefined,
      $isError: isError,
      $hasIcon: hasIcon,
      $hasIconLeft: hasLeftIcon,
      $disabled: disabled || editable === false,
      $isActive: Platform.OS !== 'web' && (isFocused || isPressed),
      ...props,
    };

    return (
      <InputWrapper style={wrapperStyle} onPress={wrapperOnPress || onPress} disabled={disabled}>
        {!hideLabel && (
          <InputLabel
            nativeID={labelId}
            onPress={customInput || disabled ? undefined : () => inputRef.current?.focus()}
          >
            {label}
            {required && <Text.FormLabel color={theme.colors.text.danger}>*</Text.FormLabel>}
          </InputLabel>
        )}
        <InputContainer>
          <InputField>
            {leftIconComponent ? leftIconComponent : leftIcon && <Icon $left>{leftIcon}</Icon>}
            {customInput ? (
              <CustomInputWrapper
                id={inputId}
                role="group"
                aria-labelledby={!hideLabel ? labelId : undefined}
                aria-label={hideLabel ? label : undefined}
                aria-describedby={describedBy || undefined}
                aria-invalid={isError || undefined}
                accessibilityState={{ disabled }}
                accessibilityLabel={label}
                accessibilityHint={inputProps.accessibilityHint}
                style={props.style}
                $isError={isError}
                $hasIcon={hasIcon}
                $hasIconLeft={hasLeftIcon}
                $disabled={disabled}
                $customInputDefaultStyle={customInputDefaultStyle}
              >
                {customInput}
              </CustomInputWrapper>
            ) : (
              // React Native Web's TextInput does not dispatch onPress.
              <Pressable accessible={false} disabled={disabled} onPress={inputProps.onPress}>
                <StyledInput {...inputProps} />
              </Pressable>
            )}
            {iconComponent ? iconComponent : icon && <Icon>{icon}</Icon>}
          </InputField>
          {hasInfo && (
            <InputInfo id={infoMessageId} role="status" aria-live="polite">
              <Info color={theme.colors.text.secondary} />
              {info}
            </InputInfo>
          )}
          {hasError && (
            <InputInfo id={errorMessageId} $isError role="alert" aria-live="assertive">
              <Info color={theme.colors.text.danger} />
              {error}
            </InputInfo>
          )}
        </InputContainer>
      </InputWrapper>
    );
  }
);

Input.displayName = 'Input';

export const InputIconButton = styled.Pressable.attrs({
  role: 'button',
  onPressIn: (event: GestureResponderEvent) => event.preventDefault(),
})`
  position: absolute;
  height: fit-content;
  border-radius: ${theme.radius[100]};
  right: ${theme.spacing[400]};
  display: inline-flex;
  color: ${theme.colors.text.secondary};
  padding: 0;
  & > svg {
    display: block;
  }
  &:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.05);
  }
  &:disabled {
    color: ${theme.colors.text.disabled};
    cursor: not-allowed;
  }
  &:focus,
  &:focus-visible {
    outline: 2px solid ${theme.colors.border.input.active};
    border-radius: ${theme.radius[100]};
  }
`;
