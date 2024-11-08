import { TextInput, View } from 'react-native';
import { cn } from './cn';
import { Text } from './text';

import React from 'react';
import { cva } from 'class-variance-authority';

const inputStyles = cva(
  [
    'ring-offset-background placeholder:text-muted-foreground ',
    'text-base outline-none rounded-md border py-2 px-3 text-content hover:border-transparent hover:m-0 placeholder:opacity-60',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'border-secondary  focus-within:border-primary-light',
        error: 'border-red-600  focus-within:border-error-light',
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
    {label && <Text className="text-content">{label}</Text>}
    <TextInput {...rest} className={cn(inputStyles({ variant: error ? 'error' : 'default' }), className)} />
    <Text className="text-red-600 text-sm h-5">{error}</Text>
  </View>
);
