import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from './cn';
import { cva } from 'class-variance-authority';

const checkboxStyles = cva(['w-5 h-5 border rounded-md flex items-center justify-center'], {
  variants: {
    variant: {
      default: 'border-secondary',
      checked: 'border-primary bg-primary',
      error: 'border-red-600',
      checkedError: 'border-red-600 bg-red-600',
    },
  },
});

export type CheckboxProps = {
  label?: React.ReactNode;
  error?: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
};

export const Checkbox = ({ className, label, error, checked, onChange }: CheckboxProps) => (
  <View className="flex flex-col gap-1">
    <TouchableOpacity
      className={cn(
        checkboxStyles({ variant: error ? (checked ? 'checkedError' : 'error') : checked ? 'checked' : 'default' }),
        className
      )}
      onPress={() => onChange && onChange(!checked)}
    >
      {checked && <Text className="text-white">✔</Text>}
    </TouchableOpacity>
    {label && <Text className="text-content text-base">{label}</Text>}
    {error && <Text className="text-red-600 text-base">{error}</Text>}
  </View>
);
