import { Breadcrumb } from '@/components/breadcrumb';
import { cn } from '@/utils/cn';
import { FileList } from '@/components/FileList';
import { useFilesContext } from '@/providers/FilesProvider';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { BaseLayout } from '@/components/base-layout';
import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import { FileMoveCopyModal } from '@/components/modals/FileMoveCopy.modal';
import { FileRemoveModal } from '@/components/modals/FileRemove.modal';
import { useUi } from '@/providers/UiProvider';
import { Search } from '@/components/search';
import { useFileSearch, type FileSearchItem } from '@/hooks/useFileSearch';

export default function FilesPage() {
  const { t } = useTranslation();
  const { path } = useLocalSearchParams<{ path?: string }>();
  const { openModal } = useUi();
  const { clearSearch, query, results, searchFiles } = useFileSearch();

  const { currentPath, handlePathClick, handleClearSelection, hasSelectedItems, selectedItems, setInitialPath } =
    useFilesContext();

  useEffect(() => {
    if (path) {
      setInitialPath(path);
    }
  }, []);

  const handleSearchSelect = (file: FileSearchItem) => {
    const parentPath = file.uri.slice(0, file.uri.lastIndexOf('/'));
    handlePathClick(file.isDirectory ? file.uri : parentPath);
    clearSearch();
  };

  const searchOptions = results.map((file) => (
    <Pressable
      key={`${file.serverId}:${file.groupId}:${file.uri}`}
      onPress={() => handleSearchSelect(file)}
      className="flex-row items-center gap-2 px-3 py-2 hover:bg-accent active:bg-accent"
    >
      {file.isDirectory ? <Icon.Folder className="text-primary" size={18} /> : <Icon.File size={18} />}
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1}>{file.name}</Text>
        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
          {file.uri}
        </Text>
      </View>
    </Pressable>
  ));

  const header = (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center gap-4">
        <Text variant="h1">{t('navigation.files')}</Text>
        <Search
          className="w-full md:w-80"
          options={searchOptions}
          value={query}
          onChangeText={searchFiles}
          placeholder={t('files.searchPlaceholder')}
        />
      </View>
      <View className={cn('flex-row h-12 items-center', hasSelectedItems ? 'bg-accent' : 'bg-background')}>
        {hasSelectedItems ? (
          <View className="flex-row w-full items-center gap-2">
            <Button variant="ghost" onPress={handleClearSelection} className="p-2">
              <Icon.Close />
            </Button>
            <Text className="mr-auto">
              {selectedItems.length} {t('common.nouns.items')}
            </Text>
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
