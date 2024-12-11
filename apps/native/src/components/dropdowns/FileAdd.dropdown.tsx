import { AddIcon, Dropdown, Button, Text, DropdownItem, FolderIcon, FileIcon, useUi } from '@repo/ui';
import { FileCreateFolderModal } from '../modals/FileCreateFolder.modal';

type FileAddDropdownProps = {
  currentPath: string;
  className?: string;
};

export const FileAddDropdown = ({ currentPath, className }: FileAddDropdownProps) => {
  const { openModal } = useUi();
  const items = [
    {
      label: 'Folder',
      icon: <FolderIcon />,
      onPress: () => openModal(<FileCreateFolderModal currentPath={currentPath} />),
    },
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
