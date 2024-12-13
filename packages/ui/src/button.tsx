import React, { forwardRef } from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import { cn } from './cn';
import { cva } from 'class-variance-authority';
import { Text } from './text';

export type ButtonProps = PressableProps & {
  variant?: 'primary' | 'outline' | 'text' | 'link' | 'icon';
  color?: 'primary' | 'secondary' | 'danger' | 'blue' | 'yellow' | 'red';
};

const buttonStyles = cva(
  ['border rounded-md text-black min-w-10 min-h-10 flex flex-row gap-2 items-center justify-center'],
  {
    variants: {
      color: {
        primary: 'border-primary bg-primary hover:bg-primary-light active:bg-primary-dark',
        secondary: 'border-secondary bg-secondary hover:bg-secondary-light active:bg-secondary-dark',
        danger: 'border-red-400 bg-red-400 hover:bg-red-300 active:bg-red-500',
        blue: 'border-blue bg-blue hover:bg-blue-light active:bg-blue-dark',
        yellow: 'border-yellow bg-yellow hover:bg-yellow-light active:bg-yellow-dark',
        red: 'border-red bg-red hover:bg-red-light active:bg-red-dark',
      },
      variant: {
        primary: 'px-2',
        outline: 'px-2 bg-transparent text-content hover:text-black ',
        text: 'border-none bg-transparent text-content hover:bg-layer-tertiary active:bg-layer',
        link: 'border-none bg-transparent hover:underline text-blue-600 hover:bg-layer-tertiary active:bg-layer',
        icon: 'border-none bg-transparent rounded-full hover:bg-layer-tertiary active:bg-layer',
      },
    },
  }
);

export const Button = forwardRef<View, ButtonProps>(
  ({ variant = 'primary', color = 'primary', className, children, ...rest }, ref) => {
    return (
      <Pressable {...rest} ref={ref} className={cn(buttonStyles({ variant, color }), className)}>
        {typeof children === 'string' ? <Text className="text-inherit">{children}</Text> : children}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
