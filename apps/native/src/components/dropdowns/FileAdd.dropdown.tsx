import { AddIcon, Dropdown, Button, Text, DropdownItem, FolderIcon, FileIcon } from '@repo/ui';

type FileAddDropdownProps = {
  className?: string;
};

export const FileAddDropdown = ({ className }: FileAddDropdownProps) => {
  const items = [
    { label: 'Folder', icon: <FolderIcon />, onPress: () => {} },
    { label: 'File', icon: <FileIcon />, onPress: () => {} },
  ];
  return (
    <Dropdown
      trigger={(ref, handleOpen) => (
        <Button ref={ref} onPress={handleOpen} className="ml-auto">
          <Text className="text-black">Add</Text>
          <AddIcon className="text-black" />
        </Button>
      )}
    >
      {items.map((item) => (
        <DropdownItem key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} />
      ))}
    </Dropdown>
  );
};
