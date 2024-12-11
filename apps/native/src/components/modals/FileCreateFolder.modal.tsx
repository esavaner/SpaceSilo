import { Input, ModalTitle, useUi } from '@repo/ui';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ButtonGroup } from './ButtonGroup';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useFileActions } from '@/hooks/useFileActions';

type FileCreateFolderModalProps = {
  currentPath?: string;
};

const schema = yup.object().shape({
  folder: yup.string().required('Folder name is required'),
});

type CreateFolderForm = yup.InferType<typeof schema>;

export const FileCreateFolderModal = ({ currentPath = '' }: FileCreateFolderModalProps) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { create } = useFileActions();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateFolderForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      folder: 'New folder',
    },
  });

  const onSubmit = (values: CreateFolderForm) => {
    create({ path: currentPath, name: values.folder });
  };

  return (
    <>
      <ModalTitle>{t('createFolder')}</ModalTitle>
      <Controller
        control={control}
        name="folder"
        render={({ field }) => (
          <Input
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            onKeyPress={(e) => e.nativeEvent.key === 'Enter' && handleSubmit(onSubmit)()}
            error={errors.folder?.message}
          />
        )}
      />
      <ButtonGroup okText={t('create')} onCancel={closeModal} onOk={handleSubmit(onSubmit)} />
    </>
  );
};
