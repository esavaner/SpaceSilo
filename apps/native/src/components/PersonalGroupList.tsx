import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { type GroupResponse } from '@repo/shared';
import { Avatar } from './avatar';
import { Text } from './general/text';

type Props = {
  groups?: GroupResponse[];
};

export const PersonalGroupList = ({ groups }: Props) => {
  return (
    <View className="w-full p-2">
      {groups?.map((group) => (
        <Link key={group.id} href={`/group/${group.id}`} asChild>
          <Pressable className="w-full flex flex-row items-center p-2 gap-2 rounded-md hover:bg-layer-secondary active:bg-layer-secondary">
            <Avatar alt={group.name} color={group.color ?? undefined} />
            <Text>{group.name}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
};
