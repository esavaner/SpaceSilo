import { Api } from '@/api/api';
import { AddMemberDto, CreateGroupDto } from '@/api/generated';
import { useUi } from '@/providers/UiProvider';
import { useQueryClient, useMutation } from '@tanstack/react-query';

// @TODO add translations
export const useGroupActions = () => {
  const queryClient = useQueryClient();
  const { closeModal, toast } = useUi();

  const success = (message: string) => {
    closeModal();
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  };

  const { mutate: addMember } = useMutation({
    mutationKey: ['addMember'],
    mutationFn: ({ id, ...data }: AddMemberDto & { id: string }) => Api.groups.groupsControllerAddMember(id, data),
    onSuccess: () => success('Member added'),
    onError: () => {
      toast.error('Error adding member');
    },
  });

  const { mutate: addMembers } = useMutation({
    mutationKey: ['addMembers'],
    mutationFn: ({ id, members }: { id: string; members: AddMemberDto[] }) =>
      Api.groups.groupsControllerAddMembers(id, { members }),
    onSuccess: () => success('Members added'),
    onError: () => {
      toast.error('Error adding members');
    },
  });

  const { mutate: createGroup } = useMutation({
    mutationKey: ['createGroup'],
    mutationFn: (data: CreateGroupDto) => Api.groups.groupsControllerCreate(data),
    onSuccess: (_, { name }) => success(`Group ${name} created`),
    onError: (_, { name }) => {
      toast.error(`Error creating group: ${name}`);
    },
  });

  const { mutate: removeGroup } = useMutation({
    mutationKey: ['removeGroup'],
    mutationFn: (id: string) => Api.groups.groupsControllerRemove(id),
    onSuccess: () => success('Group removed'),
    onError: () => {
      toast.error('Error removing group');
    },
  });

  const { mutate: removeMember } = useMutation({
    mutationKey: ['removeMember'],
    mutationFn: ({ id, ...data }: AddMemberDto & { id: string }) => Api.groups.groupsControllerRemoveMember(id, data),
    onSuccess: () => success('Member removed'),
    onError: () => {
      toast.error('Error removing member');
    },
  });

  const { mutate: updateMember } = useMutation({
    mutationKey: ['updateMember'],
    mutationFn: ({ id, ...data }: AddMemberDto & { id: string }) => Api.groups.groupsControllerUpdateMember(id, data),
    onSuccess: () => success('Member updated'),
    onError: () => {
      toast.error('Error updating member');
    },
  });

  return {
    addMember,
    addMembers,
    createGroup,
    removeGroup,
    removeMember,
    updateMember,
  };
};
