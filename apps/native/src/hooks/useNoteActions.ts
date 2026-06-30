import { toast } from '@/lib/toast';
import { useServerContext } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreateNoteRequest, type NoteResponse, type UpdateNoteRequest } from '@repo/shared';

type NoteMutationBase = {
  serverId: string;
};

type CreateNoteMutation = NoteMutationBase & CreateNoteRequest;
type UpdateNoteMutation = NoteMutationBase & UpdateNoteRequest & { id: string };
type RemoveNoteMutation = NoteMutationBase & { id: string };

export const useNoteActions = () => {
  const queryClient = useQueryClient();
  const { closeModal } = useUi();
  const { allServers } = useServerContext();

  const getServerClient = (serverId: string) => {
    const server = allServers.find((item) => item.id === serverId);

    if (!server) {
      throw new Error(`Server connection ${serverId} not found`);
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
    onSuccess: () => success('Note created'),
    onError: (error) => {
      toast.error(error.message || 'Error creating note');
    },
  });

  const { mutate: updateNote, isPending: isUpdatingNote } = useMutation<NoteResponse, Error, UpdateNoteMutation>({
    mutationKey: ['updateNote'],
    mutationFn: async ({ id, serverId, ...dto }) => getServerClient(serverId).notes.update(id, dto),
    onSuccess: () => success('Note updated'),
    onError: (error) => {
      toast.error(error.message || 'Error updating note');
    },
  });

  const { mutate: removeNote, isPending: isRemovingNote } = useMutation<NoteResponse, Error, RemoveNoteMutation>({
    mutationKey: ['removeNote'],
    mutationFn: async ({ id, serverId }) => getServerClient(serverId).notes.remove(id),
    onSuccess: () => success('Note deleted'),
    onError: (error) => {
      toast.error(error.message || 'Error deleting note');
    },
  });

  return {
    createNote,
    updateNote,
    removeNote,
    isPending: isCreatingNote || isUpdatingNote || isRemovingNote,
  };
};
