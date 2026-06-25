import { Breadcrumb } from '@/components/breadcrumb';
import { cn } from '@/utils/cn';
import { FileList } from '@/components/FileList';
import { useFilesContext } from '@/providers/FilesProvider';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BaseLayout } from '@/components/base-layout';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { FileMoveCopyModal } from '@/components/modals/FileMoveCopy.modal';
import { FileRemoveModal } from '@/components/modals/FileRemove.modal';
import { useUi } from '@/providers/UiProvider';

export default function FilesPage() {
  const { t } = useTranslation();
  const { path } = useLocalSearchParams<{ path?: string }>();
  const { openModal } = useUi();

  const { currentPath, handlePathClick, handleClearSelection, hasSelectedItems, selectedItems, setInitialPath } =
    useFilesContext();

  useEffect(() => {
    if (path) {
      setInitialPath(path);
    }
  }, []);

  const header = (
    <View className="gap-4 flex-row">
      <Text variant="h1">{t('Files')}</Text>
      <View className={cn('flex-row h-12 items-center', hasSelectedItems ? 'bg-accent' : 'bg-background')}>
        {hasSelectedItems ? (
          <View className="flex-row w-full items-center gap-2">
            <Button variant="ghost" onPress={handleClearSelection} className="p-2">
              <Icon.Close />
            </Button>
            <Text className="mr-auto">{selectedItems.length} item(s)</Text>
            <Button
              onPress={() => openModal(<FileMoveCopyModal path={currentPath} selectedItems={selectedItems} />)}
              variant="ghost"
              className="p-2"
            >
              <Icon.Copy />
            </Button>
            <Button
              onPress={() => openModal(<FileRemoveModal files={selectedItems} />)}
              variant="ghost"
              className="p-2"
            >
              <Icon.Trash className="text-red-600" />
            </Button>
          </View>
        ) : (
          <Breadcrumb
            pathItems={currentPath.split(/\/|\\/)}
            handlePathClick={handlePathClick}
            homeDirName={t('files.homeDir')}
          />
        )}
      </View>
    </View>
  );

  return (
    <BaseLayout header={header} scrollable={false}>
      <FileList />
    </BaseLayout>
  );
}
