// import { Api } from '@/api/api';
// import { CopyFileDto, CreateFolderDto, MoveFileDto, RemoveFileDto } from '@/api/generated';
import { toast } from '@/lib/toast';
import { useFilesContext } from '@/providers/FilesProvider';
import { useServerContext } from '@/providers/ServerProvider';
import { useUi } from '@/providers/UiProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CopyFileRequest, CreateFolderRequest, MoveFileRequest, RemoveFileRequest } from '@repo/shared';

type RequestWithServerId<T> = T & {
  serverId: string;
};

// @TODO add translations
export const useFileActions = () => {
  const queryClient = useQueryClient();
  const { closeModal } = useUi();
  const { handleClearSelection } = useFilesContext();
  const { allServers } = useServerContext();

  const getServerClient = (serverId: string) => {
    const server = allServers.find((item) => item.id === serverId);
    if (!server) {
      throw new Error(`Server connection ${serverId} not found`);
    }
    return server.client;
  };

  const success = (message: string) => {
    closeModal();
    handleClearSelection();
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['files'] });
  };

  const { mutate: copy, isPending: isCopyPending } = useMutation({
    mutationKey: ['copyFiles'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<CopyFileRequest>) => {
      const client = getServerClient(serverId);
      return client.files.copy(data);
    },
    onSuccess: () => success('File copied'),
    onError: () => {
      toast.error('Error copying file');
    },
  });

  const { mutate: create, isPending: isCreatePending } = useMutation({
    mutationKey: ['createFolder'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<CreateFolderRequest>) => {
      const client = getServerClient(serverId);
      return client.files.createFolder(data);
    },
    onSuccess: (_, { name }) => success(`Folder ${name} created`),
    onError: (_, { name }) => {
      toast.error(`Error creating folder: ${name}`);
    },
  });

  const { mutate: move, isPending: isMovePending } = useMutation({
    mutationKey: ['moveFiles'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<MoveFileRequest>) => {
      const client = getServerClient(serverId);
      return client.files.move(data);
    },
    onSuccess: () => success('File moved'),
    onError: () => {
      toast.error('Error moving file');
    },
  });

  const { mutate: remove, isPending: isRemovePending } = useMutation({
    mutationKey: ['removeFiles'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<RemoveFileRequest>) => {
      const client = getServerClient(serverId);
      return client.files.remove(data);
    },
    onSuccess: () => success('File removed'),
    onError: () => {
      toast.error('Error removing file');
    },
  });

  const { mutate: rename, isPending: isRenamePending } = useMutation({
    mutationKey: ['renameFiles'],
    mutationFn: async ({ serverId, ...data }: RequestWithServerId<MoveFileRequest>) => {
      const client = getServerClient(serverId);
      return client.files.move(data);
    },
    onSuccess: () => success('File renamed'),
    onError: () => {
      toast.error('Error renaming file');
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
