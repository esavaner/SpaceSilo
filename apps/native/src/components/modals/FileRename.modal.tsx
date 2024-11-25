import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { Button, Input, useUi } from '@repo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const { toast, closeModal } = useUi();

  const { mutate: rename } = useMutation({
    mutationKey: ['rename', file.uri],
    mutationFn: Api.files.filesControllerMove,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File renamed'); // @TODO add translations
    },
    onError: () => {
      toast.error('Error renaming file'); // @TODO add translations
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
    <>
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
      <Button onPress={closeModal} variant="outline">
        Cancel
      </Button>
      <Button variant="primary" onPress={handleSubmit(onSubmit)} className="w-full">
        Rename
      </Button>
    </>
  );
};
