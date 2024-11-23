import { Api } from '@/api/api';
import { FileEntity } from '@/api/generated';
import { FileList } from '@/components/FileList/FileList';
import { ItemSelection } from '@/components/ItemSelection/ItemSelection';
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
  const [selectedItems, setSelectedItems] = useState<FileEntity[]>([]);

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

  const handleSelectItem = (item: FileEntity) => {
    const isSelected = selectedItems.some((i) => i.name === item.name);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i.name !== item.name));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  return (
    <View className="flex-1 bg-layer">
      {selectedItems.length > 0 ? (
        <ItemSelection selectedItems={selectedItems} handleClearSelection={handleClearSelection} />
      ) : (
        <View className="flex-row px-4 h-10 items-center bg-layer">
          <Breadcrumb
            pathItems={currentPath.split('/')}
            handlePathClick={handlePathClick}
            homeDirName={t('files.homeDir')}
          />
        </View>
      )}
      <FileList
        items={data?.data}
        handleDirClick={handleDirClick}
        handleSelectItem={handleSelectItem}
        selectedItems={selectedItems}
        className="p-2"
      />
    </View>
  );
}
