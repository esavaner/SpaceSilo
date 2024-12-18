import { FileList } from '@/components/FileList';
import { ItemSelection } from '@/components/ItemSelection';
import { useFilesContext } from '@/providers/FilesProvider';
import { Breadcrumb } from '@repo/ui';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function FilesPage() {
  const { t } = useTranslation();
  const { path } = useLocalSearchParams<{ path?: string }>();

  const { currentPath, handlePathClick, handleClearSelection, selectedItems, setInitialPath } = useFilesContext();

  useEffect(() => {
    if (path) {
      setInitialPath(path);
    }
  }, []);

  console.log(currentPath.split(/\/|\\/));

  return (
    <View className="flex-1 bg-layer relative">
      {selectedItems.length > 0 ? (
        <ItemSelection path={currentPath} selectedItems={selectedItems} handleClearSelection={handleClearSelection} />
      ) : (
        <View className="flex-row px-4 h-11 items-center bg-layer">
          <Breadcrumb
            pathItems={currentPath.split(/\/|\\/)}
            handlePathClick={handlePathClick}
            homeDirName={t('files.homeDir')}
          />
        </View>
      )}
      <FileList />
    </View>
  );
}
