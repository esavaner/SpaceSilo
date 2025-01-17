import { AddMembersDto, SearchUserEntity } from '@/api/generated';
import { useGroupActions } from '@/hooks/useGroupActions';
import { Shape } from '@/utils/types';
import { ModalTitle, Search, useUi, Text, DropdownItem, UserGroupIcon, Button, CloseIcon, Checkbox } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { ButtonGroup } from './ButtonGroup';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

const schema = yup.object<Shape<AddMembersDto>>({
  members: yup.array().of(yup.string().required('Member is required')),
});

export const GroupAddMembersModal = () => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { addMembers } = useGroupActions();
  const { isSearchLoading, query, resetSearch, results, searchUsers } = useUserSearch();

  const [selectedMembers, setSelectedMembers] = useState<SearchUserEntity[]>([]);

  const handleSelect = (user: SearchUserEntity) => {
    setSelectedMembers([...selectedMembers, user]);
    resetSearch();
  };

  const handleDeselect = (user: SearchUserEntity) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== user.id));
  };

  const options = results
    .filter((user) => !selectedMembers.includes(user))
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
    <>
      <ModalTitle>{t('addMembers')}</ModalTitle>
      <View className="flex-row gap-2 p-2">
        <Text>{selectedMembers.length}</Text>
        <Text>Admin</Text>
        <Text>Write</Text>
        <Text>Delete</Text>
        <Text>Remove</Text>
      </View>
      <ScrollView className="h-max-96">
        {selectedMembers.map((user) => (
          <View key={user.id} className="flex-row items-center gap-2 p-2">
            <Text className="flex-1">{user.name}</Text>
            <Checkbox checked={false} />
            <Checkbox checked={true} />
            <Checkbox checked={true} />
            <Button onPress={() => handleDeselect(user)} variant="icon">
              <CloseIcon />
            </Button>
          </View>
        ))}
      </ScrollView>
      <Search options={options} value={query} onChangeText={searchUsers} className="w-72" />
      <ButtonGroup okText={t('Add')} onCancel={closeModal} onOk={() => null} className="-z-10" />
    </>
  );
};
