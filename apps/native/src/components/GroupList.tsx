import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@repo/ui';
import { getInitials } from '@/utils/common';
import { Link } from 'expo-router';
import { GetGroupDto } from '@/api/generated';

type Props = {
  groups: GetGroupDto[];
};

export const GroupList = ({ groups }: Props) => {
  return (
    <ScrollView className="flex-1 w-full p-2">
      {groups.map((group) => (
        <Link key={group.id} href={`/group/${group.id}`} asChild>
          <Pressable className="w-full flex flex-row items-center p-2 gap-2 rounded-md hover:bg-layer-secondary active:bg-layer-secondary">
            <View className="w-10 h-10 bg-layer-tertiary rounded-full items-center justify-center">
              <Text>{getInitials(group.name)}</Text>
            </View>
            <Text>{group.name}</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
};
