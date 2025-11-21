import { FileEntity } from '@/api/generated';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useFileActions } from '@/hooks/useFileActions';
import { Text } from '../general/text';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';

type FileRemoveModalProps = {
  files: FileEntity[];
};

export const FileRemoveModal = ({ files }: FileRemoveModalProps) => {
  const { t } = useTranslation();
  const { remove, isPending } = useFileActions();

  const handleRemove = () => {
    files.forEach((file) => remove({ fileUri: file.uri, groupId: file.groupId }));
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('removeItem')}</DialogTitle>
      </DialogHeader>
      <ScrollView className="mb-4">
        {files.map((file) => (
          <Text key={file.uri}>{file.name}</Text>
        ))}
      </ScrollView>
      <DialogFooter okText={t('remove')} onOk={handleRemove} loading={isPending} />
    </DialogContent>
  );
};
