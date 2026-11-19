import { forwardRef, useState } from 'react';
import { Input, InputIconButton, type InputProps } from './input';
import { EyeOff, Eye } from '../assets/icons';
import { TextInput } from 'react-native';
import { theme } from '../config/theme';

type PasswordInputProps = Omit<InputProps, 'secureTextEntry' | 'icon'>;

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ disabled, autoComplete = 'current-password', ...inputProps }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <Input
        ref={ref}
        disabled={disabled}
        secureTextEntry={!isVisible}
        autoComplete={autoComplete}
        iconComponent={
          <InputIconButton
            onPress={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            disabled={disabled}
          >
            {isVisible ? (
              <Eye color={disabled ? theme.colors.text.disabled : theme.colors.text.secondary} />
            ) : (
              <EyeOff color={disabled ? theme.colors.text.disabled : theme.colors.text.secondary} />
            )}
          </InputIconButton>
        }
        {...inputProps}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
