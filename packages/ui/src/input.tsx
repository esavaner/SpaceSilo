import { TextInput, View } from 'react-native';
import { cn } from './cn';
import { Text } from './text';

import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';

const inputStyles = cva(
  [
    'h-12 text-base text-content outline-none rounded-md border px-3',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      color: {
        primary: 'border-primary hover:border-primary-light active:border-primary-dark',
        danger: 'border-red-600 hover:border-red-500 active:border-red-700',
      },
    },
  }
);

export type InputProps = React.ComponentProps<typeof TextInput> & {
  label?: React.ReactNode;
  error?: React.ReactNode;
};

export const Input = forwardRef<TextInput, InputProps>(({ className, label, error, ...rest }, ref) => (
  <View className="flex flex-col">
    {label && <Text className="mb-1">{label}</Text>}
    <TextInput {...rest} ref={ref} className={cn(inputStyles({ color: error ? 'danger' : 'primary' }), className)} />
    <Text className="text-red-600 text-sm h-5 mt-1">{error}</Text>
  </View>
));

Input.displayName = 'Input';
