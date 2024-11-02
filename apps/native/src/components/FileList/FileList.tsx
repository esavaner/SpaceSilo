import { Pressable, ScrollView } from 'react-native';
import { fileIcons } from './fileIcons';
import { Checkbox, SText } from '@repo/ui';
import { fileSize } from '@/utils/common';
import FIcon from '@expo/vector-icons/FontAwesome6';
import MIcon from '@expo/vector-icons/MaterialIcons';

type FileListProps = {
  items: any[];
  handleDirClick: (name: string) => void;
};

export const FileList = ({ items, handleDirClick }: FileListProps) => {
  const getIcon = (item: any) => {
    if (item.type === 'directory') return <MIcon name="folder" size={24} />;
    const ext = item.name.split('.').pop().toLowerCase();
    return fileIcons[ext as keyof typeof fileIcons] || <MIcon name="folder" size={24} />;
  };

  console.log('items', items);

  return (
    <ScrollView className="w-full p-2">
      {items?.length === 0 ? (
        <SText className="text-center">No files</SText>
      ) : (
        items?.map((item) => (
          <Pressable
            key={item.name}
            className="grid grid-cols-[35px,40px,1fr,85px,20px] px-2 py-3 mb-2 border-b border-content items-center"
            onPress={() => item.type === 'directory' && handleDirClick(item.name)}
          >
            <SText>
              <Checkbox />
            </SText>
            <SText className="text-3xl">{getIcon(item)}</SText>
            <SText>{item.name}</SText>
            <SText className="pr-5 justify-self-end">{fileSize(item.size)}</SText>
            <SText>
              <FIcon name="ellipsis" size={24} />
            </SText>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
};
