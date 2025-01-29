import { Api } from '@/api/api';
import { GetGroupDto } from '@/api/generated';
import { useUserContext } from '@/providers/UserProvider';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useGroupList = () => {
  const { user } = useUserContext();
  const [selectedGroupIds, setSelectedGroupIds] = useState<GetGroupDto['id'][]>([]);

  const { data: g, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: Api.groups.groupsControllerFindUserGroups,
    enabled: !!user,
    select: (data) => data.data,
  });

  const groups = g || [];
  const groupsPersonal = groups.filter((group: GetGroupDto) => group.personal);
  const groupsShared = groups.filter((group: GetGroupDto) => !group.personal);

  useEffect(() => {
    setSelectedGroupIds(groups.map((group) => group.id));
  }, [groups]);

  const handleSelectAllGroups = () => {
    setSelectedGroupIds(groups.map((group) => group.id));
  };

  const handleSelectGroup = (group: GetGroupDto) => {
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
