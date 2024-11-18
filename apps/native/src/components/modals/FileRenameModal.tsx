import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { Button, Input, Modal, ModalProps } from '@repo/ui';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

type FileRenameModalProps = ModalProps & {
  file: FileEntity;
};

const schema = yup.object().shape({
  newPath: yup.string().required('New file name is required'),
});

type RenameForm = yup.InferType<typeof schema>;

export const FileRenameModal = ({ id, file }: FileRenameModalProps) => {
  const { t } = useTranslation();
  const { mutate: rename } = useMutation({
    mutationKey: ['files', 'rename'],
    mutationFn: Api.files.filesControllerMove,
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RenameForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      newPath: file.name,
    },
  });

  const onSubmit = (values: RenameForm) => {
    console.log(values, file);
    // rename({ path: file.uri, newPath: values.newPath });
  };

  return (
    <Modal id={id} title={t('renameFile')}>
      <Controller
        control={control}
        render={({ field }) => (
          <Input
            onBlur={field.onBlur}
            value={field.value}
            onChangeText={field.onChange}
            label="Server URL"
            error={errors.newPath?.message}
          />
        )}
        name="newPath"
      />
      <Button variant="primary" onPress={handleSubmit(onSubmit)} className="w-full">
        Login
      </Button>
    </Modal>
  );
};
