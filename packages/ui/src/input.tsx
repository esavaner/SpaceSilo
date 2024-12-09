import { TextInput, View } from 'react-native';
import { cn } from './cn';
import { Text } from './text';

import React from 'react';
import { cva } from 'class-variance-authority';

const inputStyles = cva(
  [
    'h-10 text-base outline-none rounded-md border py-2 px-3 text-content placeholder:opacity-60',
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

export const Input = ({ className, label, error, ...rest }: InputProps) => (
  <View className="flex flex-col">
    {label && <Text className="mb-1">{label}</Text>}
    <TextInput {...rest} className={cn(inputStyles({ color: error ? 'danger' : 'primary' }), className)} />
    <Text className="text-red-600 text-sm h-5 mt-1">{error}</Text>
  </View>
);
