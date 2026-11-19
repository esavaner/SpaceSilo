import { forwardRef, useState } from 'react';
import { Input, InputIconButton, type InputProps } from './input';
import { EyeOff, Eye } from '../assets/icons';
import { TextInput } from 'react-native';
import { useThemeColors } from '../config/theme';

export type PasswordInputProps = Omit<InputProps, 'secureTextEntry' | 'icon' | 'iconComponent'>;

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ disabled, autoComplete = 'current-password', ...inputProps }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const colors = useThemeColors();
    const VisibilityIcon = isVisible ? Eye : EyeOff;
    const iconColor = disabled ? colors.text.disabled : colors.text.secondary;

    return (
      <Input
        ref={ref}
        autoComplete={autoComplete}
        {...inputProps}
        disabled={disabled}
        secureTextEntry={!isVisible}
        iconComponent={
          <InputIconButton
            onPress={() => setIsVisible((prev) => !prev)}
            accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            disabled={disabled}
          >
            <VisibilityIcon color={iconColor} aria-hidden />
          </InputIconButton>
        }
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
