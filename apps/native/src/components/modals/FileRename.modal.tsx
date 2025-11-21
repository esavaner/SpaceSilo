import { FileEntity } from '@/api/generated';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useFileActions } from '@/hooks/useFileActions';
import { DialogFooter } from './dialog-footer';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { InputController } from '../controllers/input.controller';

type FileRenameModalProps = {
  file: FileEntity;
};

const schema = yup.object().shape({
  newName: yup.string().required('New file name is required'),
});

type RenameForm = yup.InferType<typeof schema>;

export const FileRenameModal = ({ file }: FileRenameModalProps) => {
  const { t } = useTranslation();
  const { rename, isPending } = useFileActions();

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
    rename({ fileUri: file.uri, newPath, name: values.newName, groupId: file.groupId });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('renameItem')}</DialogTitle>
      </DialogHeader>
      <InputController
        control={control}
        name="newName"
        label={t('newName')}
        error={errors.newName?.message}
        onEnter={handleSubmit(onSubmit)}
      />
      <DialogFooter okText={t('rename')} onOk={handleSubmit(onSubmit)} loading={isPending} />
    </DialogContent>
  );
};
