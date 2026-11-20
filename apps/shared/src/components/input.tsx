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
import { theme, useThemeColors } from '../config/theme';
import { Text } from './text';
import { Icon } from '../assets/icons';
import { forwardRef, type JSX, type ReactNode, useId, useRef } from 'react';
import { useNativeInteraction } from './component-utils';

type InputInfoProps = {
  $isError?: boolean;
  $hasIcon?: boolean;
  $hasIconLeft?: boolean;
  $disabled?: boolean;
  $isActive?: boolean;
  $customInputDefaultStyle?: boolean;
};

const InputWrapper = styled.Pressable.attrs({ accessible: false })``;
const InputLabel = styled(Text.FormLabel)`
  padding-bottom: ${theme.spacing[100]};
  padding-left: ${theme.spacing[150]};
  ${
    Platform.OS === 'web' &&
    css`
      display: flex;
      gap: ${theme.spacing[50]};
      width: fit-content;
    `
  }
`;
const InputContainer = styled.View`
  position: relative;
  border-radius: ${theme.radius[300]};
  background: ${theme.colors.surface.weak};
`;
// Absolute children without top/bottom are centered by justify-content on native and web.
const InputField = styled.View`
  position: relative;
  justify-content: center;
`;
const IconSlot = styled.View.attrs({ pointerEvents: 'none' })<{ $left?: boolean }>`
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

  ${
    Platform.OS === 'web' &&
    css`
      & > svg {
        display: block;
      }
    `
  }
`;
const commonInputStyles = css<InputInfoProps>`
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
            ? theme.colors.border.error.default
            : theme.colors.border.input.default};
  color: ${({ $disabled }) => ($disabled ? theme.colors.text.disabled : theme.colors.text.default)};
  cursor: pointer;
`;
const inputStateStyles =
  Platform.OS === 'web'
    ? css`
        &:hover:not(:disabled) {
          border: 1px solid ${theme.colors.border.input.hover};
          box-shadow: 0 0 0 4px ${theme.colors.shadow.focus};
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
      `
    : '';
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
            Platform.OS === 'web' &&
            !$disabled &&
            css`
              &:hover {
                border: 1px solid ${theme.colors.border.input.hover};
                box-shadow: 0 0 0 4px ${theme.colors.shadow.focus};
              }
              &:focus-within {
                border: 1px solid ${theme.colors.border.input.active};
              }
            `
          }
          ${$disabled && 'cursor: not-allowed;'}
        `}
`;
const InputInfoRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing[100]};
  padding: ${theme.spacing[150]};
