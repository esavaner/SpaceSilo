import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { useUi, Modal, Text, Button } from '@repo/ui';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

type FileRemoveModalProps = {
  id: string;
  files: FileEntity[];
};

export const FileRemoveModal = ({ id, files }: FileRemoveModalProps) => {
  const { t } = useTranslation();
  const { setCurrentModal, toast } = useUi();
  const queryClient = useQueryClient();

  const { mutate: removeFile } = useMutation({
    mutationKey: ['remove'],
    mutationFn: Api.files.filesControllerRemove,
    onSuccess: () => {
      setCurrentModal(undefined);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File removed'); // @TODO add translations
    },
  });

  const handleCancel = () => {
    setCurrentModal(undefined);
  };

  const handleRemove = () => {
    files.forEach((file) => removeFile({ path: file.uri }));
  };

  return (
    <Modal id={id} title={t('removeItem')}>
      <ScrollView>
        {files.map((file) => (
          <Text key={file.uri}>{file.name}</Text>
        ))}
      </ScrollView>
      <Button variant="primary" onPress={handleCancel}>
        Cancel
      </Button>
      <Button variant="primary" onPress={handleRemove}>
        Remove
      </Button>
    </Modal>
  );
};
