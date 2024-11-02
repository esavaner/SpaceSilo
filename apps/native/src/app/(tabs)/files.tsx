import { Api } from '@/api/api';
import { FileList } from '@/components/FileList/FileList';
import { FilePath } from '@/components/FilePath/FilePath';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';

export default function FilesPage() {
  const { path } = useLocalSearchParams<{ path?: string }>();
  const [currentPath, setCurrentPath] = useState(path || '');

  const { data } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => Api.files.filesControllerFindAll({ path: currentPath }),
  });

  const handleDirClick = (name: string) => {
    const newPath = `${currentPath}/${name}`;
    setCurrentPath(newPath);
    router.setParams({ path: newPath });
  };

  const handlePathClick = (newPath: string) => {
    setCurrentPath(newPath);
    router.setParams({ path: newPath });
  };

  return (
    <>
      <FilePath pathItems={currentPath.split('/')} handlePathClick={handlePathClick} />
      <FileList items={data?.data as any[]} handleDirClick={handleDirClick} />
    </>
  );
}
