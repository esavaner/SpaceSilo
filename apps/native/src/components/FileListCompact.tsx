import { ScrollView, Pressable } from 'react-native';
import { FileEntity } from '@/api/generated';
import { cn } from '../utils/cn';
import { FolderIcon } from './icons';
import { Text } from './general/text';

type Props = {
  items: FileEntity[];
  handleItemClick: (item: FileEntity) => void;
  className?: string;
};

export const FileListCompact = ({ items, handleItemClick, className }: Props) => {
  const filteredItems = items.filter((i) => i.isDirectory);
  return (
    <>
      {/* <View className="flex-row px-6 h-10 items-center bg-background"></View> */}
      <ScrollView className={cn('flex-1 w-full p-2', className)}>
        {filteredItems.length === 0 && <Text>No folders</Text>}
        {filteredItems.map((item) => {
          return (
            <Pressable
              key={item.name}
              className={cn(
                'flex-row gap-4 mb-2 rounded-md items-center hover:bg-layer-secondary active:bg-layer-secondary'
              )}
              onPress={() => handleItemClick(item)}
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
