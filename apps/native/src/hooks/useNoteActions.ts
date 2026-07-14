import { toast } from '@/lib/toast';
import { useServerContext } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreateNoteRequest, type NoteResponse, type UpdateNoteRequest } from '@repo/shared';
import { useTranslation } from 'react-i18next';
import { tApiErr } from '@/i18n/translate';

type NoteMutationBase = {
  serverId: string;
};

type CreateNoteMutation = NoteMutationBase & CreateNoteRequest;
type UpdateNoteMutation = NoteMutationBase & UpdateNoteRequest & { id: string };
type RemoveNoteMutation = NoteMutationBase & { id: string };

export const useNoteActions = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { closeModal } = useUi();
  const { allServers } = useServerContext();

  const getServerClient = (serverId: string) => {
    const server = allServers.find((item) => item.id === serverId);

    if (!server) {
      throw new Error(t('common.messages.serverConnectionErr.NotFound', { serverId }));
    }

    return server.client;
  };

  const success = (message: string) => {
    closeModal();
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  };

  const { mutate: createNote, isPending: isCreatingNote } = useMutation<NoteResponse, Error, CreateNoteMutation>({
    mutationKey: ['createNote'],
    mutationFn: async ({ serverId, ...dto }) => getServerClient(serverId).notes.create(dto),
    onSuccess: () => success(t('notes.toasts.createSuccess')),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'notes.errors.create'));
    },
  });

  const { mutate: updateNote, isPending: isUpdatingNote } = useMutation<NoteResponse, Error, UpdateNoteMutation>({
    mutationKey: ['updateNote'],
    mutationFn: async ({ id, serverId, ...dto }) => getServerClient(serverId).notes.update(id, dto),
    onSuccess: () => success(t('notes.toasts.updateSuccess')),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'notes.errors.update'));
    },
  });

  const { mutate: removeNote, isPending: isRemovingNote } = useMutation<NoteResponse, Error, RemoveNoteMutation>({
    mutationKey: ['removeNote'],
    mutationFn: async ({ id, serverId }) => getServerClient(serverId).notes.remove(id),
    onSuccess: () => success(t('notes.toasts.removeSuccess')),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'notes.errors.remove'));
    },
  });

  return {
    createNote,
    updateNote,
    removeNote,
    isPending: isCreatingNote || isUpdatingNote || isRemovingNote,
  };
};
