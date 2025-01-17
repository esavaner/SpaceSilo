import { Api } from '@/api/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useGlobalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AddIcon, Button, DropdownItem, Search, Text, UserGroupIcon } from '@repo/ui';
import { getInitials } from '@/utils/common';
import { useState } from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';

export default function SingleGroupPage() {
  const { groupId } = useGlobalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const { searchUsers, results, isSearchLoading } = useUserSearch();

  const [isAdding, setIsAdding] = useState(false);
  const toggle = () => setIsAdding((prev) => !prev);

  const { data, isLoading } = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => Api.groups.groupsControllerFindOne(groupId),
  });

  const group = data?.data;

  const options = results.map((user) => (
    <DropdownItem key={user.id} label={user.name} subLabel={user.email} icon={<UserGroupIcon />} onPress={() => {}} />
  ));

  if (isLoading) {
    return;
  }

  if (!group) {
    return (
      <View className="flex-1 bg-layer relative">
        <Text>Group not found</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-layer relative items-center gap-2 p-4">
      <View className="w-20 h-20 bg-layer-tertiary rounded-full items-center justify-center">
        <Text className="text-3xl">{getInitials(group.name)}</Text>
      </View>
      <Text className="text-xl">{group.name}</Text>
      <Text className="text-content-tertiary">{group.groupId}</Text>
      {isAdding ? (
        <>
          <Search options={options} onChangeText={searchUsers} className="w-72" />
        </>
      ) : (
        <Button onPress={toggle}>
          <Text className="text-black">Add members</Text>
          <AddIcon className="text-black" />
        </Button>
      )}
    </View>
  );
}
