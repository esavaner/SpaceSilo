import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useFileActions } from '@/hooks/useFileActions';
import { InputController } from '../controllers/input.controller';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';
import { useServerContext } from '@/providers/ServerProvider';
import { useFilesContext } from '@/providers/FilesProvider';

type FileCreateFolderModalProps = {
  currentPath?: string;
};

type CreateFolderForm = {
  folder: string;
};

export const FileCreateFolderModal = ({ currentPath = '' }: FileCreateFolderModalProps) => {
  const { t } = useTranslation();
  const { create, isPending } = useFileActions();
  const { servers } = useServerContext();
  const { selectedGroupIds } = useFilesContext();
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
    create({
      newPath: currentPath,
      name: values.folder,
      groupId: selectedGroupIds[0] || '',
      serverId: servers[0]?.id || '',
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('files.createFolder.title')}</DialogTitle>
      </DialogHeader>
      <InputController
        control={control}
        name="folder"
        label={t('common.labels.folderName')}
        error={errors.folder?.message}
        onEnter={handleSubmit(onSubmit)}
      />
      <DialogFooter okText={t('files.createFolder.submit')} onOk={handleSubmit(onSubmit)} loading={isPending} />
    </DialogContent>
  );
};
