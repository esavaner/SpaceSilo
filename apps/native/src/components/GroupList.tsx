import { Pressable, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { type GroupResponse } from '@repo/shared';
import { Avatar } from './avatar';
import { Text } from './general/text';

type Props = {
  groups?: GroupResponse[];
  scrollable?: boolean;
};

export const GroupList = ({ groups, scrollable = true }: Props) => {
  const content = groups?.map((group) => (
    <Link key={group.id} href={`/group/${group.id}`} asChild>
      <Pressable className="w-full flex flex-row items-center p-2 gap-2 rounded-md hover:bg-layer-secondary active:bg-layer-secondary">
        <Avatar alt={group.name} color={group.color ?? undefined} />
        <Text>{group.name}</Text>
      </Pressable>
    </Link>
  ));

  if (scrollable) {
    return <ScrollView className="flex-1 w-full p-2">{content}</ScrollView>;
  }

  return <View className="w-full p-2">{content}</View>;
};
