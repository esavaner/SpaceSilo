import { Children, forwardRef, useId, useState, type AriaAttributes, type ReactNode } from 'react';
import { Platform, View, type PressableProps, type ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { theme, useThemeColors } from '../config/theme';
import { Icon } from '../assets/icons';
import { useNativeInteraction, webSpaceActivation } from './component-utils';

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
  margin: 1px;
  border-radius: ${theme.radius[400]};
  background: ${theme.colors.surface.weak};
  border: ${theme.borderWeight[25]} solid
    ${({ $disabled, $isError }) =>
      $disabled
        ? theme.colors.border.disabled
        : $isError
          ? theme.colors.border.error.default
          : theme.colors.border.input.default};

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

  ${
    Platform.OS === 'web' &&
    css`
      transition:
        background 0.15s ease,
        border 0.15s ease,
        color 0.15s ease;
    `
  }

  ${({ $disabled, $isActive }) =>
    $disabled
      ? css`
          background-color: ${theme.colors.disabled};
          ${
            Platform.OS === 'web' &&
            css`
              box-shadow: none;
              cursor: not-allowed;
            `
          }
        `
      : css`
          ${
            Platform.OS === 'web' &&
            css`
              cursor: pointer;

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
const Checkmark = styled(Icon.CircleCheck)`
  position: absolute;
  top: 8px;
  right: 12px;
`;
const Circle = styled.View<{ $disabled?: boolean }>`
  position: absolute;
  border-radius: ${theme.radius.full};
  border: ${theme.borderWeight[25]} solid
    ${({ $disabled }) => ($disabled ? theme.colors.border.disabled : theme.colors.border.primary.default)};
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
    const colors = useThemeColors();
    const { isActive, ...interactionHandlers } = useNativeInteraction({ onFocus, onBlur, onPressIn, onPressOut });
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
        $isActive={isChecked || isActive}
        className={className}
        style={style}
        {...interactionHandlers}
        onPress={(event) => {
          if (!isChecked) {
            if (!isControlled) setInternalChecked(true);
            onValueChange?.(true);
          }
          onPress?.(event);
        }}
        {...webSpaceActivation}
      >
        {Children.map(children, (child) =>
          typeof child === 'string' || typeof child === 'number' ? (
            <LabelText $disabled={!!disabled}>{child}</LabelText>
          ) : (
            child
          )
        )}
        {isChecked ? (
          <Checkmark size={24} color={disabled ? colors.text.disabled : colors.primary.default} aria-hidden />
        ) : (
          <Circle $disabled={!!disabled} aria-hidden />
        )}
      </Label>
    );
  }
);

Radio.displayName = 'Radio';
