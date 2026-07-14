// import { Api } from '@/api/api';
// import { AddMemberDto, CreateGroupDto } from '@/api/generated';
import { toast } from '@/lib/toast';
import { useServerContext } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  type AddGroupMemberRequest,
  type AddGroupMembersRequest,
  type CreateGroupRequest,
  type GroupResponse,
  type RemoveGroupMemberRequest,
  type UpdateGroupRequest,
  type UpdateGroupMemberRequest,
} from '@repo/shared';
import { tApiErr } from '@/i18n/translate';

type GroupMutationBase = {
  id: string;
  serverId?: string;
};

type AddMemberMutation = GroupMutationBase & AddGroupMemberRequest;
type AddMembersMutation = GroupMutationBase & AddGroupMembersRequest;
type RemoveGroupMutation = GroupMutationBase;
type RemoveMemberMutation = GroupMutationBase & RemoveGroupMemberRequest;
type UpdateGroupMutation = GroupMutationBase & UpdateGroupRequest;
type UpdateMemberMutation = GroupMutationBase & UpdateGroupMemberRequest;

export const useGroupActions = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { closeModal } = useUi();
  const { allServers, servers } = useServerContext();

  const getServerClient = (serverId: string) => {
    const server = allServers.find((item) => item.id === serverId);
    if (!server) {
      throw new Error(t('common.messages.serverConnectionErr.NotFound', { serverId }));
    }
    return server.client;
  };

  const getDefaultServerClient = () => {
    const server = servers[0] ?? allServers[0];
    if (!server) {
      throw new Error(t('common.messages.noActiveServers'));
    }
    return server.client;
  };

  const resolveGroupClient = async ({ id, serverId }: GroupMutationBase) => {
    if (serverId) {
      return getServerClient(serverId);
    }

    for (const server of servers) {
      try {
        await server.client.groups.findOne(id);
        return server.client;
      } catch {
        continue;
      }
    }

    throw new Error(t('api.groups.Err.NotFound'));
  };

  const success = (message: string) => {
    closeModal();
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['files'] });
  };

  const { mutate: addMember, isPending: isAddingMember } = useMutation<GroupResponse, Error, AddMemberMutation>({
    mutationKey: ['addMember'],
    mutationFn: async ({ id, serverId, ...dto }) => {
      const client = await resolveGroupClient({ id, serverId });
      return client.groups.addMember(id, dto);
    },
    onSuccess: () => success(t('groups.toasts.addMemberSuccess')),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'groups.errors.addMember'));
    },
  });

  const { mutate: addMembers, isPending: isAddingMembers } = useMutation<GroupResponse, Error, AddMembersMutation>({
    mutationKey: ['addMembers'],
    mutationFn: async ({ id, serverId, ...dto }) => {
      const client = await resolveGroupClient({ id, serverId });
      return client.groups.addMembers(id, dto);
    },
    onSuccess: () => success(t('groups.toasts.addMembersSuccess')),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'groups.errors.addMembers'));
    },
  });

  const { mutate: createGroup, isPending: isCreatingGroup } = useMutation<GroupResponse, Error, CreateGroupRequest>({
    mutationKey: ['createGroup'],
    mutationFn: async (data) => {
      const client = getDefaultServerClient();
      return client.groups.create(data);
    },
    onSuccess: (_, { name }) => success(t('groups.toasts.createSuccess', { name })),
    onError: (error, { name }) => {
      const message = tApiErr(t, error);
      toast.error(message === t('common.messages.genericError') ? t('groups.errors.create', { name }) : message);
    },
  });

  const { mutate: removeGroup, isPending: isRemovingGroup } = useMutation<GroupResponse, Error, RemoveGroupMutation>({
    mutationKey: ['removeGroup'],
    mutationFn: async ({ id, serverId }) => {
      const client = await resolveGroupClient({ id, serverId });
      return client.groups.remove(id);
    },
    onSuccess: () => success(t('groups.toasts.removeSuccess')),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'groups.errors.remove'));
    },
  });

  const { mutate: updateGroup, isPending: isUpdatingGroup } = useMutation<GroupResponse, Error, UpdateGroupMutation>({
    mutationKey: ['updateGroup'],
    mutationFn: async ({ id, serverId, ...dto }) => {
      const client = await resolveGroupClient({ id, serverId });
      return client.groups.update(id, dto);
    },
    onSuccess: () => success(t('groups.toasts.updateSuccess')),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'groups.errors.update'));
    },
  });

  const { mutate: removeMember, isPending: isRemovingMember } = useMutation<GroupResponse, Error, RemoveMemberMutation>(
    {
      mutationKey: ['removeMember'],
      mutationFn: async ({ id, serverId, ...dto }) => {
        const client = await resolveGroupClient({ id, serverId });
        return client.groups.removeMember(id, dto);
      },
      onSuccess: () => success(t('groups.toasts.removeMemberSuccess')),
      onError: (error) => {
        toast.error(tApiErr(t, error, 'groups.errors.removeMember'));
      },
    }
  );

  const { mutate: updateMember, isPending: isUpdatingMember } = useMutation<GroupResponse, Error, UpdateMemberMutation>(
    {
      mutationKey: ['updateMember'],
      mutationFn: async ({ id, serverId, ...dto }) => {
        const client = await resolveGroupClient({ id, serverId });
        return client.groups.updateMember(id, dto);
      },
      onSuccess: () => success(t('groups.toasts.updateMemberSuccess')),
      onError: (error) => {
        toast.error(tApiErr(t, error, 'groups.errors.updateMember'));
      },
    }
  );

  return {
    addMember,
    addMembers,
    createGroup,
    removeGroup,
    removeMember,
    updateGroup,
    updateMember,
    isPending:
      isAddingMember ||
      isAddingMembers ||
      isCreatingGroup ||
      isRemovingGroup ||
      isRemovingMember ||
      isUpdatingGroup ||
      isUpdatingMember,
  };
};
