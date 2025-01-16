import { Api } from '@/api/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useGlobalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AddIcon, Button, Search, Text, useUi } from '@repo/ui';
import { getInitials } from '@/utils/common';
import { GroupAddMembersModal } from '@/components/modals/GroupAddMembers.modal';
import { useState } from 'react';

export default function SingleGroupPage() {
  const { groupId } = useGlobalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const { openModal } = useUi();
  const [isAdding, setIsAdding] = useState(false);
  const [options, setOptions] = useState<React.ReactNode[]>([]);
  const [value, setValue] = useState<string>('');

  const toggle = () => setIsAdding((prev) => !prev);

  const { data, isLoading } = useQuery({
    queryKey: ['groups', groupId],
    queryFn: () => Api.groups.groupsControllerFindOne(groupId),
  });

  const group = data?.data;

  const onChangeText = (text: string) => {
    setValue(text);

    if (text.length < 3) {
      return;
    }
    setOptions([<Text>{text}</Text>]);
  };

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
      <Text className="text-content-tertiary">{group.groupId}</Text>
      {isAdding ? (
        <>
          <Search options={options} onChangeText={onChangeText} />
        </>
      ) : (
        <Button onPress={toggle}>
          <Text className="text-black">Add members</Text>
          <AddIcon className="text-black" />
        </Button>
      )}
    </View>
  );
}
