import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/dropdowns/dropdown';
import { GroupEditModal } from '@/components/modals/GroupEdit.modal';
import { GroupAddMembersModal } from '@/components/modals/GroupAddMembers.modal';
import { GroupRemoveModal } from '@/components/modals/GroupRemove.modal';
import { BaseLayout } from '@/components/base-layout';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { useGroupActions } from '@/hooks/useGroupActions';
import { useServerContext } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { cn } from '@/utils/cn';
import { type AddGroupMemberRequest, type GroupResponse, type UserResponse } from '@repo/shared';

type AccessLevel = NonNullable<AddGroupMemberRequest['access']>;
type GroupMemberWithUser = NonNullable<GroupResponse['members']>[number] & {
  user: Pick<UserResponse, 'id' | 'email' | 'name'>;
};

type GroupDetail = Omit<GroupResponse, 'members'> & {
  serverId: string;
  members: GroupMemberWithUser[];
};

const accessOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Edit', value: 'edit' },
  { label: 'Read', value: 'read' },
] as const satisfies { label: string; value: AccessLevel }[];

const SummaryChip = ({ label, accent = false }: { label: string; accent?: boolean }) => (
  <View
    className={cn(
      'rounded-full border px-3 py-1.5',
      accent ? 'border-primary/30 bg-primary/10' : 'border-border bg-background'
    )}
  >
    <Text className={cn('text-sm', accent ? 'text-primary' : 'text-muted-foreground')}>{label}</Text>
  </View>
);

const AccessSelect = ({ value, onChange }: { value: AccessLevel; onChange: (value: AccessLevel) => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="outline" size="sm">
        <Text>{accessOptions.find((option) => option.value === value)?.label ?? 'Read'}</Text>
        <Icon.ChevronDown />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuRadioGroup value={value} onValueChange={(nextValue) => onChange(nextValue as AccessLevel)}>
        {accessOptions.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value}>
            <Text>{option.label}</Text>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function SingleGroupPage() {
  const { groupId, serverId } = useLocalSearchParams<{ groupId: string; serverId?: string }>();
  const { allServers } = useServerContext();
  const { openModal } = useUi();
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
        <Text className="text-muted-foreground">Loading group...</Text>
      </BaseLayout>
    );
  }

  if (!group) {
    return (
      <BaseLayout>
        <View className="gap-4">
          <Text variant="h2">Group not found</Text>
          <Button variant="outline" onPress={() => router.replace('/groups')}>
            <Icon.NavigateNext className="rotate-180" />
            <Text>Back to groups</Text>
          </Button>
        </View>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <View className="gap-6 pb-8">
        <Button variant="ghost" className="self-start px-0" onPress={() => router.replace('/groups')}>
          <Icon.NavigateNext className="rotate-180" />
          <Text>Back to groups</Text>
        </Button>

        <View className="gap-4 rounded-2xl border border-border bg-layer-secondary/40 p-5">
          <View className="flex-row items-start gap-4">
            <Avatar alt={group.name} size="lg" color={group.color ?? undefined} />

            <View className="flex-1 gap-2">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text variant="h2">{group.name}</Text>
                {isOwner ? <SummaryChip label="Owned by you" accent /> : null}
                {group.personal ? <SummaryChip label="Personal" /> : <SummaryChip label="Shared" />}
              </View>

              <Text className="text-muted-foreground">#{group.id}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <SummaryChip label={`${group.members.length} member${group.members.length === 1 ? '' : 's'}`} />
            <SummaryChip
              label={`${group.albumIds?.length ?? 0} album${(group.albumIds?.length ?? 0) === 1 ? '' : 's'}`}
            />
            <SummaryChip
              label={`${group.photoIds?.length ?? 0} photo${(group.photoIds?.length ?? 0) === 1 ? '' : 's'}`}
            />
            <View className="rounded-full border border-border bg-background px-3 py-1.5">
              <View className="flex-row items-center gap-2">
                <View
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: group.color ?? 'transparent' }}
                />
                <Text className="text-sm text-muted-foreground">Color</Text>
              </View>
            </View>
          </View>

          {isOwner ? (
            <View className="flex-row flex-wrap gap-2">
              <Button onPress={() => openModal(<GroupAddMembersModal group={group} />)}>
                <Icon.Add />
                <Text>Add members</Text>
              </Button>
              <Button variant="outline" onPress={() => openModal(<GroupEditModal group={group} />)}>
                <Icon.Edit />
                <Text>Edit group</Text>
              </Button>
              <Button
                variant="destructive"
                onPress={() =>
                  openModal(<GroupRemoveModal group={group} onRemoved={() => router.replace('/groups')} />)
                }
              >
                <Icon.Trash />
                <Text>Remove group</Text>
              </Button>
            </View>
          ) : null}
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="h3">Members</Text>
            <Text className="text-muted-foreground">{group.members.length}</Text>
          </View>

          {group.members.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border p-6">
              <Text className="text-center text-muted-foreground">No additional members yet</Text>
            </View>
          ) : (
            <View className="gap-3">
              {group.members.map((member) => {
                const memberIsOwner = member.userId === group.ownerId;

                return (
                  <Pressable
                    key={member.userId}
                    className="flex-row items-center gap-3 rounded-xl border border-border bg-layer-secondary/40 p-4"
                  >
                    <Avatar alt={member.user.name ?? member.user.email} />

                    <View className="flex-1 gap-1">
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Text className="text-base font-medium">{member.user.name ?? member.user.email}</Text>
                        {memberIsOwner ? <SummaryChip label="Owner" accent /> : null}
                      </View>
                      <Text className="text-sm text-muted-foreground">{member.user.email}</Text>
                    </View>

                    {isOwner && !memberIsOwner ? (
                      <View className="flex-row items-center gap-2">
                        <AccessSelect value={member.access} onChange={(value) => handleAccessChange(member, value)} />
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onPress={() => handleRemoveMember(member)}
                        >
                          <Icon.Trash />
                        </Button>
                      </View>
                    ) : (
                      <SummaryChip label={memberIsOwner ? 'Full access' : member.access} accent={memberIsOwner} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </BaseLayout>
  );
}
