import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { BaseLayout } from '@/components/base-layout';
import {
  NativeSelectScrollView,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/form/select';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { Input } from '@/components/form/input';
import { NoteDetailsModal } from '@/components/modals/NoteDetails.modal';
import { NoteDeleteModal } from '@/components/modals/NoteDelete.modal';
import { NoteEditorModal } from '@/components/modals/NoteEditor.modal';
import { type GroupListItem, useGroupList } from '@/hooks/useGroupList';
import { type NoteListItem, useNoteList } from '@/hooks/useNoteList';
import { useServerContext } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';

const getNoteTitle = (note: Pick<NoteListItem, 'title' | 'content'>) => {
  const title = note.title?.trim();

  if (title) {
    return title;
  }

  const [firstLine] = note.content.split(/\r?\n/);
  const preview = firstLine?.trim() || 'Untitled note';
  return preview.length > 72 ? `${preview.slice(0, 72).trimEnd()}...` : preview;
};

const getNotePreview = (content: string) => {
  const collapsed = content.replace(/\s+/g, ' ').trim();

  if (collapsed.length <= 180) {
    return collapsed;
  }

  return `${collapsed.slice(0, 180).trimEnd()}...`;
};

const formatUpdatedAt = (value: Date | string) => new Date(value).toLocaleString();

const getGroupLookupKey = (
  noteOrGroup: Pick<NoteListItem, 'groupId' | 'serverId'> | Pick<GroupListItem, 'id' | 'serverId'>
) =>
  'groupId' in noteOrGroup
    ? `${noteOrGroup.serverId}:${noteOrGroup.groupId}`
    : `${noteOrGroup.serverId}:${noteOrGroup.id}`;

export default function NotesPage() {
  const { width } = useWindowDimensions();
  const { openModal } = useUi();
  const { allServers, servers } = useServerContext();
  const { notes, isNotesLoading } = useNoteList();
  const { groups, isGroupsLoading } = useGroupList();
  const [query, setQuery] = useState('');
  const [selectedServerId, setSelectedServerId] = useState<string>('all');

  const groupLookup = new Map(groups.map((group) => [getGroupLookupKey(group), group]));
  const serverLookup = new Map(allServers.map((server) => [server.id, server]));
  const serverFilterOptions = [
    { value: 'all', label: 'All active servers' },
    ...servers.map((server) => ({ value: server.id, label: server.label })),
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const columnCount = width > 1480 ? 4 : width > 1120 ? 3 : width > 720 ? 2 : 1;
  const availableWidth = Math.min(Math.max(width - 32, 280), 1280);
  const columnGap = 12;
  const cardWidth = columnCount === 1 ? availableWidth : (availableWidth - columnGap * (columnCount - 1)) / columnCount;

  const visibleNotes = notes.filter((note) => {
    if (selectedServerId !== 'all' && note.serverId !== selectedServerId) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const group = groupLookup.get(getGroupLookupKey(note));
    const serverLabel = serverLookup.get(note.serverId)?.label ?? '';

    return [getNoteTitle(note), note.content, group?.name ?? '', serverLabel].some((value) =>
      value.toLowerCase().includes(normalizedQuery)
    );
  });

  const openCreateModal = () => {
    openModal(
      <NoteEditorModal
        groups={groups}
        serverLabels={Object.fromEntries(allServers.map((server) => [server.id, server.label]))}
      />
    );
  };

  const openDetailsModal = (note: NoteListItem) => {
    const group = groupLookup.get(getGroupLookupKey(note));
    const serverLabel = serverLookup.get(note.serverId)?.label ?? 'Connected server';

    openModal(
      <NoteDetailsModal
        note={note}
        groups={groups}
        groupName={group?.name ?? 'Unknown group'}
        serverLabel={serverLabel}
      />
    );
  };

  const openEditModal = (note: NoteListItem) => {
    openModal(<NoteEditorModal note={note} groups={groups} />);
  };

  const openDeleteModal = (note: NoteListItem) => {
    openModal(<NoteDeleteModal note={note} />);
  };

  return (
    <BaseLayout>
      <View className="gap-6 pb-8">
        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text variant="h1">Notes</Text>
              <Text className="text-muted-foreground">
                {isNotesLoading || isGroupsLoading ? 'Loading notes...' : `${visibleNotes.length} notes in view`}
              </Text>
            </View>

            <Button onPress={openCreateModal} disabled={groups.length === 0}>
              <Icon.Add className="text-black" />
              <Text>New note</Text>
            </Button>
          </View>

          <View className="gap-3 rounded-xl border border-border bg-layer-secondary/30 p-3">
            <View className="flex-row items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Icon.Search className="text-muted-foreground" size={16} />
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Search notes, content, groups, or servers"
                className="flex-1 border-0 bg-transparent px-0"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm text-muted-foreground">Filter by server</Text>
              <Select
                value={serverFilterOptions.find((option) => option.value === selectedServerId)}
                onValueChange={(option) => setSelectedServerId(option?.value ?? 'all')}
                disabled={servers.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All active servers" />
                </SelectTrigger>
                <SelectContent>
                  <NativeSelectScrollView>
                    {serverFilterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} label={option.label} />
                    ))}
                  </NativeSelectScrollView>
                </SelectContent>
              </Select>
            </View>
          </View>
        </View>

        {servers.length === 0 ? (
          <View className="gap-3 rounded-2xl border border-dashed border-border p-6">
            <Text variant="h3">No active servers</Text>
            <Text className="text-muted-foreground">Connect a server before creating or syncing notes.</Text>
          </View>
        ) : isNotesLoading || isGroupsLoading ? (
          <View className="rounded-2xl border border-border bg-layer-secondary/30 p-6">
            <Text className="text-muted-foreground">Loading notes and groups...</Text>
          </View>
        ) : visibleNotes.length === 0 ? (
          <View className="gap-3 rounded-2xl border border-dashed border-border p-6">
            <Text variant="h3">{query.trim() ? 'No matching notes' : 'No notes yet'}</Text>
            <Text className="text-muted-foreground">
              {query.trim()
                ? 'Try a different search query.'
                : 'Create a note in your personal group or share one with a group.'}
            </Text>
            {!query.trim() ? (
              <Button onPress={openCreateModal} className="self-start" disabled={groups.length === 0}>
                <Icon.Add className="text-black" />
                <Text>Create your first note</Text>
              </Button>
            ) : null}
          </View>
        ) : (
          <View className="flex-row flex-wrap items-start gap-3">
            {visibleNotes.map((note) => {
              const group = groupLookup.get(getGroupLookupKey(note));
              const serverLabel = serverLookup.get(note.serverId)?.label ?? 'Connected server';

              return (
                <View
                  key={`${note.serverId}:${note.id}`}
                  className="rounded-2xl border border-border bg-layer-secondary/40 p-4"
                  style={{ width: cardWidth }}
                >
                  <View className="flex-row items-start gap-3">
                    <Pressable className="flex-1 gap-3" onPress={() => openDetailsModal(note)}>
                      <View className="gap-2">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="text-lg font-semibold">{getNoteTitle(note)}</Text>
                          <View className="rounded-full border border-border bg-background px-2.5 py-1">
                            <Text className="text-xs text-muted-foreground">{group?.name ?? 'Unknown group'}</Text>
                          </View>
                          <View className="rounded-full border border-border bg-background px-2.5 py-1">
                            <Text className="text-xs text-muted-foreground">{serverLabel}</Text>
                          </View>
                        </View>

                        <Text className="text-sm leading-6 text-muted-foreground" numberOfLines={3}>
                          {getNotePreview(note.content)}
                        </Text>
                      </View>

                      <Text className="text-xs text-muted-foreground">Updated {formatUpdatedAt(note.updatedAt)}</Text>
                    </Pressable>

                    <View className="gap-2">
                      <Button variant="ghost" size="icon" onPress={() => openDetailsModal(note)}>
                        <Icon.File />
                      </Button>
                      <Button variant="ghost" size="icon" onPress={() => openEditModal(note)}>
                        <Icon.Edit />
                      </Button>
                      <Button variant="ghost" size="icon" onPress={() => openDeleteModal(note)}>
                        <Icon.Trash />
                      </Button>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </BaseLayout>
  );
}
