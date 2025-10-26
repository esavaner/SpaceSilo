import { Pressable, ScrollView, View } from 'react-native';
import { Avatar, Text } from '@repo/shared';
import { Link } from 'expo-router';
import { GetGroupDto } from '@/api/generated';

type Props = {
  groups: GetGroupDto[];
};

export const PersonalGroupList = ({ groups }: Props) => {
  return (
    <View className="w-full p-2">
      {groups.map((group) => (
        <Link key={group.id} href={`/group/${group.id}`} asChild>
          <Pressable className="w-full flex flex-row items-center p-2 gap-2 rounded-md hover:bg-layer-secondary active:bg-layer-secondary">
            <Avatar alt={group.name} color={group.color} />
            <Text>{group.name}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
};
