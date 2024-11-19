import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { Button, Input, Modal, ModalProps, useUi } from '@repo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { setCurrentModal } = useUi();
  const queryClient = useQueryClient();

  const { mutate: rename } = useMutation({
    mutationKey: ['rename', file.uri],
    mutationFn: Api.files.filesControllerMove,
    onSuccess: () => {
      setCurrentModal(undefined);
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
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
    const lastIndexOf = file.uri.lastIndexOf(file.name);
    const newPath = `${file.uri.slice(0, lastIndexOf)}${values.newPath}`;
    rename({ path: file.uri, newPath });
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
            onKeyPress={(e) => e.nativeEvent.key === 'Enter' && handleSubmit(onSubmit)()}
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
