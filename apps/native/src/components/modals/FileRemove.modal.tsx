import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { useUi, Text, Button, ModalTitle } from '@repo/ui';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

type FileRemoveModalProps = {
  files: FileEntity[];
};

export const FileRemoveModal = ({ files }: FileRemoveModalProps) => {
  const { t } = useTranslation();
  const { toast, closeModal } = useUi();
  const queryClient = useQueryClient();

  const { mutate: removeFile } = useMutation({
    mutationKey: ['remove'],
    mutationFn: Api.files.filesControllerRemove,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File removed'); // @TODO add translations
    },
    onError: () => {
      toast.error('Error removing file'); // @TODO add translations
    },
  });

  const handleRemove = () => {
    files.forEach((file) => removeFile({ path: file.uri }));
  };

  return (
    <>
      <ModalTitle>{t('removeItem')}</ModalTitle>
      <ScrollView>
        {files.map((file) => (
          <Text key={file.uri}>{file.uri}</Text>
        ))}
      </ScrollView>
      <View className="flex-row gap-2">
        <Button onPress={closeModal} variant="outline">
          Cancel
        </Button>
        <Button onPress={handleRemove}>Remove</Button>
      </View>
    </>
  );
};
