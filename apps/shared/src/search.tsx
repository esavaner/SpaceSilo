import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { cn } from './cn';
import { Input } from './input';

type Props = React.ComponentProps<typeof TextInput> & {
  options: React.ReactNode[];
  label?: string;
  className?: string;
};

export const Search = ({ options, label, className, ...rest }: Props) => {
  const ref = useRef<View>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setDropdownOpen(options.length > 0);
  }, [options]);

  return (
    <View ref={ref} className={cn('relative', className)}>
      <Input {...rest} />
      {isDropdownOpen && (
        <ScrollView
          className={cn(`absolute bg-layer-secondary rounded-md shadow-md min-w-24 left-0 right-0 top-12 max-h-80`)}
        >
          {options}
        </ScrollView>
      )}
    </View>
  );
};
