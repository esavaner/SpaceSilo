// import { Api } from '@/api/api';
// import { GetGroupDto } from '@/api/generated';
import { useUserContext } from '@/providers/UserProvider';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useGroupList = () => {
  const { user } = useUserContext();
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const { data: groups, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => ({ data: [] }) as any, // TODO: implement API call to get user groups
    enabled: !!user,
    select: (data) => data.data,
  });

  const groupsPersonal = groups?.filter((group: any) => group.personal);
  const groupsShared = groups?.filter((group: any) => !group.personal);

  useEffect(() => {
    if (groups) {
      setSelectedGroupIds(groups.map((group: any) => group.id));
    }
  }, [groups]);

  const handleSelectAllGroups = () => {
    const g = groups || [];
    setSelectedGroupIds(g.map((group: any) => group.id));
  };

  const handleSelectGroup = (group: any) => {
    const isSelected = selectedGroupIds.includes(group.id);
    if (isSelected) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== group.id));
    } else {
      setSelectedGroupIds([...selectedGroupIds, group.id]);
    }
  };

  return {
    groups,
    groupsPersonal,
    groupsShared,
    isGroupsLoading,
    handleSelectAllGroups,
    handleSelectGroup,
    selectedGroupIds,
  };
};
