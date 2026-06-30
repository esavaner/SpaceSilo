import { type GroupListItem } from '@/hooks/useGroupList';
import { type NoteListItem } from '@/hooks/useNoteList';
import { useUi } from '@/providers/UiProvider';
import { ScrollView, View } from 'react-native';
import { Button } from '../general/button';
import { Icon } from '../general/icon';
import { Text } from '../general/text';
import { NoteDeleteModal } from './NoteDelete.modal';
import { NoteEditorModal } from './NoteEditor.modal';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';

type NoteDetailsModalProps = {
  note: NoteListItem;
  groups: GroupListItem[];
  groupName: string;
  serverLabel: string;
};

const formatDate = (value: Date | string) => new Date(value).toLocaleString();

const getTitle = (note: Pick<NoteListItem, 'title' | 'content'>) => {
  const title = note.title?.trim();

  if (title) {
    return title;
  }

  const [firstLine] = note.content.split(/\r?\n/);
  const preview = firstLine?.trim() || 'Untitled note';
  return preview.length > 64 ? `${preview.slice(0, 64).trimEnd()}...` : preview;
};

export const NoteDetailsModal = ({ note, groups, groupName, serverLabel }: NoteDetailsModalProps) => {
  const { openModal } = useUi();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{getTitle(note)}</DialogTitle>
        <DialogDescription>
          Shared via {groupName} on {serverLabel}
        </DialogDescription>
      </DialogHeader>

      <View className="flex-row flex-wrap gap-2">
        <View className="rounded-full border border-border bg-layer-secondary/40 px-3 py-1.5">
          <Text className="text-sm text-muted-foreground">Updated {formatDate(note.updatedAt)}</Text>
        </View>
        <View className="rounded-full border border-border bg-layer-secondary/40 px-3 py-1.5">
          <Text className="text-sm text-muted-foreground">Created {formatDate(note.createdAt)}</Text>
        </View>
      </View>

      <ScrollView style={{ maxHeight: 320 }} className="rounded-xl border border-border bg-layer-secondary/30 p-4">
        <Text className="leading-6">{note.content}</Text>
      </ScrollView>

      <View className="flex-row flex-wrap justify-end gap-2">
        <Button variant="outline" onPress={() => openModal(<NoteEditorModal note={note} groups={groups} />)}>
          <Icon.Edit />
          <Text>Edit</Text>
        </Button>
        <Button variant="destructive" onPress={() => openModal(<NoteDeleteModal note={note} />)}>
          <Icon.Trash />
          <Text>Delete</Text>
        </Button>
      </View>
    </DialogContent>
  );
};
