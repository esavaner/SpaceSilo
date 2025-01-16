import { FileList } from '@/components/FileList';
import { ItemSelection } from '@/components/ItemSelection';
import { useFilesContext } from '@/providers/FilesProvider';
import { Breadcrumb, cn } from '@repo/ui';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function FilesPage() {
  const { t } = useTranslation();
  const { path } = useLocalSearchParams<{ path?: string }>();

  const { currentPath, handlePathClick, handleClearSelection, hasSelectedItems, selectedItems, setInitialPath } =
    useFilesContext();

  useEffect(() => {
    if (path) {
      setInitialPath(path);
    }
  }, []);

  return (
    <View className="flex-1 bg-layer relative">
      <View className={cn('flex-row px-4 h-12 items-center', hasSelectedItems ? 'bg-layer-secondary' : 'bg-layer')}>
        {hasSelectedItems ? (
          <ItemSelection path={currentPath} selectedItems={selectedItems} handleClearSelection={handleClearSelection} />
        ) : (
          <Breadcrumb
            pathItems={currentPath.split(/\/|\\/)}
            handlePathClick={handlePathClick}
            homeDirName={t('files.homeDir')}
          />
        )}
      </View>
      <FileList />
    </View>
  );
}
