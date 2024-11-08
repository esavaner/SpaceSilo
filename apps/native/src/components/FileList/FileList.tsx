import { Pressable, ScrollView } from 'react-native';
import { fileIcons } from './fileIcons';
import { Checkbox, cn, Text } from '@repo/ui';
import { fileSize } from '@/utils/common';
import { EllipsisIcon, FolderIcon } from '@/assets/icons';

type FileListProps = {
  items: any[];
  selectedItems: any[];
  handleDirClick: (name: string) => void;
  handleSelectItem: (item: any) => void;
};

export const FileList = ({ items, handleDirClick, handleSelectItem, selectedItems }: FileListProps) => {
  const getIcon = (item: any) => {
    if (item.type === 'directory') return <FolderIcon />;
    const ext = item.name.split('.').pop().toLowerCase();
    return fileIcons[ext as keyof typeof fileIcons] || <FolderIcon />;
  };

  const hasSelectedItems = selectedItems.length > 0;

  return (
    <ScrollView className="w-full">
      {items?.length === 0 ? (
        <Text className="text-center">No files</Text>
      ) : (
        items?.map((item) => {
          const isDirectory = item.type === 'directory';
          return (
            <Pressable
              key={item.name}
              className={cn(
                'md:flex flex-row gap-4 py-3 items-center',
                hasSelectedItems ? 'border-b border-layer' : ''
              )}
              onPress={() => isDirectory && handleDirClick(item.name)}
              onLongPress={() => handleSelectItem(item)}
            >
              <Checkbox
                className={cn('md:block', hasSelectedItems ? 'block' : 'hidden')}
                checked={selectedItems.includes(item)}
                onChange={() => handleSelectItem(item)}
              />
              <Text className="text-3xl">{getIcon(item)}</Text>
              <Text>{item.name}</Text>
              <Text className="ml-auto text-end">{!isDirectory && fileSize(item.size)}</Text>
              <Text>
                <EllipsisIcon />
              </Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
};
