import { useFileList } from '@/hooks/useFileList';
import { useLocalSearchParams, router } from 'expo-router';
import { createContext, useContext } from 'react';

type FilesContextType = ReturnType<typeof useFileList>;

export const FilesContext = createContext<FilesContextType | undefined>(undefined);

type FilesProviderProps = {
  children: React.ReactNode;
};

export const FilesProvider = ({ children }: FilesProviderProps) => {
  const { path } = useLocalSearchParams<{ path?: string }>();

  const fileList = useFileList({ path, onPathChange: (path) => router.setParams({ path }) });

  return <FilesContext.Provider value={{ ...fileList }}>{children}</FilesContext.Provider>;
};

export const useFilesContext = () => {
  const context = useContext(FilesContext);
  if (!context) {
    throw new Error('useFiles must be used within a FilesProvider');
  }
  return context;
};
