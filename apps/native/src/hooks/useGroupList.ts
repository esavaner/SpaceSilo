import { Api } from '@/api/api';
import { GetGroupDto } from '@/api/generated';
import { useQuery } from '@tanstack/react-query';

export const useGroupList = () => {
  const { data: g, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: Api.groups.groupsControllerFindUserGroups,
  });

  const groups = g?.data || [];
  const groupsPersonal = groups.filter((group: GetGroupDto) => group.personal);
  const groupsShared = groups.filter((group: GetGroupDto) => !group.personal);

  return { groups, groupsPersonal, groupsShared, isGroupsLoading };
};
