import React, { useEffect } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { cn } from './cn';
import { useDropdown } from './dropdown';
import { ChevronDownIcon } from './icons';
import { Text } from './text';
import { Input } from './input';

type Props = React.ComponentProps<typeof TextInput> & {
  options: React.ReactNode[];
  label?: string;
  className?: string;
};

export const Search = ({ options, label, className, ...rest }: Props) => {
  const { ref, openDropdown } = useDropdown();

  useEffect(() => {
    if (options.length > 0) {
      openDropdown(options, { className });
    }
  }, [options]);

  return (
    <View ref={ref}>
      <Input {...rest} />
    </View>
  );
};
