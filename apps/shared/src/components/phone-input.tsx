import { forwardRef, useState } from 'react';
import { TextInput } from 'react-native';
import { Input, type InputProps } from './input';

const PHONE_DIGIT_COUNT = 10;
const PHONE_INPUT_LENGTH = 12;

const formatValue = (value: InputProps['value']) => {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, PHONE_DIGIT_COUNT);
  if (digits.length > 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
};

export type PhoneInputProps = InputProps & {
  onValueChange?: (value: string) => void;
};

export const PhoneInput = forwardRef<TextInput, PhoneInputProps>(
  ({ value, defaultValue, onChangeText, onValueChange, ...inputProps }, ref) => {
    const [internalValue, setInternalValue] = useState(() => formatValue(defaultValue));

    const isControlled = value !== undefined;
    const displayValue = isControlled ? formatValue(value) : internalValue;

    const handleUpdate = (nextValue = '') => {
      const formattedValue = formatValue(nextValue);
      if (!isControlled) {
        setInternalValue(formattedValue);
      }
      onValueChange?.(formattedValue);
      onChangeText?.(formattedValue);
    };

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={PHONE_INPUT_LENGTH}
        value={displayValue}
        onChangeText={handleUpdate}
        {...inputProps}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
