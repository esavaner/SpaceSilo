import { AddMembersDto, AddMemberDto, SearchUserDto, Role } from '@/api/generated';
import { useGroupActions } from '@/hooks/useGroupActions';
import { Shape } from '@/utils/types';
import {
  ModalTitle,
  Search,
  useUi,
  Text,
  DropdownItem,
  UserGroupIcon,
  Button,
  CloseIcon,
  Checkbox,
  ModalLayout,
} from '@repo/ui';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { ButtonGroup } from './ButtonGroup';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

const schema = yup.object<Shape<AddMembersDto>>({
  members: yup.array().of(yup.string().required('Member is required')),
});

type SelectedUser = SearchUserDto & AddMemberDto;

export const GroupAddMembersModal = () => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { addMembers } = useGroupActions();
  const { isSearchLoading, query, resetSearch, results, searchUsers } = useUserSearch();

  const [selectedMembers, setSelectedMembers] = useState<SelectedUser[]>([]);

  const handleSelect = (user: SearchUserDto) => {
    setSelectedMembers([...selectedMembers, { ...user, userId: user.id, access: 'read' }]);
    resetSearch();
  };

  const handleDeselect = (user: SearchUserDto) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
  };

  const handleSubmit = () => {
    console.log(selectedMembers);
  };

  const options = results
    .filter((user) => !selectedMembers.find((member) => member.id === user.id))
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
      <View className="flex-row gap-2 p-2">
        <Text>{selectedMembers.length}</Text>
        <Text>Admin</Text>
        <Text>Write</Text>
        <Text>Delete</Text>
        <Text>Remove</Text>
      </View>
      <ScrollView className="h-max-96">
        {selectedMembers.map((member) => (
          <View key={member.id} className="flex-row items-center gap-2 p-2">
            <Text className="flex-1">{member.name}</Text>
            <Button onPress={() => handleDeselect(member)} variant="icon">
              <CloseIcon />
            </Button>
          </View>
        ))}
      </ScrollView>
      <Search options={options} value={query} onChangeText={searchUsers} className="w-72" />
      <ButtonGroup okText={t('Add')} onCancel={closeModal} onOk={handleSubmit} className="-z-10" />
    </ModalLayout>
  );
};
