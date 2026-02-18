// import { Api } from '@/api/api';
// import { CopyFileDto, CreateFolderDto, MoveFileDto, RemoveFileDto } from '@/api/generated';
import { useFilesContext } from '@/providers/FilesProvider';
import { useUi } from '@/providers/UiProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// @TODO add translations
export const useFileActions = () => {
  const queryClient = useQueryClient();
  const { closeModal, toast } = useUi();
  const { handleClearSelection } = useFilesContext();

  const success = (message: string) => {
    closeModal();
    handleClearSelection();
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['files'] });
  };

  const { mutate: copy, isPending: isCopyPending } = useMutation({
    mutationKey: ['copyFiles'],
    mutationFn: (data: any) => ({ data: {} }) as any, // TODO: implement API call to copy files
    onSuccess: () => success('File copied'),
    onError: () => {
      toast.error('Error copying file');
    },
  });

  const { mutate: create, isPending: isCreatePending } = useMutation({
    mutationKey: ['createFolder'],
    mutationFn: (data: any) => ({ data: {} }) as any, // TODO: implement API call to create folder
    onSuccess: (_, { name }) => success(`Folder ${name} created`),
    onError: (_, { name }) => {
      toast.error(`Error creating folder: ${name}`);
    },
  });

  const { mutate: move, isPending: isMovePending } = useMutation({
    mutationKey: ['moveFiles'],
    mutationFn: (data: any) => ({ data: {} }) as any, // TODO: implement API call to move files
    onSuccess: () => success('File moved'),
    onError: () => {
      toast.error('Error moving file');
    },
  });

  const { mutate: remove, isPending: isRemovePending } = useMutation({
    mutationKey: ['removeFiles'],
    mutationFn: (data: any) => ({ data: {} }) as any, // TODO: implement API call to remove files
    onSuccess: () => success('File removed'),
    onError: () => {
      toast.error('Error removing file');
    },
  });

  const { mutate: rename, isPending: isRenamePending } = useMutation({
    mutationKey: ['renameFiles'],
    mutationFn: (data: any) => ({ data: {} }) as any, // TODO: implement API call to rename files
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
