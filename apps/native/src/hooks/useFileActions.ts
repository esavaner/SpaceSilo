// import { Api } from '@/api/api';
// import { CopyFileDto, CreateFolderDto, MoveFileDto, RemoveFileDto } from '@/api/generated';
import { toast } from '@/lib/toast';
import { useFilesContext } from '@/providers/FilesProvider';
import { useServerContext } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  type CopyFileRequest,
  type CreateFolderRequest,
  type MoveFileRequest,
  type RemoveFileRequest,
} from '@repo/shared';
import { tApiErr, translateDescriptor } from '@/i18n/translate';

type RequestWithServerId<T> = T & {
  serverId: string;
};

export const useFileActions = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { closeModal } = useUi();
  const { handleClearSelection } = useFilesContext();
  const { allServers } = useServerContext();

  const getServerClient = (serverId: string) => {
    const server = allServers.find((item) => item.id === serverId);
    if (!server) {
      throw new Error(t('common.messages.serverConnectionErr.NotFound', { serverId }));
    }
    return server.client;
  };

  const success = (message: Parameters<typeof translateDescriptor>[1], fallbackKey: string) => {
    closeModal();
    handleClearSelection();
    toast.success(translateDescriptor(t, message, fallbackKey));
    queryClient.invalidateQueries({ queryKey: ['files'] });
  };

  const { mutate: copy, isPending: isCopyPending } = useMutation({
    mutationKey: ['copyFiles'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<CopyFileRequest>) => {
      const client = getServerClient(serverId);
      return client.files.copy(data);
    },
    onSuccess: (response) => success(response.message, 'files.toasts.copySuccess'),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'files.errors.copy'));
    },
  });

  const { mutate: create, isPending: isCreatePending } = useMutation({
    mutationKey: ['createFolder'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<CreateFolderRequest>) => {
      const client = getServerClient(serverId);
      return client.files.createFolder(data);
    },
    onSuccess: (response) => success(response.message, 'files.toasts.createFolderSuccess'),
    onError: (error, { name }) => {
      const message = tApiErr(t, error);
      toast.error(message === t('common.messages.genericError') ? t('files.errors.createFolder', { name }) : message);
    },
  });

  const { mutate: move, isPending: isMovePending } = useMutation({
    mutationKey: ['moveFiles'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<MoveFileRequest>) => {
      const client = getServerClient(serverId);
      return client.files.move(data);
    },
    onSuccess: (response) => success(response.message, 'files.toasts.moveSuccess'),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'files.errors.move'));
    },
  });

  const { mutate: remove, isPending: isRemovePending } = useMutation({
    mutationKey: ['removeFiles'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<RemoveFileRequest>) => {
      const client = getServerClient(serverId);
      return client.files.remove(data);
    },
    onSuccess: (response) => success(response.message, 'files.toasts.removeSuccess'),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'files.errors.remove'));
    },
  });

  const { mutate: rename, isPending: isRenamePending } = useMutation({
    mutationKey: ['renameFiles'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<MoveFileRequest>) => {
      const client = getServerClient(serverId);
      return client.files.move(data);
    },
    onSuccess: (response) => success(response.message, 'files.toasts.renameSuccess'),
    onError: (error) => {
      toast.error(tApiErr(t, error, 'files.errors.rename'));
    },
  });

  return {
    copy,
    create,
    move,
    remove,
    rename,
    isPending: isCopyPending || isCreatePending || isMovePending || isRemovePending || isRenamePending,
  };
};
