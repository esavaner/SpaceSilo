import { FileEntity } from '@/api/generated';
import { useUi, Text, ModalTitle, ModalLayout } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { ButtonGroup } from './ButtonGroup';
import { useFileActions } from '@/hooks/useFileActions';

type FileRemoveModalProps = {
  files: FileEntity[];
};

export const FileRemoveModal = ({ files }: FileRemoveModalProps) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { remove } = useFileActions();

  const handleRemove = () => {
    files.forEach((file) => remove({ fileUri: file.uri }));
  };

  return (
    <ModalLayout>
      <ModalTitle>{t('removeItem')}</ModalTitle>
      <ScrollView className="mb-4">
        {files.map((file) => (
          <Text key={file.uri}>{file.name}</Text>
        ))}
      </ScrollView>
      <ButtonGroup okText={t('remove')} onOk={handleRemove} onCancel={closeModal} />
    </ModalLayout>
  );
};
