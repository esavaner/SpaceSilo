// import { Api } from '@/api/api';
// import { FileEntity } from '@/api/generated';
import { useQuery } from '@tanstack/react-query';
import { compareAsc } from 'date-fns';
import { useState } from 'react';
import { useGroupList } from './useGroupList';
import { useServerContext } from '@/providers/ServerProvider';
import { FileResponse } from '@repo/shared';

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

export type FileListItem = FileResponse & {
  serverId: string;
};

const comparators: Record<SortBy, (a: FileListItem, b: FileListItem) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  size: (a, b) => (a?.size || 0) - (b?.size || 0),
  date: (a, b) => compareAsc(a.modificationTime, b.modificationTime),
  type: (a, b) => {
    if (a.isDirectory || b.isDirectory) return 0;
    const extA = a.name.split('.').pop() || '';
    const extB = b.name.split('.').pop() || '';
    return extA.localeCompare(extB);
  },
};

export const useFileList = ({ onPathChange, onFileSelect, path = '' }: Props) => {
  const { servers } = useServerContext();
  const { groups, groupsPersonal, groupsShared, handleSelectGroup, isGroupsLoading, selectedGroupIds } = useGroupList();
  const [currentPath, setCurrentPath] = useState(path);
  const [selectedItems, setSelectedItems] = useState<FileListItem[]>([]);
  const [comparator, setComparator] = useState<Comparator>({ sort: 'name', order: 1 });

  const getItemKey = (item: Pick<FileListItem, 'uri' | 'groupId' | 'serverId'>) =>
    `${item.serverId}:${item.groupId}:${item.uri}`;

  const { data: f, refetch } = useQuery({
    queryKey: ['files', currentPath, groups, servers.map((server) => server.id)],
    queryFn: async () => {
      if (!servers.length || !groups?.length) {
        return { data: [] };
      }

      const request = {
        items: groups.map((group) => ({ groupId: group.id, path: currentPath })),
      };

      const responses = await Promise.all(
        servers.map(async (server) => {
          try {
            const files = await server.client.files.findAll(request);
            return files.map((file) => ({ ...file, serverId: server.id }));
          } catch {
            return [];
          }
        })
      );

      return { data: responses.flat() };
    },

    enabled: !isGroupsLoading && servers.length > 0 && groups?.length > 0,
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

  const handleSelectItem = (item: FileListItem) => {
    const itemKey = getItemKey(item);
    const isSelected = selectedItems.some((i) => getItemKey(i) === itemKey);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => getItemKey(i) !== itemKey));
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

  const onDirClick = (dir: FileListItem) => {
    if (selectedItems.length > 0) {
      return;
    }
    setCurrentPath(dir.uri);
    onPathChange?.(dir.uri);
  };

  const onFileClick = (file: FileListItem) => {
    if (selectedItems.length > 0) {
      return;
    }
    onFileSelect?.(file.uri, file.groupId);
  };

  const handleItemClick = (item: FileListItem) =>
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
