// import { AddMemberDto, SearchUserDto, GetGroupDto, AccessLevel } from '@/api/generated';
import { useGroupActions } from '@/hooks/useGroupActions';

import { useTranslation } from 'react-i18next';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '../general/text';
import { Button } from '../general/button';
import { DropdownItem } from '../dropdown';
import { UserGroupIcon, CloseIcon } from '../icons';
import { Search } from '../search';
import { Select } from '../select';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';

const selectOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Edit', value: 'edit' },
  { label: 'Read', value: 'read' },
];

type SelectedUser = any;

type Props = {
  group: any;
};

export const GroupAddMembersModal = ({ group }: Props) => {
  const { t } = useTranslation();
  const { addMembers, isPending } = useGroupActions();
  const { query, resetSearch, results, searchUsers } = useUserSearch();

  const [selectedMembers, setSelectedMembers] = useState<SelectedUser[]>([]);

  const handleSelect = (user: any) => {
    setSelectedMembers([...selectedMembers, { ...user, userId: user.id, access: 'read' }]);
    resetSearch();
  };

  const handleDeselect = (user: any) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
  };

  const handleSubmit = () => {
    addMembers({ id: group.id, members: selectedMembers.map((m) => ({ userId: m.userId, access: m.access })) });
  };

  console.log(group.members);

  const options = results
    .filter(
      (user: any) =>
        !selectedMembers.find((member) => member.id === user.id) &&
        !group.members.find((m: any) => m.userId === user.id)
    )
    .map((user: any) => (
      <DropdownItem
        key={user.id}
        label={user.name}
        subLabel={user.email}
        icon={<UserGroupIcon />}
        onPress={() => handleSelect(user)}
      />
    ));

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('addMembers')}</DialogTitle>
      </DialogHeader>
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
            <Button onPress={() => handleDeselect(member)} variant="ghost" className="p-2">
              <CloseIcon />
            </Button>
          </View>
        ))}
      </ScrollView>
      <Search options={options} value={query} onChangeText={searchUsers} className="w-72" />
      {/* @TODO */}
      <DialogFooter okText={t('Add')} onOk={handleSubmit} loading={isPending} className="z-[-2]" />
    </DialogContent>
  );
};
