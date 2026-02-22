import { Breadcrumb } from '@/components/breadcrumb';
import { cn } from '@/utils/cn';
import { FileList } from '@/components/FileList';
import { ItemSelection } from '@/components/ItemSelection';
import { useFilesContext } from '@/providers/FilesProvider';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BaseLayout } from '@/components/base-layout';
import { Text } from '@/components/general/text';

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
    <BaseLayout>
      <Text variant="h1">{t('Files')}</Text>
      <View className={cn('flex-row px-4 h-12 items-center', hasSelectedItems ? 'bg-accent' : 'bg-background')}>
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
    </BaseLayout>
  );
}
