import { View } from 'react-native';
import { AddIcon, Button, Text, useUi } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Api } from '@/api/api';
import { GroupCreateModal } from '@/components/modals/GroupCreate.modal';

export default function GroupsPage() {
  const { t } = useTranslation();
  const { openModal } = useUi();
  const { data } = useQuery({
    queryKey: ['groups'],
    queryFn: Api.groups.groupsControllerFindAll,
  });

  return (
    <View className="flex-1 bg-layer relative">
      <Text>Groups</Text>
      <Button onPress={() => openModal(<GroupCreateModal />)} className="">
        <Text className="text-black">Create</Text>
        <AddIcon className="text-black" />
      </Button>
    </View>
  );
}
