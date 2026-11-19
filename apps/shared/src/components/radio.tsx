import { Children, forwardRef, useId, useState, type AriaAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { Platform, View, type PressableProps, type ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { theme } from '../config/theme';
import { CircleCheck } from '../assets/icons';

type Variant = 'horizontal' | 'vertical';

type StyledProps = {
  $disabled?: boolean;
  $isError?: boolean;
  $variant?: Variant;
  $isActive?: boolean;
};

const activeStyles = css`
  background: ${theme.colors.surface.medium};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.input.active};
  box-shadow: 0 0 0 1px ${theme.colors.border.input.active};
`;

const Label = styled.Pressable<StyledProps & { className?: string }>`
  position: relative;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  transition:
    background 0.15s ease,
    border 0.15s ease,
    color 0.15s ease;
  margin: 1px;
  border-radius: ${theme.radius[400]};
  background: ${theme.colors.surface.weak};
  border: ${theme.borderWeight[25]} solid
    ${({ $isError }) => ($isError ? theme.colors.border.error.default : theme.colors.border.input.default)};

  ${({ $variant }) =>
    $variant === 'vertical'
      ? css`
          flex-direction: column;
          padding: ${theme.spacing[400]};
          gap: ${theme.spacing[200]};
        `
      : css`
          flex-direction: row;
          padding: ${theme.spacing[200]} ${theme.spacing[400]};
          gap: ${theme.spacing[400]};
        `}

  ${({ $disabled, $isActive }) =>
    $disabled
      ? css`
          background-color: ${theme.colors.disabled};
          box-shadow: none;
          cursor: not-allowed;
        `
      : css`
          cursor: pointer;

          ${
            Platform.OS === 'web' &&
            css`
              &:hover:not([aria-checked='true']) {
                background: ${theme.colors.surface.default};
                border: ${theme.borderWeight[25]} solid ${theme.colors.border.input.hover};
                box-shadow: 0 0 0 4px #f7f3f0;
              }

              &:active,
              &:focus-visible {
                ${activeStyles}
              }
            `
          }

          ${$isActive && activeStyles}
        `}
`;
const LabelText = styled.Text<{ $disabled?: boolean }>`
  ${theme.text.button}
  color: ${({ $disabled }) => ($disabled ? theme.colors.text.disabled : theme.colors.text.default)};
  flex-shrink: 1;
`;
const Checkmark = styled(CircleCheck)`
  position: absolute;
  top: 8px;
  right: 12px;
`;
const Circle = styled.View`
  position: absolute;
  border-radius: ${theme.radius.full};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.primary.default};
  top: 10px;
  right: 14px;
  width: 20px;
  height: 20px;
`;

export type RadioProps = Omit<PressableProps, 'children' | 'style'> &
  Pick<AriaAttributes, 'aria-describedby' | 'aria-invalid'> & {
    children?: ReactNode;
    className?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    name?: string;
    onValueChange?: (checked: boolean) => void;
    required?: boolean;
    error?: string;
    variant?: Variant;
    style?: ViewProps['style'];
  };

export const Radio = forwardRef<View, RadioProps>(
  (
    {
      id,
      nativeID,
      name,
      children,
      error,
      disabled,
      checked,
      defaultChecked,
      onValueChange,
      onPress,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
      required,
      accessibilityState,
      accessibilityHint,
      className,
      style,
      variant = 'horizontal',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || nativeID || `${name || 'radio'}-${generatedId.replace(/:/g, '')}`;
    const [internalChecked, setInternalChecked] = useState(!!defaultChecked);
    const [isFocused, setIsFocused] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;
    const isError = !!error;

    return (
      <Label
        {...rest}
        ref={ref}
        nativeID={inputId}
        role="radio"
        disabled={disabled}
        accessibilityState={{ ...accessibilityState, checked: isChecked, disabled: !!disabled }}
        accessibilityHint={accessibilityHint || error}
        aria-checked={isChecked}
        aria-invalid={isError || rest['aria-invalid']}
        aria-required={required || undefined}
        $disabled={!!disabled}
        $isError={isError}
        $variant={variant}
        $isActive={isChecked || (Platform.OS !== 'web' && (isFocused || isPressed))}
        className={className}
        style={style}
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
          if (!isChecked) {
            if (!isControlled) setInternalChecked(true);
            onValueChange?.(true);
          }
          onPress?.(event);
        }}
        {...(Platform.OS === 'web'
          ? {
              // React Native Web only handles Space automatically for button roles.
              onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                if (event.target === event.currentTarget && (event.key === ' ' || event.key === 'Spacebar')) {
                  event.preventDefault();
                  if (!disabled && !event.repeat) event.currentTarget.click();
                }
              },
            }
          : {})}
      >
        {Children.map(children, (child) =>
          typeof child === 'string' || typeof child === 'number' ? (
            <LabelText $disabled={!!disabled}>{child}</LabelText>
          ) : (
            child
          )
        )}
        {isChecked ? <Checkmark size={24} color={theme.colors.primary.default} aria-hidden /> : <Circle aria-hidden />}
      </Label>
    );
  }
);

Radio.displayName = 'Radio';
