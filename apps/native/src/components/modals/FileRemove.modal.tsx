import { useTranslation } from 'react-i18next';
import { useFileActions } from '@/hooks/useFileActions';
import { Button, Modal, ModalButtons, ModalTitle, Text, useModal } from '@repo/shared/components';
import { FileListItem } from '@/hooks/useFileList';

type FileRemoveModalProps = {
  files: FileListItem[];
};

export const FileRemoveModal = ({ files }: FileRemoveModalProps) => {
  const { t } = useTranslation();
  const { remove, isPending } = useFileActions();
  const { closeModal } = useModal();

  const handleRemove = () => {
    files.forEach((file) => remove({ fileUri: file.uri, groupId: file.groupId, serverId: file.serverId }));
  };

  return (
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('removeItem')}>
      <ModalTitle>{t('removeItem')}</ModalTitle>
      {files.map((file) => (
        <Text key={`${file.serverId}:${file.groupId}:${file.uri}`}>{file.name}</Text>
      ))}
      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button variant="destructive" onPress={handleRemove} loading={isPending}>
          {t('remove')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};
