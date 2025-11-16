import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useFileActions } from '@/hooks/useFileActions';
import { InputController } from '../controllers/input.controller';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';

type FileCreateFolderModalProps = {
  currentPath?: string;
};

const schema = yup.object().shape({
  folder: yup.string().required('Folder name is required'),
});

type CreateFolderForm = yup.InferType<typeof schema>;

export const FileCreateFolderModal = ({ currentPath = '' }: FileCreateFolderModalProps) => {
  const { t } = useTranslation();
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
    // @TODO: Implement create folder action
    create({ newPath: currentPath, name: values.folder, groupId: '' });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('createFolder')}</DialogTitle>
      </DialogHeader>
      <InputController
        control={control}
        name="folder"
        label={t('Folder Name')}
        error={errors.folder?.message}
        onEnter={handleSubmit(onSubmit)}
      />
      <DialogFooter okText={t('create')} onOk={handleSubmit(onSubmit)} />
    </DialogContent>
  );
};
