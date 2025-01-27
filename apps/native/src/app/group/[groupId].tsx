import { Api } from '@/api/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useGlobalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AddIcon, Avatar, Button, Text, useUi } from '@repo/ui';
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
      <Avatar alt={group.name} size="lg" />
      <Text className="text-xl">{group.name}</Text>
      <Text className="text-content-tertiary">{group.id}</Text>
      <Button onPress={() => openModal(<GroupAddMembersModal group={group} />)}>
        <Text className="text-black">Add members</Text>
        <AddIcon className="text-black" />
      </Button>
      <View className="p-2 gap-2">
        {group.members.map((member) => (
          <Pressable
            key={member.userId}
            className="flex-row items-center gap-2 p-4 h-min rounded-md bg-layer-secondary hover:bg-layer-tertiary active:bg-layer-tertiary"
          >
            <Avatar alt={member.user.name} />
            <View>
              <Text>{member.user.name}</Text>
              <Text>{member.user.email}</Text>
            </View>
            <Text>{member.access}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
