import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import {
  Button,
  DropdownOption,
  Icon,
  Input,
  ListRow,
  Modal,
  ModalButtons,
  ModalTitle,
  Select,
  Text,
  theme,
  useModal,
  useThemeColors,
} from '@repo/shared/components';
import { type AddGroupMemberRequest, type GroupResponse, type UserResponse } from '@repo/shared';
import { useGroupActions } from '@/hooks/useGroupActions';
import { type GroupListItem } from '@/hooks/useGroupList';
import { useUserSearch } from '@/hooks/useUserSearch';

type AccessLevel = NonNullable<AddGroupMemberRequest['access']>;
type SearchUserResult = Pick<UserResponse, 'id' | 'email' | 'name'>;
type ExistingGroupMember = NonNullable<GroupResponse['members']>[number] & { user?: SearchUserResult };
type GroupWithMembers = Omit<GroupResponse, 'members'> & {
  members?: ExistingGroupMember[];
  serverId?: GroupListItem['serverId'];
};
type SelectedUser = SearchUserResult & Required<Pick<AddGroupMemberRequest, 'userId'>> & { access: AccessLevel };

type Props = {
  group: GroupWithMembers;
};

const MemberName = styled(Text.M)`
  flex: 1;
`;

const MemberActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[200]};
`;

const AccessField = styled.View`
  width: 130px;
`;

const ResultDetails = styled.View`
  flex: 1;
`;

export const GroupAddMembersModal = ({ group }: Props) => {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const colors = useThemeColors();
  const { addMembers, isPending } = useGroupActions();
  const { query, resetSearch, results, searchUsers } = useUserSearch(group.serverId);
  const existingMembers = group.members ?? [];
  const [selectedMembers, setSelectedMembers] = useState<SelectedUser[]>([]);
  const accessOptions = [
    { label: t('groups.membersModal.levels.admin'), value: 'admin' },
    { label: t('groups.membersModal.levels.edit'), value: 'edit' },
    { label: t('groups.membersModal.levels.read'), value: 'read' },
  ] as const satisfies { label: string; value: AccessLevel }[];

  const handleSelect = (user: SearchUserResult) => {
    setSelectedMembers((current) => [...current, { ...user, userId: user.id, access: 'read' }]);
    resetSearch();
  };

  const handleSubmit = () => {
    addMembers({
      id: group.id,
      serverId: group.serverId,
      members: selectedMembers.map((member) => ({ userId: member.userId, access: member.access })),
    });
  };

  const options = results.filter(
    (user) =>
      !selectedMembers.some((member) => member.id === user.id) &&
      !existingMembers.some((member) => member.userId === user.id)
  );

  return (
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('groups.membersModal.title')}>
      <ModalTitle>{t('groups.membersModal.title')}</ModalTitle>
      {selectedMembers.length > 0 && <Text.S>{`${selectedMembers.length} ${t('common.nouns.members')}`}</Text.S>}
      {selectedMembers.map((member) => (
        <ListRow
          key={member.id}
          bordered={false}
          title={<MemberName>{member.name}</MemberName>}
          trailing={
            <MemberActions>
              <AccessField>
                <Select
                  label={t('groups.membersModal.access')}
                  hideLabel
                  closeLabel={t('common.actions.close')}
                  value={member.access}
                  options={accessOptions}
                  onOptionChange={(option) => {
                    const access = accessOptions.find((item) => item.value === option.value);
                    if (access) {
                      setSelectedMembers((current) =>
                        current.map((item) => (item.id === member.id ? { ...item, access: access.value } : item))
                      );
                    }
                  }}
                />
              </AccessField>
              <Button
                variant="tertiary"
                size="small"
                accessibilityLabel={t('groups.details.removeMember', { name: member.name })}
                onPress={() => setSelectedMembers((current) => current.filter((item) => item.id !== member.id))}
              >
                <Icon.X size={18} color={colors.text.brand} aria-hidden />
              </Button>
            </MemberActions>
          }
        />
      ))}
      <Input hideLabel label={t('common.labels.search')} value={query} onChangeText={searchUsers} />
      {options.map((user) => (
        <DropdownOption
          key={user.id}
          role="button"
          accessibilityLabel={`${user.name}, ${user.email}`}
          onPress={() => handleSelect(user)}
        >
          <Icon.Users size={20} color={colors.text.default} aria-hidden />
          <ResultDetails>
            <Text.M>{user.name}</Text.M>
            <Text.S color={theme.colors.text.secondary}>{user.email}</Text.S>
          </ResultDetails>
        </DropdownOption>
      ))}
      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button onPress={handleSubmit} loading={isPending}>
          {t('common.actions.add')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};
