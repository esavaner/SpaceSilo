import React, { forwardRef } from 'react';
import { Pressable, PressableProps, View } from 'react-native';
import { cn } from './cn';
import { cva } from 'class-variance-authority';
import { Text } from './text';

export type ButtonProps = PressableProps & {
  variant?:
    | 'primary'
    | 'primaryOutline'
    | 'secondary'
    | 'secondaryOutline'
    | 'danger'
    | 'dangerOutline'
    | 'text'
    | 'link'
    | 'icon';
};

const buttonStyles = cva(['rounded-md min-w-10 min-h-10 px-2 flex flex-row gap-2 items-center justify-center'], {
  variants: {
    variant: {
      primary: 'border border-primary bg-primary hover:bg-primary-light active:bg-primary-dark',
      primaryOutline: 'border border-primary hover:bg-primary-light active:bg-primary-dark ',
      secondary: 'border border-secondary bg-secondary hover:bg-secondary-light active:bg-secondary-dark',
      secondaryOutline: 'border border-secondary hover:bg-secondary-light active:bg-secondary-dark',
      danger: 'border border-red bg-red hover:bg-red-light active:bg-red-dark',
      dangerOutline: 'border border-red hover:bg-red-light active:bg-red-dark',
      text: 'hover:bg-layer-tertiary active:bg-layer-secondary',
      link: 'hover:bg-layer-tertiary active:bg-layer-secondary hover:underline',
      icon: 'rounded-full h-10 w-10 hover:bg-layer-tertiary active:bg-layer-secondary',
    },
  },
});

const textStyles = cva([], {
  variants: {
    variant: {
      primary: 'text-basedark',
      primaryOutline: 'text-content hover:text-basedark active:text-basedark',
      secondary: 'text-basedark',
      secondaryOutline: 'text-content hover:text-basedark active:text-basedark',
      danger: 'text-basedark',
      dangerOutline: 'text-content hover:text-basedark active:text-basedark',
      text: 'text-content',
      link: 'text-blue',
      icon: 'text-content',
    },
  },
});

export const Button = forwardRef<View, ButtonProps>(({ variant = 'primary', className, children, ...rest }, ref) => {
  return (
    <Pressable {...rest} ref={ref} className={cn(buttonStyles({ variant }), className)}>
      {typeof children === 'string' ? <Text className={cn(textStyles({ variant }))}>{children}</Text> : children}
    </Pressable>
  );
});

Button.displayName = 'Button';
