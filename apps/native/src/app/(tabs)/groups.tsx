import { View } from 'react-native';
import { AddIcon, Button, Text, useUi } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Api } from '@/api/api';
import { GroupCreateModal } from '@/components/modals/GroupCreate.modal';
import { GroupList } from '@/components/GroupList';
import { GetGroupDto } from '@/api/generated';
import { PersonalGroupList } from '@/components/PersonalGroupList';

export default function GroupsPage() {
  const { t } = useTranslation();
  const { openModal } = useUi();
  const { data } = useQuery({
    queryKey: ['groups'],
    queryFn: Api.groups.groupsControllerFindAll,
  });

  const response = data?.data || [];
  const groups = response.filter((group: GetGroupDto) => !group.personal);
  const personal = response.filter((group: GetGroupDto) => group.personal);

  return (
    <View className="flex-1 bg-layer relative">
      <PersonalGroupList groups={personal} />
      <View className="flex-row px-4 py-2 items-center justify-between border-b border-b-content">
        <Text>{t('groups.groups')}</Text>
        <Button onPress={() => openModal(<GroupCreateModal />)}>
          <Text className="text-black">Create</Text>
          <AddIcon className="text-black" />
        </Button>
      </View>
      <GroupList groups={groups} />
    </View>
  );
}
