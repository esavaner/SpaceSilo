import { forwardRef, useId, useState, type ReactNode } from 'react';
import { Platform, View, type PressableProps, type ViewProps } from 'react-native';
import styled, { css } from 'styled-components/native';
import { Check } from '../assets/icons';
import { theme } from '../config/theme';
import { getFieldA11y, InputInfo } from './input';
import { useNativeInteraction, webSpaceActivation } from './component-utils';

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
  ${({ $isActive, $disabled }) => $isActive && !$disabled && 'box-shadow: 0 0 0 4px #f5f2ef;'}
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
      nativeID,
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
      accessibilityState,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || nativeID || name || `checkbox-${generatedId.replace(/:/g, '')}`;
    const labelId = `${inputId}-label`;
    const [internalChecked, setInternalChecked] = useState(() => !!defaultChecked);
    const { isActive, ...interactionHandlers } = useNativeInteraction({ onFocus, onBlur, onPressIn, onPressOut });
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;
    const { hasInfo, hasError, infoId, errorId, describedBy, accessibilityHint } = getFieldA11y(inputId, {
      info,
      error,
      disabled,
    });

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
          accessibilityHint={accessibilityHint}
          accessibilityState={{ ...accessibilityState, checked: isChecked, disabled }}
          aria-labelledby={labelId}
          aria-checked={isChecked}
          aria-describedby={describedBy}
          aria-invalid={!!error || undefined}
          aria-required={required || undefined}
          {...interactionHandlers}
          {...webSpaceActivation}
          onPress={(event) => {
            if (!isControlled) {
              setInternalChecked(!isChecked);
            }
            onValueChange?.(!isChecked);
            onPress?.(event);
          }}
        >
          <CheckboxVisual $checked={isChecked} $disabled={disabled} $error={!!error} $isActive={isActive}>
            {isChecked && (
              <Check size={16} color={disabled ? theme.colors.text.disabled : theme.colors.text.inverted} aria-hidden />
            )}
          </CheckboxVisual>
          <LabelText nativeID={labelId}>{children || label}</LabelText>
        </Label>
        {hasInfo && (
          <InputInfo id={infoId} style={{ paddingLeft: 0 }}>
            {info}
          </InputInfo>
        )}
        {hasError && (
          <InputInfo id={errorId} error style={{ paddingLeft: 0 }}>
            {error}
          </InputInfo>
        )}
      </Wrapper>
    );
  }
);

Checkbox.displayName = 'Checkbox';
