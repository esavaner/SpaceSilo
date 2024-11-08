import { Pressable, ScrollView } from 'react-native';
import { fileIcons } from './fileIcons';
import { Checkbox, Text } from '@repo/ui';
import { fileSize } from '@/utils/common';
import { EllipsisIcon, FolderIcon } from '@/assets/icons';

type FileListProps = {
  items: any[];
  handleDirClick: (name: string) => void;
};

export const FileList = ({ items, handleDirClick }: FileListProps) => {
  const getIcon = (item: any) => {
    if (item.type === 'directory') return <FolderIcon />;
    const ext = item.name.split('.').pop().toLowerCase();
    return fileIcons[ext as keyof typeof fileIcons] || <FolderIcon />;
  };

  console.log('items', items);

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
              className="flex flex-row gap-4 py-3 items-center"
              onPress={() => isDirectory && handleDirClick(item.name)}
            >
              <Text>
                <Checkbox />
              </Text>
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
