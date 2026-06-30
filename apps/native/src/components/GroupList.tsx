import { Pressable, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { Avatar } from './avatar';
import { Icon } from './general/icon';
import { Text } from './general/text';
import { cn } from '@/utils/cn';
import { GroupOptionsDropdown } from './dropdowns/GroupOptions.dropdown';
import { type GroupListItem } from '@/hooks/useGroupList';

type Props = {
  groups?: GroupListItem[];
  emptyText?: string;
  scrollable?: boolean;
  viewerIds?: string[];
};

const GroupBadge = ({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' }) => (
  <View
    className={cn(
      'rounded-full border px-2.5 py-1',
      tone === 'accent' ? 'border-primary/30 bg-primary/10' : 'border-border bg-background/70'
    )}
  >
    <Text className={cn('text-xs font-medium', tone === 'accent' ? 'text-primary' : 'text-muted-foreground')}>
      {label}
    </Text>
  </View>
);

const formatCount = (value: number, label: string) => `${value} ${label}${value === 1 ? '' : 's'}`;

export const GroupList = ({ groups, emptyText = 'No groups found', scrollable = true, viewerIds = [] }: Props) => {
  const content =
    groups && groups.length > 0 ? (
      <View className="w-full flex-row flex-wrap gap-3">
        {groups.map((group) => {
          const isOwnedByViewer = viewerIds.includes(group.ownerId);
          const membersCount = group.members?.length ?? 0;
          const albumsCount = group.albumIds?.length ?? 0;
          const photosCount = group.photoIds?.length ?? 0;

          return (
            <View
              key={`${group.serverId}:${group.id}`}
              className="w-full md:w-[calc(50%-6px)] xl:w-[calc(33.333%-8px)]"
            >
              <View className="relative h-full">
                <View className="absolute right-3 top-3 z-10">
                  <GroupOptionsDropdown group={group} canManage={isOwnedByViewer} />
                </View>

                <Link
                  href={{ pathname: '/group/[groupId]', params: { groupId: group.id, serverId: group.serverId } }}
                  asChild
                >
                  <Pressable
                    className={cn(
                      'h-full gap-4 rounded-xl border border-border bg-layer-secondary/40 p-4 pr-14 hover:bg-layer-secondary active:bg-layer-secondary',
                      isOwnedByViewer && 'border-primary/50 bg-primary/5'
                    )}
                  >
                    <View className="flex-row items-start gap-3">
                      <Avatar alt={group.name} color={group.color ?? undefined} />

                      <View className="flex-1 gap-2">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="flex-1 text-lg leading-5">{group.name}</Text>
                          {isOwnedByViewer ? <GroupBadge label="Owned" tone="accent" /> : null}
                        </View>
                      </View>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      <GroupBadge label={formatCount(membersCount, 'member')} />
                      <GroupBadge label={formatCount(albumsCount, 'album')} />
                      <GroupBadge label={formatCount(photosCount, 'photo')} />
                    </View>

                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-row items-center gap-2">
                        <View
                          className="h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: group.color ?? 'transparent' }}
                        />
                      </View>

                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-muted-foreground">#{group.id.slice(0, 8)}</Text>
                        <Icon.NavigateNext className="text-muted-foreground" size={16} />
                      </View>
                    </View>
                  </Pressable>
                </Link>
              </View>
            </View>
          );
        })}
      </View>
    ) : (
      <View className="w-full rounded-xl border border-dashed border-border p-6">
        <Text className="text-center text-muted-foreground">{emptyText}</Text>
      </View>
    );

  if (scrollable) {
    return (
      <ScrollView className="flex-1 w-full">
        <View className="w-full p-1">{content}</View>
      </ScrollView>
    );
  }

  return <View className="w-full p-1">{content}</View>;
};
