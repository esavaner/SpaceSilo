import { useServerContext } from '@/providers/ServerProvider';
import { type GroupResponse } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export type GroupListItem = GroupResponse & {
  serverId: string;
};

const getGroupKey = (group: Pick<GroupListItem, 'id' | 'serverId'>) => `${group.serverId}:${group.id}`;

export const useGroupList = () => {
  const { servers } = useServerContext();
  const [excludedGroupKeys, setExcludedGroupKeys] = useState<string[]>([]);

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

  const groupList = groups ?? [];
  const excludedGroupKeySet = new Set(excludedGroupKeys);
  const includedGroups = groupList.filter((group) => !excludedGroupKeySet.has(getGroupKey(group)));
  const groupsPersonal = groupList.filter((group) => group.personal);
  const groupsShared = groupList.filter((group) => !group.personal);
  const isGroupIncluded = (group: Pick<GroupListItem, 'id' | 'serverId'>) =>
    !excludedGroupKeySet.has(getGroupKey(group));

  useEffect(() => {
    const availableGroupKeys = new Set(groupList.map(getGroupKey));

    setExcludedGroupKeys((current) => {
      const next = current.filter((key) => availableGroupKeys.has(key));
      return next.length === current.length ? current : next;
    });
  }, [groups]);

  const handleIncludeAllGroups = () => setExcludedGroupKeys([]);

  const handleToggleIncludedGroup = (group: Pick<GroupListItem, 'id' | 'serverId'>) => {
    const groupKey = getGroupKey(group);

    setExcludedGroupKeys((current) =>
      current.includes(groupKey) ? current.filter((key) => key !== groupKey) : [...current, groupKey]
    );
  };

  return {
    groups: groupList,
    groupsPersonal,
    groupsShared,
    includedGroups,
    isGroupsLoading,
    isGroupIncluded,
    handleIncludeAllGroups,
    handleToggleIncludedGroup,
  };
};
