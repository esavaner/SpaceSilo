import { FileList } from '@/components/FileList';
import { ItemSelection } from '@/components/ItemSelection';
import { useFiles } from '@/hooks/useFiles';
import { Breadcrumb } from '@repo/ui';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

export default function FilesPage() {
  const { t } = useTranslation();
  const { path } = useLocalSearchParams<{ path?: string }>();

  const {
    currentPath,
    selectedItems,
    handleDirClick,
    handlePathClick,
    handleSelectItem,
    handleClearSelection,
    handleSelectAll,
    handleSort,
    comparator,
    items,
  } = useFiles({ path, onPathChange: (path) => router.setParams({ path }) });

  return (
    <View className="flex-1 bg-layer relative">
      {selectedItems.length > 0 ? (
        <ItemSelection path={currentPath} selectedItems={selectedItems} handleClearSelection={handleClearSelection} />
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
        items={items}
        handleDirClick={handleDirClick}
        handleSelectItem={handleSelectItem}
        handleClearSelection={handleClearSelection}
        handleSelectAll={handleSelectAll}
        handleSort={handleSort}
        comparator={comparator}
        selectedItems={selectedItems}
      />
    </View>
  );
}