`;

export const InputInfo = ({
  id,
  error,
  children,
  style,
}: {
  id?: string;
  error?: boolean;
  children: ReactNode;
  style?: ViewProps['style'];
}) => {
  const colors = useThemeColors();
  const color = error ? colors.text.danger : colors.text.secondary;

  return (
    <InputInfoRow
      nativeID={id}
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
      style={style}
    >
      <Icon.Info size={18} color={color} style={{ marginTop: 1 }} aria-hidden />
      <Text.FormMessage color={color} style={{ flex: 1 }}>
        {children}
      </Text.FormMessage>
    </InputInfoRow>
  );
};

export const getFieldA11y = (
  id: string,
  { info, error, disabled }: { info?: string; error?: string; disabled?: boolean }
) => {
  const hasInfo = !!info && !disabled;
  const hasError = !!error && !disabled;
  const infoId = `${id}-info`;
  const errorId = `${id}-error`;

  return {
    hasInfo,
    hasError,
    infoId,
    errorId,
    describedBy: [hasInfo && infoId, hasError && errorId].filter(Boolean).join(' ') || undefined,
    accessibilityHint: [hasInfo && info, hasError && error].filter(Boolean).join(' ') || undefined,
  };
};

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
    const colors = useThemeColors();
    const inputRef = useRef<TextInput>(null);
    const { isActive, ...interactionHandlers } = useNativeInteraction({ onFocus, onBlur, onPressIn, onPressOut });
    const inputId = id || nativeID || `input-${generatedId.replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const isDisabled = !!disabled || editable === false;
    const { hasInfo, hasError, infoId, errorId, describedBy, accessibilityHint } = getFieldA11y(inputId, {
      info,
      error,
      disabled: isDisabled,
    });
    const isError = !!error;
    const hasIcon = !!icon || !!iconComponent;
    const hasLeftIcon = !!leftIcon || !!leftIconComponent;
    const handleInputPress = onPress
      ? (e: GestureResponderEvent) => {
          e.stopPropagation();
          onPress(e);
        }
      : undefined;

    const inputProps = {
      nativeID: inputId,
      ref: (node: TextInput | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          return ref(node);
        }
        if (ref) {
          ref.current = node;
        }
      },
      editable: !isDisabled,
      ...(Platform.OS === 'web' ? { disabled: isDisabled } : {}),
      accessibilityState: { ...accessibilityState, disabled: isDisabled },
      onPress: handleInputPress,
      ...interactionHandlers,
      placeholder: placeholder || label,
      placeholderTextColor: isDisabled ? colors.text.disabled : colors.text.secondary,
      accessibilityLabel: label,
      accessibilityHint,
      'aria-labelledby': !hideLabel ? labelId : undefined,
      'aria-label': hideLabel ? label : undefined,
      'aria-describedby': describedBy,
      'aria-invalid': isError || undefined,
      'aria-required': required || undefined,
      $isError: isError,
      $hasIcon: hasIcon,
      $hasIconLeft: hasLeftIcon,
      $disabled: isDisabled,
      $isActive: isActive,
      ...props,
    };

    return (
      <InputWrapper style={wrapperStyle} onPress={wrapperOnPress || onPress} disabled={isDisabled}>
        {!hideLabel && (
          <InputLabel
            nativeID={labelId}
            onPress={customInput || isDisabled ? undefined : () => inputRef.current?.focus()}
          >
            {label}
            {required && <Text.FormLabel color={theme.colors.text.danger}>*</Text.FormLabel>}
          </InputLabel>
        )}
        <InputContainer>
          <InputField>
            {leftIconComponent ? leftIconComponent : leftIcon && <IconSlot $left>{leftIcon}</IconSlot>}
            {customInput ? (
              <CustomInputWrapper
                nativeID={inputId}
                role="group"
                aria-labelledby={!hideLabel ? labelId : undefined}
                aria-label={hideLabel ? label : undefined}
                aria-describedby={describedBy}
                aria-invalid={isError || undefined}
                accessibilityState={{ disabled: isDisabled }}
                accessibilityLabel={label}
                accessibilityHint={accessibilityHint}
                style={props.style}
                $isError={isError}
                $hasIcon={hasIcon}
                $hasIconLeft={hasLeftIcon}
                $disabled={isDisabled}
                $customInputDefaultStyle={customInputDefaultStyle}
              >
                {customInput}
              </CustomInputWrapper>
            ) : (
              // React Native Web's TextInput does not dispatch onPress.
              <Pressable accessible={false} disabled={isDisabled} onPress={handleInputPress}>
                <StyledInput {...inputProps} />
              </Pressable>
            )}
            {iconComponent ? iconComponent : icon && <IconSlot>{icon}</IconSlot>}
          </InputField>
          {hasInfo && <InputInfo id={infoId}>{info}</InputInfo>}
          {hasError && (
            <InputInfo id={errorId} error>
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
  z-index: ${theme.zIndex.raised};
  border-radius: ${theme.radius[100]};
  right: ${theme.spacing[400]};
  color: ${theme.colors.text.secondary};
  padding: 0;
  ${
    Platform.OS === 'web' &&
    css`
      cursor: pointer;
      & > svg {
        display: block;
      }
      &:hover:not([aria-disabled='true']) {
        background-color: rgba(0, 0, 0, 0.05);
      }
      &[aria-disabled='true'] {
        color: ${theme.colors.text.disabled};
        cursor: not-allowed;
      }
      &:focus,
      &:focus-visible {
        outline: 2px solid ${theme.colors.border.input.active};
        border-radius: ${theme.radius[100]};
      }
    `
  }
`;
