import { Pressable, ScrollView, View } from 'react-native';
import { fileIcons } from './FileList/fileIcons';
import { Button, Checkbox, ChevronDownIcon, cn, FolderIcon, Text } from '@repo/ui';
import { fileSize } from '@/utils/common';
import { formatInTimeZone } from 'date-fns-tz';
import { getCalendars } from 'expo-localization';
import { FileEntity } from '@/api/generated';
import { FileOptionsDropdown } from './dropdowns/FileOptions.dropdown';
import { Comparator, SortBy } from '@/hooks/useFiles';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

type FileListProps = {
  items: FileEntity[];
  selectedItems: FileEntity[];
  handleDirClick: (name: string) => void;
  handleSelectItem: (item: FileEntity) => void;
  handleClearSelection: () => void;
  handleSelectAll: () => void;
  handleSort: (sort: SortBy) => void;
  comparator: Comparator;
  className?: string;
};

export const FileList = ({
  items,
  handleDirClick,
  handleSelectItem,
  handleClearSelection,
  handleSelectAll,
  handleSort,
  comparator,
  selectedItems,
  className,
}: FileListProps) => {
  const { t } = useTranslation();
  const sortOptions = useMemo(
    () => [
      { label: t('sort.name'), value: 'name' as SortBy },
      { label: t('sort.size'), value: 'size' as SortBy },
      { label: t('sort.date'), value: 'date' as SortBy },
      { label: t('sort.type'), value: 'type' as SortBy },
    ],
    [t]
  );

  const getIcon = (item: FileEntity) => {
    if (item.isDirectory) return <FolderIcon />;
    const ext = item?.name?.split('.').pop()?.toLowerCase() ?? '';
    return fileIcons[ext as keyof typeof fileIcons] || <FolderIcon />;
  };

  const getItemTime = (time: string) => {
    const date = new Date(time);
    const timeZone = getCalendars()[0].timeZone || 'UTC';
    return formatInTimeZone(date, timeZone, 'd MMM yyyy');
  };

  const hasSelectedItems = selectedItems.length > 0;
  const hasSelectedAll = selectedItems.length === items.length;

  if (items.length === 0) {
    return <Text className="text-center">No files</Text>;
  }

  return (
    <>
      <View className="flex-row gap-4 px-6 py-2 items-center bg-layer border-b border-b-content">
        <Checkbox
          checked={hasSelectedAll}
          onChange={() => (hasSelectedAll ? handleClearSelection() : handleSelectAll())}
        />
        {sortOptions.map((sort) => (
          <Button
            key={sort.value}
            variant="text"
            onPress={() => handleSort(sort.value)}
            className="flex flex-row gap-2 justify-between items-center p-2 w-24"
          >
            <Text>{sort.label}</Text>
            <ChevronDownIcon
              className={cn(
                'text-content hidden transition-all transform',
                comparator.sort === sort.value && 'block',
                comparator.order === 1 && 'rotate-180'
              )}
            />
          </Button>
        ))}
      </View>
      <ScrollView className={cn('flex-1 w-full p-2 pb-20', className)}>
        {items.map((item) => {
          const isSelected = selectedItems.find((i) => i.uri === item.uri);
          return (
            <Pressable
              key={item.name}
              className={cn(
                'flex-row gap-4 px-5 py-4 md:px-4 md:py-3 mb-2 rounded-md items-center hover:bg-layer-secondary active:bg-layer-secondary',
                isSelected && 'bg-layer-secondary'
              )}
              onPress={() =>
                hasSelectedItems ? handleSelectItem(item) : item.isDirectory ? handleDirClick(item.name) : null
              }
              onLongPress={() => handleSelectItem(item)}
            >
              <Checkbox
                className={cn('md:flex', hasSelectedItems ? 'flex' : 'hidden')}
                checked={!!isSelected}
                onChange={() => handleSelectItem(item)}
              />
              <Text className="text-3xl">{getIcon(item)}</Text>
              <View className="gap-1">
                <Text className="text-lg leading-5">{item.name}</Text>
                <View className="flex-row gap-1">
                  {!item.isDirectory && <Text className="text-content-tertiary text-sm">{fileSize(item.size)},</Text>}
                  <Text className="text-content-tertiary text-sm">{getItemTime(item.modificationTime)}</Text>
                </View>
              </View>

              {!hasSelectedItems && <FileOptionsDropdown file={item} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
};
