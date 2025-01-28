import { Image } from 'expo-image';
import { Text } from './text';
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from './cn';
import { Pressable } from 'react-native';

type Props = {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
};

const avatarStyles = cva('rounded-full items-center justify-center', {
  variants: {
    size: {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-20 h-20',
    },
  },
});

const textStyles = cva('', {
  variants: {
    size: {
      sm: '',
      md: 'text-xl',
      lg: 'text-3xl',
    },
  },
});

export const getInitials = (name?: string) => {
  if (!name) return 'N/A';
  const [first, last] = name.split(' ');
  if (!first || !last) return first ? first[0].toUpperCase() : '';
  return `${first[0]}${last[0]}`.toUpperCase();
};

export const Avatar = ({ src, alt, color, size = 'md', className }: Props) => {
  return (
    <Pressable
      className={cn(avatarStyles({ size }), color ? '' : 'bg-layer-tertiary ', className)}
      {...(color && { style: { backgroundColor: color } })}
    >
      {src ? (
        <Image source={{ uri: src }} alt={alt} />
      ) : (
        <Text className={cn(textStyles({ size }))}>{getInitials(alt)}</Text>
      )}
    </Pressable>
  );
};
