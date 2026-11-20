import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useFileActions } from '@/hooks/useFileActions';
import { useFilesContext } from '@/providers/FilesProvider';
import { Button, Input, Modal, ModalButtons, ModalTitle, useModal } from '@repo/shared/components';

type FileCreateFolderModalProps = {
  currentPath?: string;
};

type CreateFolderForm = {
  folder: string;
};

export const FileCreateFolderModal = ({ currentPath = '' }: FileCreateFolderModalProps) => {
  const { t } = useTranslation();
  const { create, isPending } = useFileActions();
  const { closeModal } = useModal();
  const { includedGroups } = useFilesContext();
  const schema = yup.object().shape({
    folder: yup.string().required(t('files.createFolder.validation.folderRequired')),
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateFolderForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      folder: t('files.createFolder.defaultName'),
    },
  });

  const onSubmit = (values: CreateFolderForm) => {
    const targetGroup = includedGroups[0];

    create({
      newPath: currentPath,
      name: values.folder,
      groupId: targetGroup?.id ?? '',
      serverId: targetGroup?.serverId ?? '',
    });
  };

  return (
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('files.createFolder.title')}>
      <ModalTitle>{t('files.createFolder.title')}</ModalTitle>
      <Controller
        control={control}
        name="folder"
        render={({ field }) => (
          <Input
            label={t('common.labels.folderName')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.folder?.message}
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />
      <ModalButtons>
        <Button variant="secondary" onPress={closeModal} disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button onPress={handleSubmit(onSubmit)} loading={isPending}>
          {t('files.createFolder.submit')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};
