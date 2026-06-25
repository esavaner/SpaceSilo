// import { AddMemberDto, SearchUserDto, GetGroupDto, AccessLevel } from '@/api/generated';
import { useGroupActions } from '@/hooks/useGroupActions';

import { useTranslation } from 'react-i18next';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../general/text';
import { Button } from '../general/button';
import { Icon } from '../general/icon';
import { Search } from '../search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../dropdowns/dropdown';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';
import { type AddGroupMemberRequest, type GroupResponse, type UserResponse } from '@repo/shared';

type AccessLevel = NonNullable<AddGroupMemberRequest['access']>;
type SearchUserResult = Pick<UserResponse, 'id' | 'email' | 'name'>;
type GroupMemberWithUser = NonNullable<GroupResponse['members']>[number] & { user: SearchUserResult };
type GroupWithMembers = Omit<GroupResponse, 'members'> & { members: GroupMemberWithUser[] };
type SelectedUser = SearchUserResult & Required<Pick<AddGroupMemberRequest, 'userId'>> & { access: AccessLevel };

const selectOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Edit', value: 'edit' },
  { label: 'Read', value: 'read' },
] as const satisfies { label: string; value: AccessLevel }[];

type Props = {
  group: GroupWithMembers;
};

const AccessSelect = ({ value, onChange }: { value: AccessLevel; onChange: (value: AccessLevel) => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="outline">
        <Text>{selectOptions.find((option) => option.value === value)?.label ?? 'Read'}</Text>
        <Icon.ChevronDown />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuRadioGroup value={value} onValueChange={(nextValue) => onChange(nextValue as AccessLevel)}>
        {selectOptions.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value}>
            <Text>{option.label}</Text>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const GroupAddMembersModal = ({ group }: Props) => {
  const { t } = useTranslation();
  const { addMembers, isPending } = useGroupActions();
  const { query, resetSearch, results, searchUsers } = useUserSearch();

  const [selectedMembers, setSelectedMembers] = useState<SelectedUser[]>([]);

  const handleSelect = (user: SearchUserResult) => {
    setSelectedMembers([...selectedMembers, { ...user, userId: user.id, access: 'read' }]);
    resetSearch();
  };

  const handleDeselect = (user: SearchUserResult) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id));
  };

  const handleAccessChange = (memberId: string, access: AccessLevel) => {
    setSelectedMembers((current) => current.map((member) => (member.id === memberId ? { ...member, access } : member)));
  };

  const handleSubmit = () => {
    addMembers({ id: group.id, members: selectedMembers.map((m) => ({ userId: m.userId, access: m.access })) });
  };

  const options = results
    .filter(
      (user) =>
        !selectedMembers.find((member) => member.id === user.id) &&
        !group.members.find((member) => member.userId === user.id)
    )
    .map((user) => (
      <Pressable
        key={user.id}
        onPress={() => handleSelect(user)}
        className="flex-row items-center gap-5 px-4 py-3 hover:bg-background active:bg-background"
      >
        <Icon.UserGroup />
        <View>
          <Text>{user.name}</Text>
          <Text className="text-sm text-muted-foreground">{user.email}</Text>
        </View>
      </Pressable>
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
            <AccessSelect value={member.access} onChange={(value) => handleAccessChange(member.id, value)} />
            <Button onPress={() => handleDeselect(member)} variant="ghost" className="p-2">
              <Icon.Close />
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
