// import { Api } from '@/api/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { type UserResponse } from '@repo/shared';

type UserSearchResponse = {
  data: UserResponse[];
};

export const useUserSearch = () => {
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery<UserSearchResponse>({
    queryKey: ['users', query],
    queryFn: () => ({ data: [] }), // TODO: implement API call to search users
    enabled: query.length > 0,
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
