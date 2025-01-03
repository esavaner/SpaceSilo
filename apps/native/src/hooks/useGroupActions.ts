import { Api } from '@/api/api';
import { AddMemberDto } from '@/api/generated';
import { useUi } from '@repo/ui';
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

  const { mutate: createGroup } = useMutation({
    mutationKey: ['createGroup'],
    mutationFn: Api.groups.groupsControllerCreate,
    onSuccess: (_, { groupName }) => success(`Group ${groupName} created`),
    onError: (_, { groupName }) => {
      toast.error(`Error creating group: ${groupName}`);
    },
  });

  const { mutate: removeGroup } = useMutation({
    mutationKey: ['removeGroup'],
    mutationFn: Api.groups.groupsControllerRemove,
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
    createGroup,
    removeGroup,
    removeMember,
    updateMember,
  };
};
