import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GroupCreateModal } from '@/components/modals/GroupCreate.modal';
import { GroupList } from '@/components/GroupList';
import { useGroupList } from '@/hooks/useGroupList';
import { GroupFilterDropdown, type GroupFilter } from '@/components/dropdowns/GroupFilter.dropdown';
import { Icon } from '@/components/general/icon';
import { Button } from '@/components/general/button';
import { Text } from '@/components/general/text';
import { Input } from '@/components/form/input';
import { useUi } from '@/providers/UiProvider';
import { BaseLayout } from '@/components/base-layout';
import { useServerContext } from '@/providers/ServerProvider';
import { type GroupListItem } from '@/hooks/useGroupList';

export default function GroupsPage() {
  const { t } = useTranslation();
  const { openModal } = useUi();
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
      <View className="gap-6">
        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text variant="h1">{t('Groups')}</Text>
              <Text className="text-muted-foreground">
                {isGroupsLoading ? 'Loading groups...' : `${visibleGroupCount} groups in view`}
              </Text>
            </View>

            <Button onPress={() => openModal(<GroupCreateModal />)}>
              <Icon.Add className="text-black" />
              <Text>Create</Text>
            </Button>
          </View>

          <View className="gap-3 rounded-xl border border-border bg-layer-secondary/30 p-3">
            <View className="flex-row items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Icon.Search className="text-muted-foreground" size={16} />
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Search groups or ids"
                className="flex-1 border-0 bg-transparent px-0"
              />
            </View>

            <View className="flex-row flex-wrap items-center gap-2">
              <GroupFilterDropdown value={filter} onChange={setFilter} />
            </View>
          </View>
        </View>

        <GroupList
          groups={visibleGroups}
          viewerIds={viewerIds}
          scrollable={false}
          emptyText="No groups match the current filters"
        />
      </View>
    </BaseLayout>
  );
}
