import { Pressable, ScrollView, View } from 'react-native';
import { fileIcons } from '../utils/fileIcons';
import { fileSize } from '@/utils/common';
import { formatInTimeZone } from 'date-fns-tz';
import { getCalendars } from 'expo-localization';
import { FileOptionsDropdown } from './dropdowns/FileOptions.dropdown';
import { useTranslation } from 'react-i18next';
import { FileAddDropdown } from './dropdowns/FileAdd.dropdown';
import { useFilesContext } from '@/providers/FilesProvider';
import { FileSortDropdown } from './dropdowns/FileSort.dropdown';
import { FileFilterDropdown } from './dropdowns/FileFilter.dropdown';
import { Checkbox } from './checkbox';
import { cn } from '../utils/cn';
import { Icon } from './general/icon';
import { Text } from './general/text';

type FileListProps = {
  className?: string;
};

export const FileList = ({ className }: FileListProps) => {
  const { t } = useTranslation();
  const {
    comparator,
    currentPath,
    groups,
    items,
    handleClearSelection,
    handleItemClick,
    handleSelectAll,
    handleSelectItem,
    handleSort,
    hasSelectedAll,
    hasSelectedItems,
    selectedItems,
  } = useFilesContext();

  const getIcon = (item: any) => {
    if (item.isDirectory) return <Icon.Folder size={28} className="text-primary" />;
    const ext = item?.name?.split('.').pop()?.toLowerCase() ?? '';
    return fileIcons[ext as keyof typeof fileIcons] || <Icon.File />;
  };

  const getItemTime = (time: string) => {
    const date = new Date(time);
    const timeZone = getCalendars()[0].timeZone || 'UTC';
    return formatInTimeZone(date, timeZone, 'd MMM yyyy');
  };

  return (
    <>
      <View className="flex-row gap-4 px-6 py-2 items-center bg-background border-b border-b-foreground">
        <Checkbox
          checked={hasSelectedAll}
          onChange={() => (hasSelectedAll ? handleClearSelection() : handleSelectAll())}
        />
        <FileSortDropdown handleSort={handleSort} comparator={comparator} />
        <FileFilterDropdown />
        <FileAddDropdown currentPath={currentPath} />
      </View>
      <ScrollView className={cn('flex-1 w-full p-2 pb-20', className)}>
        {items.length === 0 && <Text className="text-center">No files</Text>}
        {items.map((item: any) => {
          const isSelected = selectedItems.find((i) => i.uri === item.uri);
          const color = groups?.find((g: any) => g.id === item.groupId)?.color;
          return (
            <Pressable
              key={item.name + item.groupId}
              className={cn(
                'relative flex-row p-4 md:py-3 mb-2 rounded-md items-center hover:bg-accent active:bg-accent transition-all',
                isSelected && 'bg-muted'
              )}
              onPress={() => handleItemClick(item)}
              onLongPress={() => handleSelectItem(item)}
            >
              <View
                className={cn('transition-all transform overflow-hidden', hasSelectedItems ? 'w-10 mr-2' : 'w-0 mr-0')}
              >
                <Checkbox checked={!!isSelected} onChange={() => handleSelectItem(item)} />
              </View>

              <View className="w-7 items-center justify-center transition-all transform mr-4">{getIcon(item)}</View>
              <View className="gap-1">
                <Text className="text-lg leading-5">{item.name}</Text>
                <View className="flex-row gap-1">
                  {!item.isDirectory && <Text className="text-muted-foreground text-sm">{fileSize(item.size)},</Text>}
                  <Text className="text-muted-foreground text-sm">{getItemTime(item.modificationTime)}</Text>
                </View>
              </View>

              {!hasSelectedItems && <FileOptionsDropdown file={item} />}

              <View
                className={cn('absolute w-1 h-7 left-0 rounded-md')}
                {...(color && { style: { backgroundColor: color } })}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
};
