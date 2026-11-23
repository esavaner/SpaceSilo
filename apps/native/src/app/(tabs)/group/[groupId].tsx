import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, View, type ViewProps } from 'react-native';
import styled from 'styled-components/native';
import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownOption,
  EmptyState,
  Icon,
  ListRow,
  Text,
  theme,
  useModal,
  useThemeColors,
} from '@repo/shared/components';
import { GroupEditModal } from '@/components/modals/GroupEdit.modal';
import { GroupAddMembersModal } from '@/components/modals/GroupAddMembers.modal';
import { GroupRemoveModal } from '@/components/modals/GroupRemove.modal';
import { BaseLayout } from '@/components/base-layout';
import { useGroupActions } from '@/hooks/useGroupActions';
import { useServerContext } from '@/providers/ServerProvider';
import { type AddGroupMemberRequest, type GroupResponse, type UserResponse } from '@repo/shared';
import { useTranslation } from 'react-i18next';

type AccessLevel = NonNullable<AddGroupMemberRequest['access']>;
type GroupMemberWithUser = NonNullable<GroupResponse['members']>[number] & {
  user: Pick<UserResponse, 'id' | 'email' | 'name'>;
};

type GroupDetail = Omit<GroupResponse, 'members'> & {
  serverId: string;
  members: GroupMemberWithUser[];
};

const Stack = styled.View`
  gap: ${theme.spacing[400]};
`;
const Card = styled.View`
  gap: ${theme.spacing[400]};
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[400]};
  background-color: ${theme.colors.surface.medium};
`;
const HeaderRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing[400]};
`;
const Heading = styled.View`
  flex: 1;
  gap: ${theme.spacing[200]};
`;
const Row = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing[200]};
`;
const Chip = styled.View<{ $accent?: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[200]};
  padding: ${theme.spacing[150]} ${theme.spacing[300]};
  border: ${theme.borderWeight[25]} solid
    ${({ $accent }) => ($accent ? theme.colors.border.primary.default : theme.colors.border.default)};
  border-radius: ${theme.radius.full};
  background-color: ${({ $accent }) => ($accent ? theme.colors.success.default : theme.colors.surface.default)};
`;
const ColorSwatch = styled.View<{ $color: string }>`
  width: 12px;
  height: 12px;
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius.full};
  background-color: ${({ $color }) => $color};
`;
const Members = styled.View`
  gap: ${theme.spacing[300]};
`;
const MembersHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[300]};
`;
const SummaryChip = ({ label, accent = false }: { label: string; accent?: boolean }) => (
  <Chip $accent={accent}>
    <Text.S color={accent ? theme.colors.text.brand : theme.colors.text.secondary}>{label}</Text.S>
  </Chip>
);

