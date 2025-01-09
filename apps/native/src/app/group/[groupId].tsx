import { Api } from '@/api/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useGlobalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@repo/ui';
import { getInitials } from '@/utils/common';

export default function SingleGroupPage() {
  const { groupId } = useGlobalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  console.log(groupId);
  const { data } = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => Api.groups.groupsControllerFindOne(groupId),
  });
  const group = data?.data;
  if (!group) {
    return (
      <View className="flex-1 bg-layer relative">
        <Text>Group not found</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-layer relative items-center justify-center gap-2">
      <View className="w-20 h-20 bg-layer-tertiary rounded-full items-center justify-center">
        <Text className="text-3xl">{getInitials(group.name)}</Text>
      </View>
      <Text className="text-xl">{group.name}</Text>
      <Text className="text-content-tertiary">{group.groupId}</Text>
    </View>
  );
}
