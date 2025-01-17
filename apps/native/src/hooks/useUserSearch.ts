import { Api } from '@/api/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export const useUserSearch = () => {
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', query],
    queryFn: () => Api.users.usersControllerSearch(query),
    enabled: query.length > 0,
  });

  const searchUsers = (text: string) => {
    setQuery(text);
  };

  return {
    results: data?.data || [],
    isSearchLoading: isLoading,
    searchUsers,
  };
};
