import { View } from 'react-native';
import { AddIcon, Button, Text, useUi } from '@repo/shared';
import { useTranslation } from 'react-i18next';
import { GroupCreateModal } from '@/components/modals/GroupCreate.modal';
import { GroupList } from '@/components/GroupList';
import { PersonalGroupList } from '@/components/PersonalGroupList';
import { useGroupList } from '@/hooks/useGroupList';

export default function GroupsPage() {
  const { t } = useTranslation();
  const { openModal } = useUi();
  const { groupsPersonal, groupsShared } = useGroupList();

  return (
    <View className="flex-1 bg-layer relative">
      <Text className="px-4 py-2">{t('Personal')}</Text>
      <PersonalGroupList groups={groupsPersonal} />
      <View className="flex-row px-4 py-2 items-center gap-4">
        <Text>{t('Shared Groups')}</Text>
        <Button onPress={() => openModal(<GroupCreateModal />)}>
          <Text className="text-black">Create</Text>
          <AddIcon className="text-black" />
        </Button>
      </View>
      <GroupList groups={groupsShared} />
    </View>
  );
}
