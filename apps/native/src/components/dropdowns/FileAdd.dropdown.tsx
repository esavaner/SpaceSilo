import { useDropdown, DropdownItem } from '../dropdown';
import { FolderIcon, FileIcon, AddIcon } from '../icons';
import { FileCreateFolderModal } from '../modals/FileCreateFolder.modal';
import { useUi } from '@/providers/UiProvider';
import { Button } from '../button';
import { Text } from '../text';

type FileAddDropdownProps = {
  currentPath: string;
  className?: string;
};

export const FileAddDropdown = ({ currentPath, className }: FileAddDropdownProps) => {
  const { openModal } = useUi();
  const { ref, openDropdown } = useDropdown();

  const items = [
    {
      label: 'Folder',
      icon: <FolderIcon />,
      onPress: () => openModal(<FileCreateFolderModal currentPath={currentPath} />),
    },
    { label: 'File', icon: <FileIcon />, onPress: () => {} },
  ];

  const dropdownItems = items.map((item) => (
    <DropdownItem key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} />
  ));
  return (
    <Button ref={ref} onPress={() => openDropdown(dropdownItems)} className="ml-auto">
      <Text className="text-black">Add</Text>
      <AddIcon className="text-black" />
    </Button>
  );
};
