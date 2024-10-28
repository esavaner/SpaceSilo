import React from 'react';
import { Text } from 'react-native';
import { cn } from './cn';

type STextProps = React.ComponentProps<typeof Text>;

export const SText = ({ className, ...props }: STextProps) => (
  <Text className={cn('text-base-800', className)} {...props} />
);
