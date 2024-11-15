import { Pressable, ScrollView, View } from 'react-native';
import { fileIcons } from './fileIcons';
import { Checkbox, cn, Dropdown, Text } from '@repo/ui';
import { fileSize } from '@/utils/common';
import { EllipsisIcon, FolderIcon } from '@/assets/icons';
import { formatInTimeZone } from 'date-fns-tz';
import { getCalendars } from 'expo-localization';
import { FilesEntity } from '@/api/generated';

type FileListProps = {
  items?: FilesEntity[];
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

  const getItemTime = (time: string) => {
    const date = new Date(time);
    const timeZone = getCalendars()[0].timeZone || 'UTC';
    return formatInTimeZone(date, timeZone, 'd MMM yyyy');
  };

  const hasSelectedItems = selectedItems.length > 0;

  return items?.length === 0 ? (
    <Text className="text-center">No files</Text>
  ) : (
    <ScrollView className="w-full">
      {items?.map((item) => {
        const isSelected = selectedItems.find((i) => i.name === item.name);
        return (
          <Pressable
            key={item.name}
            className={cn(
              'flex-row gap-4 px-3 py-1 mb-6 rounded items-center hover:bg-layer-secondary active:bg-layer-secondary focus:bg-layer-secondary',
              isSelected && 'bg-layer-secondary'
            )}
            onPress={() =>
              hasSelectedItems ? handleSelectItem(item) : item.isDirectory ? handleDirClick(item.name) : null
            }
            onLongPress={() => handleSelectItem(item)}
          >
            <Checkbox
              className={cn('md:flex', hasSelectedItems ? 'flex' : 'hidden')}
              checked={isSelected}
              onChange={() => handleSelectItem(item)}
            />
            <Text className="text-3xl">{getIcon(item)}</Text>
            <View>
              <Text className="leading-5">{item.name}</Text>
              <View className="flex-row gap-1">
                {!item.isDirectory && <Text className="text-content-tertiary text-sm">{fileSize(item.size)},</Text>}
                <Text className="text-content-tertiary text-sm">{getItemTime(item.modificationTime)}</Text>
              </View>
            </View>

            <Dropdown trigger={<EllipsisIcon />} className="ml-auto">
              <Text>ABC</Text>
            </Dropdown>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
