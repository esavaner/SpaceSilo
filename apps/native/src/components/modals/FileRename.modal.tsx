import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useFileActions } from '@/hooks/useFileActions';
import { FileListItem } from '@/hooks/useFileList';
import { Button, Input, Modal, ModalButtons, ModalTitle, useModal } from '@repo/shared/components';

type FileRenameModalProps = {
  file: FileListItem;
};

type RenameForm = { newName: string };

export const FileRenameModal = ({ file }: FileRenameModalProps) => {
  const { t } = useTranslation();
  const { rename, isPending } = useFileActions();
  const { closeModal } = useModal();
  const schema = yup.object().shape({
    newName: yup.string().required(t('files.renameRequired')),
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RenameForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      newName: file.name,
    },
  });

  const onSubmit = (values: RenameForm) => {
    const lastIndexOf = file.uri.lastIndexOf(file.name);
    const newPath = file.uri.slice(0, lastIndexOf);
    rename({ fileUri: file.uri, newPath, name: values.newName, groupId: file.groupId, serverId: file.serverId });
  };

  return (
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('renameItem')}>
      <ModalTitle>{t('renameItem')}</ModalTitle>
      <Controller
        control={control}
        name="newName"
        render={({ field }) => (
          <Input
            label={t('newName')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.newName?.message}
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />
      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button onPress={handleSubmit(onSubmit)} loading={isPending}>
          {t('rename')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};
