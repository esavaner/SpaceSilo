import React from 'react';
import { Dropdown } from './dropdown';
import { Pressable, View } from 'react-native';
import { ChevronDownIcon } from './icons';
import { Text } from './text';
import { useUi } from './UiProvider';
import { cn } from './cn';

type SelectProps = {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

export const Select = ({ options, onChange, value, className }: SelectProps) => {
  const { closeModal } = useUi();

  const handleSelect = (value: string) => {
    onChange(value);
    closeModal();
  };

  const selected = options.find((option) => option.value === value);
  const label = selected?.label || options[0]?.label || '';

  return (
    <Dropdown
      trigger={
        <View className="flex flex-row gap-2 items-center justify-center px-2 py-1 border border-content-secondary rounded-md">
          <Text>{label}</Text>
          <ChevronDownIcon className={cn('text-content', selected && 'rotate-180')} />
        </View>
      }
      className={className}
    >
      {options.map((option) => (
        <Pressable key={option.value} onPress={() => handleSelect(option.value)} className="py-2 px-3">
          <Text>{option.label}</Text>
        </Pressable>
      ))}
    </Dropdown>
  );
};
