import { useGroupActions } from '@/hooks/useGroupActions';
import { type GroupListItem } from '@/hooks/useGroupList';
import { useTranslation } from 'react-i18next';
import { Button, Modal, ModalButtons, ModalTitle, Text, theme, useModal } from '@repo/shared/components';

type GroupRemoveModalProps = {
  group: Pick<GroupListItem, 'id' | 'name' | 'serverId'>;
  onRemoved?: () => void;
};

export const GroupRemoveModal = ({ group, onRemoved }: GroupRemoveModalProps) => {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const { removeGroup, isPending } = useGroupActions();

  const handleRemove = () => {
    removeGroup(
      { id: group.id, serverId: group.serverId },
      {
        onSuccess: () => onRemoved?.(),
      }
    );
  };

  return (
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('groups.details.removeGroup')}>
      <ModalTitle>{t('groups.details.removeGroup')}</ModalTitle>
      <Text.S color={theme.colors.text.secondary}>{t('groups.removeModal.description')}</Text.S>
      <Text>{group.name}</Text>
      <Text.S color={theme.colors.text.secondary}>#{group.id}</Text.S>
      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button variant="destructive" onPress={handleRemove} loading={isPending}>
          {t('common.actions.remove')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};
