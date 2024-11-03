import { TextInput, View } from 'react-native';
import { cn } from './cn';
import { Text } from './text';

import React from 'react';
import { cva } from 'class-variance-authority';

const inputStyles = cva(
  ['text-base outline-none rounded-md border m-px p-2 text-content hover:border-[2px] hover:m-0'],
  {
    variants: {
      variant: {
        default: 'border-secondary hover:border-primary-light focus-within:border-primary-light',
        error: 'border-red-600 hover:border-red-400 focus-within:border-error-light',
      },
    },
  }
);

export type InputProps = React.ComponentProps<typeof TextInput> & {
  label?: React.ReactNode;
  error?: React.ReactNode;
};

export const Input = ({ className, label, error, ...rest }: InputProps) => (
  <View className="flex flex-col gap-1 ">
    {label && <Text className="text-base text-content">{label}</Text>}
    <TextInput {...rest} className={cn(inputStyles({ variant: error ? 'error' : 'default' }), className)} />
    {error && <Text className="text-red-600 text-base">{error}</Text>}
  </View>
);
