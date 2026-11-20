import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { Plus, Search } from 'lucide-react-native';
import { Button, Input, Text, theme, useModal, useThemeColors } from '@repo/shared/components';
import { GroupCreateModal } from '@/components/modals/GroupCreate.modal';
import { GroupList } from '@/components/GroupList';
import { useGroupList } from '@/hooks/useGroupList';
import { GroupFilterDropdown, type GroupFilter } from '@/components/dropdowns/GroupFilter.dropdown';
import { BaseLayout } from '@/components/base-layout';
import { useServerContext } from '@/providers/ServerProvider';
import { type GroupListItem } from '@/hooks/useGroupList';

const Page = styled.View`
  gap: ${theme.spacing[600]};
`;

const Header = styled.View`
  gap: ${theme.spacing[300]};
  z-index: ${theme.zIndex.raised};
`;

const HeadingRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[300]};
`;

const Heading = styled.View`
  flex: 1;
  gap: ${theme.spacing[100]};
`;

const Filters = styled.View`
  gap: ${theme.spacing[300]};
  padding: ${theme.spacing[300]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
  background-color: ${theme.colors.surface.medium};
  z-index: ${theme.zIndex.raised};
`;

export default function GroupsPage() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { openModal } = useModal();
  const { servers } = useServerContext();
  const { groups, isGroupsLoading } = useGroupList();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<GroupFilter>('all');

  const viewerIds = servers
    .map((server) => server.client.account?.id)
    .filter((value): value is string => Boolean(value));
  const normalizedQuery = query.trim().toLowerCase();

  const matchesFilters = (group: GroupListItem) => {
    const isOwned = viewerIds.includes(group.ownerId);
    const hasMembers = (group.members?.length ?? 0) > 0;
    const matchesSearch =
      normalizedQuery.length === 0 ||
      group.name.toLowerCase().includes(normalizedQuery) ||
      group.id.toLowerCase().includes(normalizedQuery) ||
      (group.color?.toLowerCase().includes(normalizedQuery) ?? false);

    if (!matchesSearch) {
      return false;
    }

    switch (filter) {
      case 'owned':
        return isOwned;
      case 'personal':
        return Boolean(group.personal);
      case 'shared':
        return !group.personal;
      case 'with-members':
        return hasMembers;
      default:
        return true;
    }
  };

  const visibleGroups = [...(groups ?? [])]
    .filter(matchesFilters)
    .sort((left, right) => Number(Boolean(right.personal)) - Number(Boolean(left.personal)));
  const visibleGroupCount = visibleGroups.length;

  return (
    <BaseLayout>
      <Page>
        <Header>
          <HeadingRow>
            <Heading>
              <Text.H1>{t('navigation.groups')}</Text.H1>
              <Text color={theme.colors.text.secondary}>
                {isGroupsLoading
                  ? t('groups.loading')
                  : `${visibleGroupCount} ${t('common.nouns.groups')} ${t('common.labels.inView')}`}
              </Text>
            </Heading>

            <Button onPress={() => openModal(<GroupCreateModal />)}>
              <Plus color={colors.text.inverted} size={18} aria-hidden />
              {t('groups.actions.create')}
            </Button>
          </HeadingRow>

          <Filters>
              <Input
                value={query}
                onChangeText={setQuery}
                label={t('groups.searchPlaceholder')}
                hideLabel
                placeholder={t('groups.searchPlaceholder')}
                leftIcon={<Search color={colors.text.secondary} size={16} aria-hidden />}
              />

            <GroupFilterDropdown value={filter} onChange={setFilter} />
          </Filters>
        </Header>

        <GroupList
          groups={visibleGroups}
          viewerIds={viewerIds}
          scrollable={false}
          emptyText={t('groups.emptyFiltered')}
        />
      </Page>
    </BaseLayout>
  );
}
