import React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '../utils/cn';
import { cva } from 'class-variance-authority';
import { Text } from './text';
import { CheckIcon } from './icons';

const checkboxStyles = cva(['w-5 h-5 border rounded-md flex items-center justify-center overflow-hidden'], {
  variants: {
    variant: {
      default: 'border-content',
      checked: 'border-content bg-white',
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
  <Pressable className="p-2.5" onPress={() => onChange && onChange(!checked)}>
    <View
      className={cn(
        checkboxStyles({ variant: error ? (checked ? 'checkedError' : 'error') : checked ? 'checked' : 'default' }),
        className
      )}
    >
      {checked && <CheckIcon className="text-black" size={16} />}
      {label && <Text className="text-content text-base">{label}</Text>}
      {error && <Text className="text-red-600 text-base">{error}</Text>}
    </View>
  </Pressable>
);
