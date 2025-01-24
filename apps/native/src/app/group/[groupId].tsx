import { Api } from '@/api/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useGlobalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AddIcon, Button, Text, useUi } from '@repo/ui';
import { getInitials } from '@/utils/common';
import { GroupAddMembersModal } from '@/components/modals/GroupAddMembers.modal';

export default function SingleGroupPage() {
  const { groupId } = useGlobalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const { openModal } = useUi();

  const { data, isLoading } = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => Api.groups.groupsControllerFindOne(groupId),
  });

  const group = data?.data;

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
      <Text className="text-content-tertiary">{group.id}</Text>
      <Button onPress={() => openModal(<GroupAddMembersModal groupId={groupId} />)}>
        <Text className="text-black">Add members</Text>
        <AddIcon className="text-black" />
      </Button>
      <View>
        {group.members.map((member) => (
          <View key={member.userId} className="flex-row items-center gap-2 p-2">
            <Text className="flex-1">{member.userId}</Text>
            <Text>{member.access}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
