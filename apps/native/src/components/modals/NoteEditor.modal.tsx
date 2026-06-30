import { type GroupListItem } from '@/hooks/useGroupList';
import { type NoteListItem } from '@/hooks/useNoteList';
import {
  NativeSelectScrollView,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/form/select';
import { useNoteActions } from '@/hooks/useNoteActions';
import { toast } from '@/lib/toast';
import { useState } from 'react';
import { View } from 'react-native';
import { Input } from '../form/input';
import { Text } from '../general/text';
import { DialogDescription, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';

type NoteEditorModalProps = {
  groups: GroupListItem[];
  note?: NoteListItem;
  serverLabels?: Record<string, string>;
};

export const NoteEditorModal = ({ groups, note, serverLabels = {} }: NoteEditorModalProps) => {
  const availableGroups = [...(note ? groups.filter((group) => group.serverId === note.serverId) : groups)].sort(
    (left, right) => {
      const personalDifference = Number(Boolean(right.personal)) - Number(Boolean(left.personal));

      if (personalDifference !== 0) {
        return personalDifference;
      }

      return left.name.localeCompare(right.name);
    }
  );
  const preferredCreateGroup = availableGroups.find((group) => group.personal) ?? availableGroups[0] ?? null;
  const initialGroupId = note?.groupId ?? preferredCreateGroup?.id ?? '';
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);
  const { createNote, updateNote, isPending } = useNoteActions();

  const selectedGroup = availableGroups.find((group) => group.id === selectedGroupId) ?? null;
  const isEditing = Boolean(note);
  const hasMultipleServers = new Set(availableGroups.map((group) => group.serverId)).size > 1;

  const getGroupLabel = (group: GroupListItem) => {
    const parts = [group.name];

    if (group.personal) {
      parts.push('Personal');
    }

    if (hasMultipleServers) {
      parts.push(serverLabels[group.serverId] ?? group.serverId);
    }

    return parts.join(' · ');
  };

  const handleSubmit = () => {
    const trimmedContent = content.trim();

    if (!selectedGroup) {
      toast.error('Select a group first');
      return;
    }

    if (!trimmedContent) {
      toast.error('Note content is required');
      return;
    }

    if (note) {
      updateNote({
        id: note.id,
        serverId: note.serverId,
        groupId: selectedGroup.id,
        title,
        content: trimmedContent,
      });
      return;
    }

    createNote({
      serverId: selectedGroup.serverId,
      groupId: selectedGroup.id,
      title,
      content: trimmedContent,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit note' : 'Create note'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update the note content and move it to another group on the same server if needed.'
            : 'Choose which group owns this note. Personal groups stay selected by default.'}
        </DialogDescription>
      </DialogHeader>

      <View className="gap-2">
        <Text>Title</Text>
        <Input value={title} onChangeText={setTitle} placeholder="Optional note title" autoFocus={!isEditing} />
      </View>

      <View className="gap-2">
        <Text>Belongs to</Text>
        {availableGroups.length === 0 ? (
          <View className="rounded-xl border border-dashed border-border p-4">
            <Text className="text-sm text-muted-foreground">No accessible groups are available for this note.</Text>
          </View>
        ) : (
          <Select
            value={selectedGroup ? { value: selectedGroup.id, label: getGroupLabel(selectedGroup) } : undefined}
            onValueChange={(option) => setSelectedGroupId(option?.value ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              <NativeSelectScrollView>
                {availableGroups.map((group) => (
                  <SelectItem key={`${group.serverId}:${group.id}`} value={group.id} label={getGroupLabel(group)} />
                ))}
              </NativeSelectScrollView>
            </SelectContent>
          </Select>
        )}
      </View>

      <View className="gap-2">
        <Text>Content</Text>
        <Input
          value={content}
          onChangeText={setContent}
          placeholder="Write the note here"
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          className="min-h-[180px] py-3"
        />
      </View>

      <DialogFooter okText={isEditing ? 'Save' : 'Create'} onOk={handleSubmit} loading={isPending} />
    </DialogContent>
  );
};
