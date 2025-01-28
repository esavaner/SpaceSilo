import { useFileList } from '@/hooks/useFileList';
import { router } from 'expo-router';
import { createContext, useContext, useState } from 'react';

type FilesContextType = ReturnType<typeof useFileList> & {
  setInitialPath: (path: string) => void;
};

export const FilesContext = createContext<FilesContextType | undefined>(undefined);

type FilesProviderProps = {
  children: React.ReactNode;
};

export const FilesProvider = ({ children }: FilesProviderProps) => {
  const [initialPath, setInitialPath] = useState('');

  const fileList = useFileList({
    path: initialPath,
    // @TODO
    onPathChange: (path) => router.setParams({ path, groups: ['a', 'b'] }),
    // @ts-ignore
    onFileSelect: (fileUri) => router.push({ pathname: '/view', params: { fileUri } }),
  });

  return <FilesContext.Provider value={{ ...fileList, setInitialPath }}>{children}</FilesContext.Provider>;
};

export const useFilesContext = () => {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error('useFiles must be used within a FilesProvider');
  }
  return context;
};
