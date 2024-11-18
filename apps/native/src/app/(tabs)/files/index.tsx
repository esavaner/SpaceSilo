import { Api } from '@/api/api';
import { FileList } from '@/components/FileList/FileList';
import { Breadcrumb } from '@repo/ui';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function FilesPage() {
  const { t } = useTranslation();
  const { path } = useLocalSearchParams<{ path?: string }>();
  const [currentPath, setCurrentPath] = useState(path || '');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const { data } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => Api.files.filesControllerFindAll({ path: currentPath }),
  });

  const handleDirClick = (name: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    const newPath = `${currentPath}/${name}`;
    setCurrentPath(newPath);
    router.setParams({ path: newPath });
  };

  const handlePathClick = (newPath: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    setCurrentPath(newPath);
    router.setParams({ path: newPath });
  };

  const handleSelectItem = (item: any) => {
    const isSelected = selectedItems.some((i) => i.name === item.name);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i.name !== item.name));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  return (
    <View className="flex-1 bg-layer p-4">
      <Breadcrumb
        pathItems={currentPath.split('/')}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <FileList
        items={data?.data}
        handleDirClick={handleDirClick}
        handleSelectItem={handleSelectItem}
        selectedItems={selectedItems}
      />
    </View>
  );
}
