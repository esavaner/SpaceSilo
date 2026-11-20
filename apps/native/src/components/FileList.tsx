import { Platform } from 'react-native';
import styled, { css } from 'styled-components/native';
import { FileText, Folder } from 'lucide-react-native';
import { fileIcons } from '../utils/fileIcons';
import { fileSize } from '@/utils/common';
import { formatInTimeZone } from 'date-fns-tz';
import { getCalendars } from 'expo-localization';
import { FileOptionsDropdown } from './dropdowns/FileOptions.dropdown';
import { FileAddDropdown } from './dropdowns/FileAdd.dropdown';
import { useFilesContext } from '@/providers/FilesProvider';
import { FileSortDropdown } from './dropdowns/FileSort.dropdown';
import { FileFilterDropdown } from './dropdowns/FileFilter.dropdown';
import { Checkbox, Text, theme, useThemeColors } from '@repo/shared/components';
import { type FileListItem } from '@/hooks/useFileList';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const Toolbar = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[200]};
  background-color: ${theme.colors.surface.default};
  border-bottom-width: ${theme.borderWeight[25]};
  border-bottom-color: ${theme.colors.border.default};
  z-index: ${theme.zIndex.raised};
`;

const List = styled.ScrollView`
  flex: 1;
  width: 100%;
  z-index: ${theme.zIndex.base};
`;

const ListContent = styled.View`
  padding: ${theme.spacing[200]};
  padding-bottom: 80px;
`;

const FileEntry = styled.View<{ $selected: boolean; $menuOpen: boolean }>`
  position: relative;
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing[400]};
  margin-bottom: ${theme.spacing[200]};
  border-radius: ${theme.radius[150]};
  background-color: ${({ $selected }) => ($selected ? theme.colors.surface.stronger : 'transparent')};
  z-index: ${({ $menuOpen }) => ($menuOpen ? theme.zIndex.raised : theme.zIndex.base)};
  ${
    Platform.OS === 'web' &&
    css`
      &:hover {
        background-color: ${theme.colors.surface.medium};
      }
    `
  }
`;

const FileTarget = styled.Pressable`
  flex: 1;
  flex-direction: row;
  align-items: center;
  border-radius: ${theme.radius[150]};
  cursor: pointer;
  &:active {
    background-color: ${theme.colors.surface.medium};
  }
`;

const SelectionSlot = styled.View<{ $visible: boolean }>`
  overflow: hidden;
  width: ${({ $visible }) => ($visible ? theme.spacing[1200] : '0px')};
  margin-right: ${({ $visible }) => ($visible ? theme.spacing[200] : '0px')};
`;

const SelectionPadding = styled.View`
  padding: ${theme.spacing[300]};
`;

const FileIcon = styled.View`
  width: 28px;
  align-items: center;
  justify-content: center;
  margin-right: ${theme.spacing[400]};
`;

const FileDetails = styled.View`
  flex: 1;
  gap: ${theme.spacing[100]};
`;

const Metadata = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[100]};
`;

const GroupMarker = styled.View<{ $color?: string | null }>`
  position: absolute;
  left: 0;
  width: ${theme.spacing[100]};
  height: 28px;
  border-radius: ${theme.radius[150]};
  background-color: ${({ $color }) => $color ?? 'transparent'};
`;

type SelectionToggleProps = {
  checked: boolean;
  onPress: () => void;
  label: string;
};

const SelectionToggle = ({ checked, onPress, label }: SelectionToggleProps) => (
  <SelectionPadding>
    <Checkbox
      hitSlop={10}
      label={label}
      hideLabel
      checked={checked}
      onValueChange={onPress}
      onPress={(event) => event.stopPropagation()}
    />
  </SelectionPadding>
);

export const FileList = () => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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

  const getIcon = (item: FileListItem) => {
    const extension = item.name.split('.').pop()?.toLowerCase() ?? '';
    const FileTypeIcon = item.isDirectory ? Folder : (fileIcons[extension] ?? FileText);
    return (
      <FileTypeIcon
        size={item.isDirectory ? 28 : 18}
        color={item.isDirectory ? colors.text.brand : colors.text.default}
      />
    );
  };

  const getItemTime = (time: string | Date) => {
    const date = new Date(time);
    const timeZone = getCalendars()[0].timeZone || 'UTC';
    return formatInTimeZone(date, timeZone, 'd MMM yyyy');
  };

  return (
    <>
      <Toolbar>
        <SelectionToggle
          checked={hasSelectedAll}
          label={t('files.selectAll')}
          onPress={() => (hasSelectedAll ? handleClearSelection() : handleSelectAll())}
        />
        <FileSortDropdown handleSort={handleSort} comparator={comparator} />
        <FileFilterDropdown />
        <FileAddDropdown currentPath={currentPath} />
      </Toolbar>
      <List keyboardShouldPersistTaps="handled">
        <ListContent>
          {items.length === 0 && <Text center>{t('files.empty')}</Text>}
          {items.map((item) => {
            const itemKey = `${item.serverId}:${item.groupId}:${item.uri}`;
            const isSelected = selectedItems.find((i) => i.uri === item.uri);
            const color = groups.find((group) => group.id === item.groupId)?.color;
            return (
              <FileEntry key={itemKey} $selected={!!isSelected} $menuOpen={openMenu === itemKey}>
                <FileTarget onPress={() => handleItemClick(item)} onLongPress={() => handleSelectItem(item)}>
                  <SelectionSlot $visible={hasSelectedItems}>
                    {hasSelectedItems && (
                      <SelectionToggle
                        checked={!!isSelected}
                        label={t('files.selectItem', { name: item.name })}
                        onPress={() => handleSelectItem(item)}
                      />
                    )}
                  </SelectionSlot>

                  <FileIcon>{getIcon(item)}</FileIcon>
                  <FileDetails>
                    <Text.L>{item.name}</Text.L>
                    <Metadata>
                      {!item.isDirectory && <Text.S color={theme.colors.text.secondary}>{fileSize(item.size)},</Text.S>}
                      <Text.S color={theme.colors.text.secondary}>{getItemTime(item.modificationTime)}</Text.S>
                    </Metadata>
                  </FileDetails>
                </FileTarget>

                {!hasSelectedItems && (
                  <FileOptionsDropdown file={item} onOpenChange={(open) => setOpenMenu(open ? itemKey : null)} />
                )}

                <GroupMarker $color={color} pointerEvents="none" />
              </FileEntry>
            );
          })}
        </ListContent>
      </List>
    </>
  );
};
