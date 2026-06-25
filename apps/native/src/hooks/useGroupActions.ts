// import { Api } from '@/api/api';
// import { AddMemberDto, CreateGroupDto } from '@/api/generated';
import { toast } from '@/lib/toast';
import { useUi } from '@/providers/UiProvider';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  type AddGroupMemberRequest,
  type AddGroupMembersRequest,
  type CreateGroupRequest,
  type GroupResponse,
  type RemoveGroupMemberRequest,
  type UpdateGroupMemberRequest,
} from '@repo/shared';

type AddMemberMutation = { id: string } & AddGroupMemberRequest;
type AddMembersMutation = { id: string } & AddGroupMembersRequest;
type RemoveMemberMutation = { id: string } & RemoveGroupMemberRequest;
type UpdateMemberMutation = { id: string } & UpdateGroupMemberRequest;

// @TODO add translations
export const useGroupActions = () => {
  const queryClient = useQueryClient();
  const { closeModal } = useUi();

  const success = (message: string) => {
    closeModal();
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  };

  const { mutate: addMember, isPending: isAddingMember } = useMutation<GroupResponse, Error, AddMemberMutation>({
    mutationKey: ['addMember'],
    mutationFn: async (_variables) => ({}) as GroupResponse, // TODO: implement API call to add member to group
    onSuccess: () => success('Member added'),
    onError: () => {
      toast.error('Error adding member');
    },
  });

  const { mutate: addMembers, isPending: isAddingMembers } = useMutation<GroupResponse, Error, AddMembersMutation>({
    mutationKey: ['addMembers'],
    mutationFn: async (_variables) => ({}) as GroupResponse,
    onSuccess: () => success('Members added'),
    onError: () => {
      toast.error('Error adding members');
    },
  });

  const { mutate: createGroup, isPending: isCreatingGroup } = useMutation<GroupResponse, Error, CreateGroupRequest>({
    mutationKey: ['createGroup'],
    mutationFn: async (_data) => ({}) as GroupResponse,
    onSuccess: (_, { name }) => success(`Group ${name} created`),
    onError: (_, { name }) => {
      toast.error(`Error creating group: ${name}`);
    },
  });

  const { mutate: removeGroup, isPending: isRemovingGroup } = useMutation<GroupResponse, Error, string>({
    mutationKey: ['removeGroup'],
    mutationFn: async (_id) => ({}) as GroupResponse,
    onSuccess: () => success('Group removed'),
    onError: () => {
      toast.error('Error removing group');
    },
  });

  const { mutate: removeMember, isPending: isRemovingMember } = useMutation<GroupResponse, Error, RemoveMemberMutation>(
    {
      mutationKey: ['removeMember'],
      mutationFn: async (_variables) => ({}) as GroupResponse,
      onSuccess: () => success('Member removed'),
      onError: () => {
        toast.error('Error removing member');
      },
    }
  );

  const { mutate: updateMember, isPending: isUpdatingMember } = useMutation<GroupResponse, Error, UpdateMemberMutation>(
    {
      mutationKey: ['updateMember'],
      mutationFn: async (_variables) => ({}) as GroupResponse,
      onSuccess: () => success('Member updated'),
      onError: () => {
        toast.error('Error updating member');
      },
    }
  );

  return {
    addMember,
    addMembers,
    createGroup,
    removeGroup,
    removeMember,
    updateMember,
    isPending:
      isAddingMember || isAddingMembers || isCreatingGroup || isRemovingGroup || isRemovingMember || isUpdatingMember,
  };
};
