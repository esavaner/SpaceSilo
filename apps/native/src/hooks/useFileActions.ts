import { Api } from '@/api/api';
import { useUi } from '@repo/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// @TODO add translations
export const useFileActions = () => {
  const queryClient = useQueryClient();
  const { closeModal, toast } = useUi();

  const { mutate: copy } = useMutation({
    mutationKey: ['copy'],
    mutationFn: Api.files.filesControllerCopy,
    onSuccess: () => {
      closeModal();
      toast.success('File copied');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: () => {
      toast.error('Error copying file');
    },
  });

  const { mutate: create } = useMutation({
    mutationKey: ['createFolder'],
    mutationFn: Api.files.filesControllerCreateFolder,
    onSuccess: (_, { name }) => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success(`Folder created: ${name}`);
    },
    onError: (_, { name }) => {
      toast.error(`Error creating folder: ${name}`);
    },
  });

  const { mutate: move } = useMutation({
    mutationKey: ['move'],
    mutationFn: Api.files.filesControllerMove,
    onSuccess: () => {
      closeModal();
      toast.success('File moved');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: () => {
      toast.error('Error moving file');
    },
  });

  const { mutate: remove } = useMutation({
    mutationKey: ['remove'],
    mutationFn: Api.files.filesControllerRemove,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File removed');
    },
    onError: () => {
      toast.error('Error removing file');
    },
  });

  const { mutate: rename } = useMutation({
    mutationKey: ['rename'],
    mutationFn: Api.files.filesControllerMove,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File renamed');
    },
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
