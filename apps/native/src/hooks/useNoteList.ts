import { useServerContext } from '@/providers/ServerProvider';
import { type NoteResponse } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';

export type NoteListItem = NoteResponse & {
  serverId: string;
};

const compareNotes = (left: NoteListItem, right: NoteListItem) => {
  const updatedDifference = +new Date(right.updatedAt) - +new Date(left.updatedAt);

  if (updatedDifference !== 0) {
    return updatedDifference;
  }

  const createdDifference = +new Date(right.createdAt) - +new Date(left.createdAt);

  if (createdDifference !== 0) {
    return createdDifference;
  }

  return right.id.localeCompare(left.id);
};

export const useNoteList = () => {
  const { servers } = useServerContext();

  const { data: notes, isLoading: isNotesLoading } = useQuery({
    queryKey: ['notes', servers.map((server) => server.id)],
    queryFn: async () => {
      if (!servers.length) {
        return { data: [] };
      }

      const responses = await Promise.all(
        servers.map(async (server) => {
          try {
            const notes = await server.client.notes.findAll();
            return notes.map((note) => ({ ...note, serverId: server.id }));
          } catch {
            return [];
          }
        })
      );

      return { data: responses.flat().sort(compareNotes) };
    },
    enabled: servers.length > 0,
    select: (data) => data.data,
  });

  return {
    notes: notes ?? [],
    isNotesLoading,
  };
};
