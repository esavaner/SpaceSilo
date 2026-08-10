import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { type FileSearchResponse } from '@repo/shared';
import { useServerContext } from '@/providers/ServerProvider';

export type FileSearchItem = FileSearchResponse & {
  serverId: string;
};

export const useFileSearch = () => {
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

  const { data, isLoading } = useQuery({
    queryKey: ['file-search', query, servers.map((server) => server.id)],
    queryFn: async (): Promise<FileSearchItem[]> => {
      const responses = await Promise.all(
        servers.map(async (server) => {
          try {
            const files = await server.client.files.search({ query });
            return files.map((file) => ({ ...file, serverId: server.id }));
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
    isSearching: Boolean(normalizedInput) && (normalizedInput !== query || isLoading),
    query: input,
    results: normalizedInput === query ? (data ?? []) : [],
    searchFiles: setInput,
  };
};
