import { Api } from '@/api/api';
import { CopyFileDto, CreateFolderDto, MoveFileDto, RemoveFileDto } from '@/api/generated';
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

  const { mutate: copy } = useMutation({
    mutationKey: ['copyFiles'],
    mutationFn: (data: CopyFileDto) => Api.files.filesControllerCopy(data),
    onSuccess: () => success('File copied'),
    onError: () => {
      toast.error('Error copying file');
    },
  });

  const { mutate: create } = useMutation({
    mutationKey: ['createFolder'],
    mutationFn: (data: CreateFolderDto) => Api.files.filesControllerCreateFolder(data),
    onSuccess: (_, { name }) => success(`Folder ${name} created`),
    onError: (_, { name }) => {
      toast.error(`Error creating folder: ${name}`);
    },
  });

  const { mutate: move } = useMutation({
    mutationKey: ['moveFiles'],
    mutationFn: (data: MoveFileDto) => Api.files.filesControllerMove(data),
    onSuccess: () => success('File moved'),
    onError: () => {
      toast.error('Error moving file');
    },
  });

  const { mutate: remove } = useMutation({
    mutationKey: ['removeFiles'],
    mutationFn: (data: RemoveFileDto) => Api.files.filesControllerRemove(data),
    onSuccess: () => success('File removed'),
    onError: () => {
      toast.error('Error removing file');
    },
  });

  const { mutate: rename } = useMutation({
    mutationKey: ['renameFiles'],
    mutationFn: (data: MoveFileDto) => Api.files.filesControllerMove(data),
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
  };
};
