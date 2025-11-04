import { AddMemberDto, SearchUserDto, GetGroupDto, AccessLevel } from '@/api/generated';
import { useGroupActions } from '@/hooks/useGroupActions';

import { useTranslation } from 'react-i18next';
import { ButtonGroup } from './ButtonGroup';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { Text } from '../text';
import { Button } from '../button';
import { DropdownItem } from '../dropdown';
import { UserGroupIcon, CloseIcon } from '../icons';
import { ModalLayout, ModalTitle } from '../modal-components';
import { Search } from '../search';
import { Select } from '../select';

const selectOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Edit', value: 'edit' },
  { label: 'Read', value: 'read' },
];

type SelectedUser = SearchUserDto & AddMemberDto;

type Props = {
  group: GetGroupDto;
};

export const GroupAddMembersModal = ({ group }: Props) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { addMembers } = useGroupActions();
  const { query, resetSearch, results, searchUsers } = useUserSearch();

  const [selectedMembers, setSelectedMembers] = useState<SelectedUser[]>([]);

  const handleSelect = (user: SearchUserDto) => {
    setSelectedMembers([...selectedMembers, { ...user, userId: user.id, access: AccessLevel.Read }]);
    resetSearch();
  };

  const handleDeselect = (user: SearchUserDto) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
  };

  const handleSubmit = () => {
    addMembers({ id: group.id, members: selectedMembers.map((m) => ({ userId: m.userId, access: m.access })) });
  };

  console.log(group.members);

  const options = results
    .filter(
      (user) =>
        !selectedMembers.find((member) => member.id === user.id) && !group.members.find((m) => m.userId === user.id)
    )
    .map((user) => (
      <DropdownItem
        key={user.id}
        label={user.name}
        subLabel={user.email}
        icon={<UserGroupIcon />}
        onPress={() => handleSelect(user)}
      />
    ));

  return (
    <ModalLayout className="w-full">
      <ModalTitle>{t('addMembers')}</ModalTitle>
      {selectedMembers.length > 0 && (
        <View className="flex-row gap-2 p-2">
          <Text>{selectedMembers.length}</Text>
          <Text>Access</Text>
          <Text>Remove</Text>
        </View>
      )}
      <ScrollView className="h-max-96">
        {selectedMembers.map((member) => (
          <View key={member.id} className="flex-row items-center gap-2 p-2">
            <Text className="flex-1">{member.name}</Text>
            <Select options={selectOptions} onChange={(value) => {}} value={member.access} />
            <Button onPress={() => handleDeselect(member)} variant="icon">
              <CloseIcon />
            </Button>
          </View>
        ))}
      </ScrollView>
      <Search options={options} value={query} onChangeText={searchUsers} className="w-72" />
      {/* @TODO */}
      <ButtonGroup okText={t('Add')} onCancel={closeModal} onOk={handleSubmit} className="z-[-2]" />
    </ModalLayout>
  );
};
