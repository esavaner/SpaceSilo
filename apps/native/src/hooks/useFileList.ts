import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { useQuery } from '@tanstack/react-query';
import { compareAsc } from 'date-fns';
import { useState } from 'react';

type Props = {
  onPathChange?: (path: string) => void;
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

export const useFileList = ({ onPathChange, path = '' }: Props) => {
  const [currentPath, setCurrentPath] = useState(path);
  const [selectedItems, setSelectedItems] = useState<FileEntity[]>([]);
  const [comparator, setComparator] = useState<Comparator>({ sort: 'name', order: 1 });

  const { data } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => Api.files.filesControllerFindAll({ path: currentPath }),
  });

  const unsorted = data?.data || [];
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
    setSelectedItems(data?.data || []);
  };

  const handleSort = (sort: SortBy) => {
    setComparator((prev) => ({ sort, order: prev.sort === sort ? -1 * prev.order : 1 }));
  };

  const onDirClick = (name: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    const newPath = `${currentPath}/${name}`;
    setCurrentPath(newPath);
    onPathChange?.(newPath);
  };

  const handleItemClick = (item: FileEntity) => {
    hasSelectedItems ? handleSelectItem(item) : item.isDirectory ? onDirClick(item.name) : null;
  };

  return {
    comparator,
    currentPath,
    items,
    handleItemClick,
    handleClearSelection,
    handlePathClick,
    handleSelectAll,
    handleSelectItem,
    handleSort,
    hasSelectedAll,
    hasSelectedItems,
    selectedItems,
  };
};
