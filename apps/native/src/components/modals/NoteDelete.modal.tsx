import { type NoteListItem } from '@/hooks/useNoteList';
import { useNoteActions } from '@/hooks/useNoteActions';
import { Text } from '../general/text';
import { DialogDescription, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';

type NoteDeleteModalProps = {
  note: Pick<NoteListItem, 'id' | 'serverId' | 'title' | 'content'>;
};

const getNoteLabel = (note: Pick<NoteListItem, 'title' | 'content'>) => {
  const title = note.title?.trim();

  if (title) {
    return title;
  }

  const preview = note.content.replace(/\s+/g, ' ').trim();
  return preview.length > 48 ? `${preview.slice(0, 48).trimEnd()}...` : preview || 'Untitled note';
};

export const NoteDeleteModal = ({ note }: NoteDeleteModalProps) => {
  const { removeNote, isPending } = useNoteActions();

  const handleRemove = () => {
    removeNote({ id: note.id, serverId: note.serverId });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete note</DialogTitle>
        <DialogDescription>This permanently deletes the note for everyone who can access this group.</DialogDescription>
      </DialogHeader>

      <Text>{getNoteLabel(note)}</Text>
      <Text className="text-sm text-muted-foreground">This action cannot be undone.</Text>

      <DialogFooter okText="Delete" onOk={handleRemove} loading={isPending} />
    </DialogContent>
  );
};
