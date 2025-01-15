import React, { forwardRef } from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import { cn } from './cn';
import { cva } from 'class-variance-authority';
import { Text } from './text';

export type ButtonProps = PressableProps & {
  variant?: 'primary' | 'outline' | 'text' | 'link' | 'icon';
  color?: 'primary' | 'secondary' | 'danger' | 'blue' | 'yellow' | 'red' | 'none';
};

const buttonStyles = cva(
  ['rounded-md text-black min-w-10 min-h-10 px-2 flex flex-row gap-2 items-center justify-center'],
  {
    variants: {
      color: {
        primary: 'border-primary bg-primary hover:bg-primary-light active:bg-primary-dark',
        secondary: 'border-secondary bg-secondary hover:bg-secondary-light active:bg-secondary-dark',
        danger: 'border-red-400 bg-red-400 hover:bg-red-300 active:bg-red-500',
        blue: 'border-blue bg-blue hover:bg-blue-light active:bg-blue-dark',
        yellow: 'border-yellow bg-yellow hover:bg-yellow-light active:bg-yellow-dark',
        red: 'border-red bg-red hover:bg-red-light active:bg-red-dark',
        none: '',
      },
      variant: {
        primary: 'border',
        outline: 'border bg-transparent text-content hover:text-black ',
        text: 'text-content hover:bg-layer-tertiary active:bg-layer',
        link: 'hover:underline text-blue-600 hover:bg-layer-tertiary active:bg-layer',
        icon: 'rounded-full hover:bg-layer-tertiary active:bg-layer',
      },
    },
  }
);

export const Button = forwardRef<View, ButtonProps>(
  ({ variant = 'primary', color = 'primary', className, children, ...rest }, ref) => {
    return (
      <Pressable
        {...rest}
        ref={ref}
        className={cn(buttonStyles({ variant, color: ['icon', 'text'].includes(variant) ? 'none' : color }), className)}
      >
        {typeof children === 'string' ? <Text className="text-inherit">{children}</Text> : children}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
