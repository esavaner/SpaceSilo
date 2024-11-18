import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { cn } from './cn';
import { cva } from 'class-variance-authority';
import { Text } from './text';

export type ButtonProps = PressableProps & {
  variant?: 'primary' | 'primaryOutline' | 'secondary' | 'secondaryOutline' | 'danger' | 'dangerOutline';
};

const buttonStyles = cva(['text-content flex items-center justify-center'], {
  variants: {
    variant: {
      primary: 'border-primary bg-primary text-black hover:bg-transparent hover:text-primary',
      primaryOutline: 'border-secondary hover:border-primary-light focus-within:border-primary-light',
      secondary: 'border-secondary hover:border-primary-light focus-within:border-primary-light',
      secondaryOutline: 'border-secondary hover:border-primary-light focus-within:border-primary-light',
      danger: 'border-red-600 hover:border-red-400 focus-within:border-error-light',
      dangerOutline: 'border-red-600 hover:border-red-400 focus-within:border',
    },
    shape: {
      default: 'rounded-md border-2 p-2 max-w-52',
      none: 'w-fit',
    },
  },
});

export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  return (
    <Pressable {...rest} className={cn(buttonStyles({ variant }), className)}>
      {typeof children === 'string' ? <Text className="text-inherit">{children}</Text> : children}
    </Pressable>
  );
}
