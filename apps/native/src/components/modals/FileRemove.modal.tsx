import { FileEntity } from '@/api/generated';
import { useUi, Text, ModalTitle } from '@repo/ui';
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
    files.forEach((file) => remove({ path: file.uri }));
  };

  return (
    <>
      <ModalTitle>{t('removeItem')}</ModalTitle>
      <ScrollView>
        {files.map((file) => (
          <Text key={file.uri}>{file.uri}</Text>
        ))}
      </ScrollView>
      <ButtonGroup okText={t('remove')} onOk={handleRemove} onCancel={closeModal} />
    </>
  );
};
