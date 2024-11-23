import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { cn } from './cn';
import { cva } from 'class-variance-authority';
import { Text } from './text';

export type ButtonProps = PressableProps & {
  variant?: 'primary' | 'outline' | 'text' | 'link';
  color?: 'primary' | 'secondary' | 'danger';
};

const buttonStyles = cva(['border rounded-md text-black min-w-8 min-h-8 flex items-center justify-center w-24'], {
  variants: {
    color: {
      primary: 'border-primary bg-primary hover:bg-primary-light focus-within:bg-primary-dark focus:bg-primary-dark',
      secondary:
        'border-secondary bg-secondary hover:bg-secondary-light focus-within:bg-secondary-dark focus:bg-secondary-dark',
      danger: 'border-red-400 bg-red-400 hover:bg-red-300 focus-within:bg-red-500 focus:bg-red-500',
    },
    variant: {
      primary: '',
      outline: 'bg-transparent text-content hover:text-black ',
      text: 'border-none bg-transparent text-content hover:bg-layer-secondary focus:bg-layer-secondary',
      link: 'border-none bg-transparent hover:underline text-blue-600 hover:bg-layer-secondary focus:bg-layer-secondary',
    },
  },
});

export function Button({ variant = 'primary', color = 'primary', className, children, ...rest }: ButtonProps) {
  return (
    <Pressable {...rest} className={cn(buttonStyles({ variant, color }), className)}>
      {typeof children === 'string' ? <Text className="text-inherit">{children}</Text> : children}
    </Pressable>
  );
}
