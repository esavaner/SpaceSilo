import { type GroupListItem } from '@/hooks/useGroupList';
import { type NoteListItem } from '@/hooks/useNoteList';
import { useNoteActions } from '@/hooks/useNoteActions';
import { toast } from '@repo/shared/toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal, ModalButtons, ModalTitle, Select, Text, Textarea, theme, useModal } from '@repo/shared/components';
import styled from 'styled-components/native';

const Field = styled.View`
  gap: ${theme.spacing[200]};
`;

const Description = styled(Text.S)`
  color: ${theme.colors.text.secondary};
`;

const NoGroups = styled.View`
  padding: ${theme.spacing[400]};
  border: ${theme.borderWeight[25]} dashed ${theme.colors.border.default};
  border-radius: ${theme.radius[300]};
`;

const NoteTextarea = styled(Textarea)`
  min-height: 180px;
  padding-top: ${theme.spacing[300]};
`;

type NoteEditorModalProps = {
  groups: GroupListItem[];
  note?: NoteListItem;
  serverLabels?: Record<string, string>;
};

export const NoteEditorModal = ({ groups, note, serverLabels = {} }: NoteEditorModalProps) => {
  const { t } = useTranslation();
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
  const { closeModal } = useModal();

  const selectedGroup = availableGroups.find((group) => group.id === selectedGroupId) ?? null;
  const isEditing = Boolean(note);
  const hasMultipleServers = new Set(availableGroups.map((group) => group.serverId)).size > 1;

  const getGroupLabel = (group: GroupListItem) => {
    const parts = [group.name];

    if (group.personal) {
      parts.push(t('common.labels.personal'));
    }

    if (hasMultipleServers) {
      parts.push(serverLabels[group.serverId] ?? group.serverId);
    }

    return parts.join(' · ');
  };

  const handleSubmit = () => {
    const trimmedContent = content.trim();

    if (!selectedGroup) {
      toast.error(t('notes.errors.groupRequired'));
      return;
    }

    if (!trimmedContent) {
      toast.error(t('api.notes.contentRequired'));
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
    <Modal
      closeLabel={t('common.actions.close')}
      accessibilityLabel={isEditing ? t('notes.editor.titleEdit') : t('notes.editor.titleCreate')}
    >
      <ModalTitle>{isEditing ? t('notes.editor.titleEdit') : t('notes.editor.titleCreate')}</ModalTitle>
      <Description>
        {isEditing ? t('notes.editor.descriptionEdit') : t('notes.editor.descriptionCreate')}
      </Description>

      <Field>
        <Input
          label={t('common.labels.title')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('notes.editor.optionalTitle')}
          autoFocus={!isEditing}
        />
      </Field>

      <Field>
        {availableGroups.length === 0 ? (
          <NoGroups>
            <Description>{t('notes.editor.noAccessibleGroups')}</Description>
          </NoGroups>
        ) : (
          <Select
            label={t('common.labels.belongsTo')}
            placeholder={t('notes.editor.selectGroup')}
            closeLabel={t('common.actions.close')}
            options={availableGroups.map((group) => ({ value: group.id, label: getGroupLabel(group) }))}
            value={selectedGroup?.id}
            onValueChange={setSelectedGroupId}
          />
        )}
      </Field>

      <Field>
        <NoteTextarea
          label={t('common.labels.content')}
          value={content}
          onChangeText={setContent}
          placeholder={t('notes.editor.writeHere')}
          numberOfLines={10}
        />
      </Field>

      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button onPress={handleSubmit} loading={isPending}>
          {isEditing ? t('notes.editor.save') : t('notes.editor.create')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};
