import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { Button, Input, Modal } from '@repo/ui';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

type FileRenameModalProps = {
  file: FileEntity;
};

const schema = yup.object().shape({
  newPath: yup.string().required('New file name is required'),
});

type RenameForm = yup.InferType<typeof schema>;

export const FileRenameModal = ({ file }: FileRenameModalProps) => {
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
    <Modal id="file-rename-modal">
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
