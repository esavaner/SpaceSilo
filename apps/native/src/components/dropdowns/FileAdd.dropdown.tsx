import { AddIcon, Dropdown, Button, Text } from '@repo/ui';
import { Pressable } from 'react-native';

type FileAddDropdownProps = {
  className?: string;
};

export const FileAddDropdown = ({ className }: FileAddDropdownProps) => {
  const items = [
    { label: 'Folder', value: 'folder' },
    { label: 'File', value: 'file' },
  ];
  return (
    <Dropdown
      className="ml-auto p-0"
      trigger={
        <Button>
          <Text className="text-black">Add</Text>
          <AddIcon className="text-black" />
        </Button>
      }
    >
      {items.map((item) => (
        <Pressable key={item.value} className="flex-row gap-5 py-3 px-4 hover:bg-layer active:bg-layer">
          <Text>{item.label}</Text>
        </Pressable>
      ))}
    </Dropdown>
  );
};
