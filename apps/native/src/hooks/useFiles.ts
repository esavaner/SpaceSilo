import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Props = {
  onPathChange?: (path: string) => void;
  path?: string;
};

export const useFiles = ({ onPathChange, path = '' }: Props) => {
  const [currentPath, setCurrentPath] = useState(path);
  const [selectedItems, setSelectedItems] = useState<FileEntity[]>([]);

  const { data } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => Api.files.filesControllerFindAll({ path: currentPath }),
  });

  const handleDirClick = (name: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    const newPath = `${currentPath}/${name}`;
    setCurrentPath(newPath);
    onPathChange?.(newPath);
  };

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

  return {
    currentPath,
    selectedItems,
    handleDirClick,
    handlePathClick,
    handleSelectItem,
    handleClearSelection,
    handleSelectAll,
    items: data?.data || [],
  };
};
