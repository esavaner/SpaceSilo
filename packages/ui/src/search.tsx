import React from 'react';
import { Pressable } from 'react-native';
import { cn } from './cn';
import { Dropdown } from './dropdown';
import { ChevronDownIcon } from './icons';
import { Text } from './text';

type Props = {
  options: React.ReactNode[];
  label?: string;
  className?: string;
};

export const Search = ({ options, label, className }: Props) => {
  return (
    <Dropdown
      trigger={(ref, handleOpen) => (
        <Pressable
          className="flex flex-row gap-2 items-center justify-center px-2 py-1 border border-content-secondary rounded-md"
          ref={ref}
          onPress={handleOpen}
        >
          <Text>{label}</Text>
          <ChevronDownIcon className={cn('text-content')} />
        </Pressable>
      )}
      className={className}
    >
      {options}
    </Dropdown>
  );
};
