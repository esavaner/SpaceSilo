import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { useQuery } from '@tanstack/react-query';
import { compareAsc } from 'date-fns';
import { useState } from 'react';
import { useGroupList } from './useGroupList';
import { useUserContext } from '@/providers/UserProvider';

type Props = {
  onPathChange?: (path: string) => void;
  onFileSelect?: (fileUri: string, groupId: string) => void;
  path?: string;
};

export type SortBy = 'name' | 'size' | 'date' | 'type';

export type Comparator = {
  sort: SortBy;
  order: number;
};

const comparators: Record<SortBy, (a: FileEntity, b: FileEntity) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  size: (a, b) => a.size - b.size,
  date: (a, b) => compareAsc(a.modificationTime, b.modificationTime),
  type: (a, b) => {
    if (a.isDirectory || b.isDirectory) return 0;
    const extA = a.name.split('.').pop() || '';
    const extB = b.name.split('.').pop() || '';
    return extA.localeCompare(extB);
  },
};

export const useFileList = ({ onPathChange, onFileSelect, path = '' }: Props) => {
  const { user } = useUserContext();
  const { groups, groupsPersonal, groupsShared, handleSelectGroup, isGroupsLoading, selectedGroupIds } = useGroupList();
  const [currentPath, setCurrentPath] = useState(path);
  const [selectedItems, setSelectedItems] = useState<FileEntity[]>([]);
  const [comparator, setComparator] = useState<Comparator>({ sort: 'name', order: 1 });

  const { data: f, refetch } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => Api.files.filesControllerFindAll({ path: currentPath, groupIds: selectedGroupIds }),
    enabled: !isGroupsLoading && selectedGroupIds.length > 0 && !!user,
    select: (data) => data.data,
  });

  const unsorted = f || [];
  const items = unsorted
    .sort((a, b) => comparators[comparator.sort](a, b) * comparator.order)
    .sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -comparator.order;
      if (!a.isDirectory && b.isDirectory) return comparator.order;
      return 0;
    });

  const hasSelectedItems = selectedItems.length > 0;
  const hasSelectedAll = items.length > 0 && selectedItems.length === items.length;

  const handlePathClick = (newPath: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    setCurrentPath(newPath);
    onPathChange?.(newPath);
  };

  const handleSelectItem = (item: FileEntity) => {
    const isSelected = selectedItems.some((i) => i.name === item.name);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i.name !== item.name));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleSelectAll = () => {
    setSelectedItems(items);
  };

  const handleSort = (sort: SortBy) => {
    setComparator((prev) => ({ sort, order: prev.sort === sort ? -1 * prev.order : 1 }));
  };

  const onDirClick = (dir: FileEntity) => {
    if (selectedItems.length > 0) {
      return;
    }
    setCurrentPath(dir.uri);
    onPathChange?.(dir.uri);
  };

  const onFileClick = (file: FileEntity) => {
    if (selectedItems.length > 0) {
      return;
    }
    onFileSelect?.(file.uri, file.groupId);
  };

  const handleItemClick = (item: FileEntity) =>
    hasSelectedItems ? handleSelectItem(item) : item.isDirectory ? onDirClick(item) : onFileClick(item);

  const handleApplyGroupSelect = () => {
    refetch();
  };

  return {
    comparator,
    currentPath,
    items,
    groups,
    groupsPersonal,
    groupsShared,
    handleApplyGroupSelect,
    handleItemClick,
    handleClearSelection,
    handleSelectGroup,
    handlePathClick,
    handleSelectAll,
    handleSelectItem,
    handleSort,
    hasSelectedAll,
    hasSelectedItems,
    selectedItems,
    selectedGroupIds,
  };
};
