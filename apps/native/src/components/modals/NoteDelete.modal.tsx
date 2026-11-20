import { type NoteListItem } from '@/hooks/useNoteList';
import { useNoteActions } from '@/hooks/useNoteActions';
import { Button, Modal, ModalButtons, ModalTitle, Text, theme, useModal } from '@repo/shared/components';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';

const Description = styled(Text.S)`
  color: ${theme.colors.text.secondary};
`;

type NoteDeleteModalProps = {
  note: Pick<NoteListItem, 'id' | 'serverId' | 'title' | 'content'>;
};

const getNoteLabel = (note: Pick<NoteListItem, 'title' | 'content'>, untitledLabel: string) => {
  const title = note.title?.trim();

  if (title) {
    return title;
  }

  const preview = note.content.replace(/\s+/g, ' ').trim();
  return preview.length > 48 ? `${preview.slice(0, 48).trimEnd()}...` : preview || untitledLabel;
};

export const NoteDeleteModal = ({ note }: NoteDeleteModalProps) => {
  const { t } = useTranslation();
  const { removeNote, isPending } = useNoteActions();
  const { closeModal } = useModal();

  const handleRemove = () => {
    removeNote({ id: note.id, serverId: note.serverId });
  };

  return (
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel="Delete note">
      <ModalTitle>Delete note</ModalTitle>
      <Description>This permanently deletes the note for everyone who can access this group.</Description>
      <Text>{getNoteLabel(note, t('notes.details.untitled'))}</Text>
      <Description>This action cannot be undone.</Description>
      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button variant="destructive" onPress={handleRemove} loading={isPending}>
          Delete
        </Button>
      </ModalButtons>
    </Modal>
  );
};
