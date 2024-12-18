import { FileEntity } from '@/api/generated';
import { Input, useUi, ModalTitle } from '@repo/ui';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { ButtonGroup } from './ButtonGroup';
import { useFileActions } from '@/hooks/useFileActions';

type FileRenameModalProps = {
  file: FileEntity;
};

const schema = yup.object().shape({
  newName: yup.string().required('New file name is required'),
});

type RenameForm = yup.InferType<typeof schema>;

export const FileRenameModal = ({ file }: FileRenameModalProps) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { rename } = useFileActions();

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
    rename({ fileUri: file.uri, newPath, name: values.newName });
  };

  return (
    <>
      <ModalTitle>{t('renameItem')}</ModalTitle>
      <Controller
        control={control}
        name="newName"
        render={({ field }) => (
          <Input
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            onKeyPress={(e) => e.nativeEvent.key === 'Enter' && handleSubmit(onSubmit)()}
            error={errors.newName?.message}
          />
        )}
      />
      <ButtonGroup okText={t('rename')} onCancel={closeModal} onOk={handleSubmit(onSubmit)} />
    </>
  );
};
