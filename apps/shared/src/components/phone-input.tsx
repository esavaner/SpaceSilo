import { forwardRef, useEffect, useRef, useState } from 'react';
import { Input, type InputProps } from './input';

const PHONE_DIGIT_COUNT = 10;
const PHONE_INPUT_LENGTH = 12;

const formatValue = (value: InputProps['value']) => {
  let formattedValue = '';
  if (Array.isArray(value) || typeof value === 'object') {
    formattedValue = value.join('');
  } else if (typeof value === 'number') {
    formattedValue = value.toString();
  } else {
    formattedValue = value ?? '';
  }

  const digits = formattedValue.replace(/\D/g, '').slice(0, PHONE_DIGIT_COUNT);
  if (digits.length > 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
};

export type PhoneInputProps = Omit<InputProps, 'onChange'> & {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, defaultValue, onChange, onValueChange, ...inputProps }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [internalValue, setInternalValue] = useState(() => formatValue(defaultValue));

    const isControlled = value !== undefined;
    const displayValue = isControlled ? formatValue(value) : internalValue;

    const handleUpdate = (nextValue = '') => {
      const formattedValue = formatValue(nextValue);
      if (!isControlled) {
        setInternalValue(formattedValue);
      }
      if (inputRef.current && inputRef.current.value !== formattedValue) {
        inputRef.current.value = formattedValue;
      }
      onValueChange?.(formattedValue);
      if (onChange) {
        const eventTarget =
          inputRef.current ??
          ({
            name: inputProps.name ?? '',
            value: formattedValue,
          } as HTMLInputElement);

        onChange({
          target: eventTarget,
          currentTarget: eventTarget,
          type: 'change',
        } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    useEffect(() => {
      if (isControlled) {
        return;
      }

      const currentInput = inputRef.current;
      const nextValue = currentInput?.value;
      if (!nextValue) {
        return;
      }

      const formattedValue = formatValue(nextValue);
      if (formattedValue !== internalValue) {
        setInternalValue(formattedValue);
      }
      if (currentInput && currentInput.value !== formattedValue) {
        currentInput.value = formattedValue;
      }
    }, [internalValue, isControlled]);

    return (
      <Input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={PHONE_INPUT_LENGTH}
        value={isControlled ? displayValue : undefined}
        defaultValue={isControlled ? undefined : formatValue(defaultValue)}
        onChange={(event) => handleUpdate(event.target.value)}
        {...inputProps}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
