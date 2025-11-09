import React from 'react';
import { Text as RText } from 'react-native';
import { cn } from '../utils/cn';

type STextProps = React.ComponentProps<typeof RText>;

export const Text = ({ className, ...props }: STextProps) => (
  <RText className={cn('text-base text-content font-[InterVariable]', className)} {...props} />
);
