import { Pressable, ScrollView } from 'react-native';
import { FaFolder, FaFile } from 'react-icons/fa';
import { fileIcons } from './fileIcons';
import { SText } from '@repo/ui';

type FileListProps = {
  items: any[];
};

export const FileList = ({ items }: FileListProps) => {
  const getIcon = (item: any) => {
    if (item.type === 'directory') return <FaFolder />;
    const ext = item.name.split('.').pop().toLowerCase();
    return fileIcons[ext as keyof typeof fileIcons] || <FaFile />;
  };

  return (
    <ScrollView>
      {items?.map((item) => (
        <Pressable key={item.name}>
          <SText>
            {getIcon(item)} {item.name}
          </SText>
        </Pressable>
      ))}
    </ScrollView>
  );
};
