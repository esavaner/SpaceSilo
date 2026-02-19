import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GroupCreateModal } from '@/components/modals/GroupCreate.modal';
import { GroupList } from '@/components/GroupList';
import { PersonalGroupList } from '@/components/PersonalGroupList';
import { useGroupList } from '@/hooks/useGroupList';
import { Icon } from '@/components/general/icon';
import { Button } from '@/components/general/button';
import { Text } from '@/components/general/text';
import { useUi } from '@/providers/UiProvider';

export default function GroupsPage() {
  const { t } = useTranslation();
  const { openModal } = useUi();
  const { groupsPersonal, groupsShared } = useGroupList();

  return (
    <View className="flex-1 bg-background relative">
      <Text className="px-4 py-2">{t('Personal')}</Text>
      <PersonalGroupList groups={groupsPersonal} />
      <View className="flex-row px-4 py-2 items-center gap-4">
        <Text>{t('Shared Groups')}</Text>
        <Button onPress={() => openModal(<GroupCreateModal />)}>
          <Icon.Add className="text-black" />
          <Text>Create</Text>
        </Button>
      </View>
      <GroupList groups={groupsShared} />
    </View>
  );
}
