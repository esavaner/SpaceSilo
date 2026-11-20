import { type GroupListItem } from '@/hooks/useGroupList';
import { type NoteListItem } from '@/hooks/useNoteList';
import { Button, Modal, ModalButtons, ModalTitle, Text, theme, useModal, useThemeColors } from '@repo/shared/components';
import { Pencil, Trash2 } from 'lucide-react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { NoteDeleteModal } from './NoteDelete.modal';
import { NoteEditorModal } from './NoteEditor.modal';

type NoteDetailsModalProps = {
  note: NoteListItem;
  groups: GroupListItem[];
  groupName: string;
  serverLabel: string;
};

const Metadata = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${theme.spacing[200]};
`;

const MetadataItem = styled.View`
  padding: ${theme.spacing[100]} ${theme.spacing[300]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius.full};
  background-color: ${theme.colors.surface.medium};
`;

const MetadataText = styled(Text.S)`
  color: ${theme.colors.text.secondary};
`;

const NoteContent = styled.ScrollView`
  max-height: 320px;
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} solid ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
  background-color: ${theme.colors.surface.medium};
`;

const formatDate = (value: Date | string, language: string) => new Date(value).toLocaleString(language);

const getTitle = (note: Pick<NoteListItem, 'title' | 'content'>, untitledLabel: string) => {
  const title = note.title?.trim();

  if (title) {
    return title;
  }

  const [firstLine] = note.content.split(/\r?\n/);
  const preview = firstLine?.trim() || untitledLabel;
  return preview.length > 64 ? `${preview.slice(0, 64).trimEnd()}...` : preview;
};

export const NoteDetailsModal = ({ note, groups, groupName, serverLabel }: NoteDetailsModalProps) => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { openModal } = useModal();
  const title = getTitle(note, t('notes.details.untitled'));

  return (
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={title}>
      <ModalTitle>{title}</ModalTitle>
      <Text.S color={colors.text.secondary}>{`Shared via ${groupName} on ${serverLabel}`}</Text.S>
      <Metadata>
        <MetadataItem>
          <MetadataText>{t('notes.details.updated', { value: formatDate(note.updatedAt, i18n.language) })}</MetadataText>
        </MetadataItem>
        <MetadataItem>
          <MetadataText>{`Created ${formatDate(note.createdAt, i18n.language)}`}</MetadataText>
        </MetadataItem>
      </Metadata>
      <NoteContent>
        <Text.L>{note.content}</Text.L>
      </NoteContent>
      <ModalButtons style={{ justifyContent: 'flex-end' }}>
        <Button
          variant="tertiary"
          onPress={() => openModal(<NoteEditorModal note={note} groups={groups} />)}
        >
          <Pencil size={18} color={colors.text.brand} />
          {t('common.actions.edit')}
        </Button>
        <Button variant="destructive" onPress={() => openModal(<NoteDeleteModal note={note} />)}>
          <Trash2 size={18} color={colors.text.inverted} />
          Delete
        </Button>
      </ModalButtons>
    </Modal>
  );
};
