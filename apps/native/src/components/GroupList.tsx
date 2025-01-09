import { GroupEntity } from '@/api/generated';
import { ScrollView, View } from 'react-native';
import { Text } from '@repo/ui';
import { getInitials } from '@/utils/common';
import { Link } from 'expo-router';

type Props = {
  groups: GroupEntity[];
};

export const GroupList = ({ groups }: Props) => {
  return (
    <ScrollView className="flex-1 w-full p-2">
      {groups.map((group) => (
        <Link
          key={group.id}
          href={`/group/${group.groupId}`}
          className="flex flex-row items-center p-2 gap-2 rounded-md hover:bg-layer-secondary"
        >
          <View className="w-10 h-10 bg-layer-tertiary rounded-full items-center justify-center">
            <Text>{getInitials(group.name)}</Text>
          </View>
          <Text>{group.name}</Text>
        </Link>
      ))}
    </ScrollView>
  );
};
