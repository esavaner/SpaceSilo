import React from 'react';
import { Text } from 'react-native';
import { cn } from './cn';

type STextProps = React.ComponentProps<typeof Text>;

export const SText = ({ className, ...props }: STextProps) => (
  <Text className={cn('text-primary-900', className)} {...props} />
);
