import { cn, FolderIcon, Text } from '@repo/ui';
import { ScrollView, Pressable } from 'react-native';
import { FileEntity } from '@/api/generated';

type Props = {
  items: FileEntity[];
  handleDirClick: (name: string) => void;
  className?: string;
};

export const FileListCompact = ({ items, handleDirClick, className }: Props) => {
  const filteredItems = items.filter((i) => i.isDirectory);
  return (
    <>
      {/* <View className="flex-row px-6 h-10 items-center bg-layer"></View> */}
      <ScrollView className={cn('flex-1 w-full p-2', className)}>
        {filteredItems.length === 0 && <Text>No folders</Text>}
        {filteredItems.map((item) => {
          return (
            <Pressable
              key={item.name}
              className={cn(
                'flex-row gap-4 mb-2 rounded-md items-center hover:bg-layer-secondary active:bg-layer-secondary'
              )}
              onPress={() => handleDirClick(item.name)}
            >
              <Text>
                <FolderIcon />
              </Text>
              <Text className="text-lg leading-5">{item.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
};
