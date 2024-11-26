import { cn, FolderIcon, Text } from '@repo/ui';
import { View, ScrollView, Pressable } from 'react-native';
import { FileEntity } from '@/api/generated';
import { fileIcons } from './FileList/fileIcons';

type Props = {
  items: FileEntity[];
  handleDirClick: (name: string) => void;
};

export const FileListCompact = ({ items, handleDirClick }: Props) => {
  const getIcon = (item: FileEntity) => {
    if (item.isDirectory) return <FolderIcon />;
    const ext = item?.name?.split('.').pop()?.toLowerCase() ?? '';
    return fileIcons[ext as keyof typeof fileIcons] || <FolderIcon />;
  };

  return (
    <>
      {/* <View className="flex-row px-6 h-10 items-center bg-layer"></View> */}
      <ScrollView className={cn('flex-1 w-full p-2')}>
        {items
          .filter((i) => i.isDirectory)
          .map((item) => {
            return (
              <Pressable
                key={item.name}
                className={cn(
                  'flex-row gap-4 mb-2 rounded-md items-center hover:bg-layer-secondary active:bg-layer-secondary'
                )}
                onPress={() => handleDirClick(item.name)}
              >
                <Text>{getIcon(item)}</Text>
                <Text className="text-lg leading-5">{item.name}</Text>
              </Pressable>
            );
          })}
      </ScrollView>
    </>
  );
};
