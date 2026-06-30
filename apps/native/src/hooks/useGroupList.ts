import { useServerContext } from '@/providers/ServerProvider';
import { GroupResponse } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export type GroupListItem = GroupResponse & {
  serverId: string;
};

export const useGroupList = () => {
  const { servers } = useServerContext();
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const { data: groups, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      if (!servers.length) {
        return { data: [] };
      }

      const responses = await Promise.all(
        servers.map(async (server) => {
          try {
            const groups = await server.client.groups.findUserGroups();
            return groups.map((group) => ({ ...group, serverId: server.id }));
          } catch {
            return [];
          }
        })
      );

      return { data: responses.flat() };
    },
    enabled: servers.length > 0,
    select: (data) => data.data,
  });

  const groupsPersonal = groups?.filter((group) => group.personal);
  const groupsShared = groups?.filter((group) => !group.personal);

  useEffect(() => {
    if (groups) {
      setSelectedGroupIds(groups.map((group) => group.id));
    }
  }, [groups]);

  const handleSelectAllGroups = () => {
    const g = groups || [];
    setSelectedGroupIds(g.map((group) => group.id));
  };

  const handleSelectGroup = (group: Pick<GroupListItem, 'id'>) => {
    const isSelected = selectedGroupIds.includes(group.id);
    if (isSelected) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== group.id));
    } else {
      setSelectedGroupIds([...selectedGroupIds, group.id]);
    }
  };

  return {
    groups: groups || [],
    groupsPersonal,
    groupsShared,
    isGroupsLoading,
    handleSelectAllGroups,
    handleSelectGroup,
    selectedGroupIds,
  };
};
