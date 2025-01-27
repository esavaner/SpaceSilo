import { useDropdown, useUi, FileIcon, FolderIcon, DropdownItem, Button, Text } from '@repo/ui';

type Props = {
  currentPath: string;
  className?: string;
};

export const FileFilterDropdown = ({ currentPath, className }: Props) => {
  const { openDropdown, ref } = useDropdown();
  const { openModal } = useUi();

  const items = [
    { label: 'All', icon: <FileIcon />, onPress: () => {} },
    { label: 'Folders', icon: <FolderIcon />, onPress: () => {} },
    { label: 'Files', icon: <FileIcon />, onPress: () => {} },
  ];

  const dropdownItems = items.map((item) => (
    <DropdownItem key={item.label} label={item.label} icon={item.icon} onPress={item.onPress} />
  ));

  return (
    <Button ref={ref} onPress={() => openDropdown(dropdownItems)} className={className}>
      <Text className="text-black">Filter</Text>
      {/* <FilterIcon className="text-black" /> */}
    </Button>
  );
};
