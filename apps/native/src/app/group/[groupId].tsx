import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useGlobalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { GroupAddMembersModal } from '@/components/modals/GroupAddMembers.modal';
import { Avatar } from '@/components/avatar';
import { AddIcon } from '@/components/icons';
import { useUi } from '@/providers/UiProvider';
import { Text } from '@/components/general/text';
import { Button } from '@/components/general/button';

export default function SingleGroupPage() {
  const { groupId } = useGlobalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const { openModal } = useUi();

  const { data, isLoading } = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => ({ data: [] }) as any, // TODO: implement API call to get group by ID
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
      <Avatar alt={group.name} size="lg" color={group.color} />
      <Text className="text-xl">{group.name}</Text>
      <Text className="text-muted-foreground">{group.id}</Text>
      <Button onPress={() => openModal(<GroupAddMembersModal group={group} />)}>
        <AddIcon className="text-primary-foreground" />
        <Text>Add members</Text>
      </Button>
      <View className="p-2 gap-2">
        {group.members.map((member: any) => (
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
