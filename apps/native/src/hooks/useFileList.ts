import { Api } from '@/api/api';
import { FileEntity, GetGroupDto } from '@/api/generated';
import { useQuery } from '@tanstack/react-query';
import { compareAsc } from 'date-fns';
import { useEffect, useState } from 'react';
import { useGroupList } from './useGroupList';

type Props = {
  onPathChange?: (path: string) => void;
  onFileSelect?: (fileUri: string) => void;
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
  const [currentPath, setCurrentPath] = useState(path);
  const [selectedItems, setSelectedItems] = useState<FileEntity[]>([]);
  const [comparator, setComparator] = useState<Comparator>({ sort: 'name', order: 1 });
  const [selectedGroupIds, setSelectedGroupIds] = useState<GetGroupDto['id'][]>([]);
  const { groups, groupsPersonal, groupsShared, isGroupsLoading } = useGroupList();

  useEffect(() => {
    setSelectedGroupIds(groups.map((group) => group.id));
  }, [groups]);

  const { data: f, refetch } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => Api.files.filesControllerFindAll({ path: currentPath, groupIds: selectedGroupIds }),
    enabled: !isGroupsLoading && groups.length > 0,
  });

  const unsorted = f?.data || [];
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

  const onDirClick = (dirUri: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    setCurrentPath(dirUri);
    onPathChange?.(dirUri);
  };

  const onFileClick = (fileUri: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    onFileSelect?.(fileUri);
  };

  const handleItemClick = (item: FileEntity) => {
    hasSelectedItems ? handleSelectItem(item) : item.isDirectory ? onDirClick(item.uri) : onFileClick(item.uri);
  };

  const handleGroupSelect = (group: GetGroupDto) => {
    const isSelected = selectedGroupIds.includes(group.id);
    if (isSelected) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== group.id));
    } else {
      setSelectedGroupIds([...selectedGroupIds, group.id]);
    }
  };

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
    handleGroupSelect,
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