const AccessSelect = ({ value, onChange }: { value: AccessLevel; onChange: (value: AccessLevel) => void }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const accessOptions = [
    { label: t('groups.membersModal.levels.admin'), value: 'admin' },
    { label: t('groups.membersModal.levels.edit'), value: 'edit' },
    { label: t('groups.membersModal.levels.read'), value: 'read' },
  ] as const satisfies { label: string; value: AccessLevel }[];
  const selectedLabel =
    accessOptions.find((option) => option.value === value)?.label ?? t('groups.membersModal.levels.read');

  return (
    <DropdownMenu
      label={t('groups.membersModal.access')}
      closeLabel={t('common.actions.close')}
      trigger={({ isOpen, toggle, menuId }) => (
        <Button
          variant="secondary"
          size="small"
          accessibilityLabel={`${t('groups.membersModal.access')}: ${selectedLabel}`}
          accessibilityState={{ expanded: isOpen }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onPress={toggle}
        >
          {selectedLabel}
          <Icon.ChevronDown size={18} color={colors.text.default} aria-hidden />
        </Button>
      )}
    >
      {({ close, menuId }) => (
        <View
          nativeID={menuId}
          role={(Platform.OS === 'web' ? 'listbox' : 'list') as ViewProps['role']}
          accessibilityLabel={t('groups.membersModal.access')}
        >
          {accessOptions.map((option) => (
            <DropdownOption
              key={option.value}
              role="option"
              accessibilityState={{ selected: option.value === value }}
              aria-selected={option.value === value}
              $selected={option.value === value}
              onPress={() => {
                close();
                onChange(option.value);
              }}
            >
              <Text.S>{option.label}</Text.S>
              {option.value === value && <Icon.Check size={18} color={colors.text.default} aria-hidden />}
            </DropdownOption>
          ))}
        </View>
      )}
    </DropdownMenu>
  );
};

export default function SingleGroupPage() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { groupId, serverId } = useLocalSearchParams<{ groupId: string; serverId?: string }>();
  const { allServers } = useServerContext();
  const { openModal } = useModal();
  const { removeMember, updateMember, isPending } = useGroupActions();

  const getServerById = (id?: string) => (id ? allServers.find((server) => server.id === id) : undefined);

  const { data: group, isLoading } = useQuery<GroupDetail | null>({
    queryKey: ['groups', groupId, serverId],
    enabled: Boolean(groupId),
    queryFn: async () => {
      if (!groupId) {
        return null;
      }

      const directServer = getServerById(serverId);
      if (directServer) {
        const result = (await directServer.client.groups.findOne(groupId)) as GroupResponse & {
          members?: GroupMemberWithUser[];
        };
        return { ...result, members: result.members ?? [], serverId: directServer.id };
      }

      for (const server of allServers) {
        try {
          const result = (await server.client.groups.findOne(groupId)) as GroupResponse & {
            members?: GroupMemberWithUser[];
          };
          return { ...result, members: result.members ?? [], serverId: server.id };
        } catch {
          continue;
        }
      }

      return null;
    },
  });

  const currentServer = getServerById(group?.serverId ?? serverId);
  const currentUserId = currentServer?.client.account?.id;
  const isOwner = Boolean(group && currentUserId && group.ownerId === currentUserId);

  const handleAccessChange = (member: GroupMemberWithUser, access: AccessLevel) => {
    if (!group) {
      return;
    }

    updateMember({ id: group.id, serverId: group.serverId, userId: member.userId, access });
  };

  const handleRemoveMember = (member: GroupMemberWithUser) => {
    if (!group) {
      return;
    }

    removeMember({ id: group.id, serverId: group.serverId, userId: member.userId });
  };

  if (isLoading) {
    return (
      <BaseLayout>
        <Text color={theme.colors.text.secondary}>{t('groups.details.loading')}</Text>
      </BaseLayout>
    );
  }

  if (!group) {
    return (
      <BaseLayout>
        <Stack>
          <Text.H2>{t('groups.details.Err.NotFound')}</Text.H2>
          <Button variant="secondary" onPress={() => router.replace('/groups')}>
            <Icon.ArrowLeft size={18} color={colors.text.default} aria-hidden />
            {t('groups.details.backToGroups')}
          </Button>
        </Stack>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      header={
        <Button variant="tertiary" onPress={() => router.replace('/groups')}>
          <Icon.ArrowLeft size={18} color={colors.text.brand} aria-hidden />
          {t('groups.details.backToGroups')}
        </Button>
      }
    >
      <Card>
        <HeaderRow>
          <Avatar alt={group.name} size="lg" color={group.color ?? undefined} />

          <Heading>
            <Row>
              <Text.H2>{group.name}</Text.H2>
              {isOwner ? <SummaryChip label={t('groups.details.ownedByYou')} accent /> : null}
              {group.personal ? (
                <SummaryChip label={t('groups.filters.personal')} />
              ) : (
                <SummaryChip label={t('groups.details.shared')} />
              )}
            </Row>

            <Text color={theme.colors.text.secondary}>#{group.id}</Text>
          </Heading>
        </HeaderRow>

        <Row>
          <SummaryChip label={`${group.members.length} ${t('common.nouns.members')}`} />
          <SummaryChip label={`${group.albumIds?.length ?? 0} ${t('common.nouns.albums')}`} />
          <SummaryChip label={`${group.photoIds?.length ?? 0} ${t('common.nouns.photos')}`} />
          <Chip>
            <ColorSwatch $color={group.color ?? 'transparent'} />
            <Text.S color={theme.colors.text.secondary}>{t('groups.details.color')}</Text.S>
          </Chip>
        </Row>

        {isOwner ? (
          <Row>
            <Button onPress={() => openModal(<GroupAddMembersModal group={group} />)}>
              <Icon.Plus size={18} color={colors.text.inverted} aria-hidden />
              {t('groups.membersModal.title')}
            </Button>
            <Button variant="secondary" onPress={() => openModal(<GroupEditModal group={group} />)}>
              <Icon.PenLine size={18} color={colors.text.default} aria-hidden />
              {t('groups.details.editGroup')}
            </Button>
            <Button
              variant="destructive"
              onPress={() => openModal(<GroupRemoveModal group={group} onRemoved={() => router.replace('/groups')} />)}
            >
              <Icon.Trash size={18} color={colors.text.inverted} aria-hidden />
              {t('groups.details.removeGroup')}
            </Button>
          </Row>
        ) : null}
      </Card>

      <Members>
        <MembersHeader>
          <Text.H3>{t('groups.details.members')}</Text.H3>
          <Text color={theme.colors.text.secondary}>{group.members.length}</Text>
        </MembersHeader>

        {group.members.length === 0 ? (
          <EmptyState description={t('groups.details.emptyMembers')} />
        ) : (
          <Members>
            {group.members.map((member, index) => {
              const memberIsOwner = member.userId === group.ownerId;

              return (
                <ListRow
                  key={member.userId}
                  style={{ zIndex: group.members.length - index }}
                  leading={<Avatar alt={member.user.name ?? member.user.email} />}
                  title={
                    <Row>
                      <Text weight={500}>{member.user.name ?? member.user.email}</Text>
                      {memberIsOwner ? <SummaryChip label={t('groups.details.owner')} accent /> : null}
                    </Row>
                  }
                  description={member.user.email}
                  trailing={
                    isOwner && !memberIsOwner ? (
                      <Row>
                        <AccessSelect value={member.access} onChange={(value) => handleAccessChange(member, value)} />
                        <Button
                          variant="tertiary"
                          size="small"
                          disabled={isPending}
                          accessibilityLabel={t('groups.details.removeMember', {
                            name: member.user.name ?? member.user.email,
                          })}
                          onPress={() => handleRemoveMember(member)}
                        >
                          <Icon.Trash
                            size={18}
                            color={isPending ? colors.text.disabled : colors.text.brand}
                            aria-hidden
                          />
                        </Button>
                      </Row>
                    ) : (
                      <SummaryChip
                        label={memberIsOwner ? t('groups.details.fullAccess') : member.access}
                        accent={memberIsOwner}
                      />
                    )
                  }
                />
              );
            })}
          </Members>
        )}
      </Members>
    </BaseLayout>
  );
}
