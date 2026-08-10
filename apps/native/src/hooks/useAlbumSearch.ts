import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { type AlbumSearchResponse } from '@repo/shared';
import { useServerContext } from '@/providers/ServerProvider';

export type AlbumSearchItem = AlbumSearchResponse & {
  serverId: string;
  label: string;
};

export const useAlbumSearch = () => {
  const { servers } = useServerContext();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const normalizedInput = input.trim();

  useEffect(() => {
    if (!normalizedInput) {
      setQuery('');
      return;
    }

    const timeout = setTimeout(() => setQuery(normalizedInput), 1000);
    return () => clearTimeout(timeout);
  }, [normalizedInput]);

  const { data } = useQuery({
    queryKey: ['album-search', query, servers.map((server) => server.id)],
    queryFn: async (): Promise<AlbumSearchItem[]> => {
      const responses = await Promise.all(
        servers.map(async (server) => {
          try {
            const albums = await server.client.album.search(query);
            return albums.map((album) => ({ ...album, serverId: server.id, label: server.label }));
          } catch {
            return [];
          }
        })
      );

      return responses.flat();
    },
    enabled: Boolean(query) && servers.length > 0,
  });

  return {
    clearSearch: () => setInput(''),
    query: input,
    results: normalizedInput === query ? (data ?? []) : [],
    searchAlbums: setInput,
  };
};
