// import { Api } from '@/api/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useServerContext } from '@/providers/ServerProvider';
import { type UserResponse } from '@repo/shared';

type UserSearchResponse = {
  data: UserResponse[];
};

export const useUserSearch = (serverId?: string) => {
  const [query, setQuery] = useState('');
  const { allServers, servers } = useServerContext();

  const server =
    (serverId ? allServers.find((item) => item.id === serverId) : undefined) ?? servers[0] ?? allServers[0];

  const { data, isLoading } = useQuery<UserSearchResponse>({
    queryKey: ['users', server?.id, query],
    queryFn: async () => {
      if (!server || query.length === 0) {
        return { data: [] };
      }

      const results = await server.client.users.search(query);
      return { data: results };
    },
    enabled: query.length > 0 && Boolean(server),
  });

  const searchUsers = (text: string) => {
    setQuery(text);
  };

  const resetSearch = () => {
    setQuery('');
  };

  return {
    isSearchLoading: isLoading,
    query,
    resetSearch,
    results: query.length > 0 ? data?.data || [] : [],
    searchUsers,
  };
};
