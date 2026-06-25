import { useQuery } from '@tanstack/react-query';
import { useGlobalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { GroupAddMembersModal } from '@/components/modals/GroupAddMembers.modal';
import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/general/icon';
import { useUi } from '@/providers/UiProvider';
import { Text } from '@/components/general/text';
import { Button } from '@/components/general/button';
import { type GroupResponse, type UserResponse } from '@repo/shared';

type GroupMemberWithUser = NonNullable<GroupResponse['members']>[number] & {
  user: Pick<UserResponse, 'id' | 'email' | 'name'>;
};

type GroupWithMembers = Omit<GroupResponse, 'members'> & {
  members: GroupMemberWithUser[];
};

type GroupQueryResponse = {
  data: GroupWithMembers | null;
};

export default function SingleGroupPage() {
  const { groupId } = useGlobalSearchParams<{ groupId: string }>();
  const { openModal } = useUi();

  const { data, isLoading } = useQuery<GroupQueryResponse>({
    queryKey: ['groups', groupId],
    queryFn: () => ({ data: null }), // TODO: implement API call to get group by ID
  });

  const group = data?.data;

  if (isLoading) {
    return;
  }

  if (!group) {
    return (
      <View className="flex-1 bg-background relative">
        <Text>Group not found</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-background relative items-center gap-2 p-4">
      <Avatar alt={group.name} size="lg" color={group.color ?? undefined} />
      <Text className="text-xl">{group.name}</Text>
      <Text className="text-muted-foreground">{group.id}</Text>
      <Button onPress={() => openModal(<GroupAddMembersModal group={group} />)}>
        <Icon.Add />
        <Text>Add members</Text>
      </Button>
      <View className="p-2 gap-2">
        {group.members.map((member) => (
          <Pressable
            key={member.userId}
            className="flex-row items-center gap-2 p-4 h-min rounded-md bg-layer-secondary hover:bg-layer-tertiary active:bg-layer-tertiary"
          >
            <Avatar alt={member.user.name ?? undefined} />
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
