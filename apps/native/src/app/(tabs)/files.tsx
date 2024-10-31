import { Api } from '@/api/api';
import { FileList } from '@/components/FileList/FileList';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

export default function FilesPage() {
  const { path } = useLocalSearchParams();
  const { data } = useQuery({
    queryKey: ['files'],
    queryFn: () => Api.files.filesControllerFindAll({ path: typeof path === 'string' ? path : '/' }),
  });

  return <FileList items={data?.data as any[]} />;
}
