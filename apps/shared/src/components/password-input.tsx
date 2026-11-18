import { forwardRef, useState } from 'react';
import { Input, InputIconButton, type InputProps } from './input';
import { EyeOff, Eye } from '../assets/icons';

type PasswordInputProps = Omit<InputProps, 'type' | 'icon'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ disabled, autoComplete = 'current-password', ...inputProps }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <Input
        ref={ref}
        disabled={disabled}
        type={isVisible ? 'text' : 'password'}
        autoComplete={autoComplete}
        iconComponent={
          <InputIconButton
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            disabled={disabled}
          >
            {isVisible ? <Eye /> : <EyeOff />}
          </InputIconButton>
        }
        {...inputProps}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
