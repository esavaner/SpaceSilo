import { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, View, Text } from 'react-native';
import { readDirectoryAsync, documentDirectory, getInfoAsync, FileInfo } from 'expo-file-system';
import { Breadcrumb } from '@repo/shared';
import { useTranslation } from 'react-i18next';

type FileItem = Extract<FileInfo, { exists: true }> & { name: string };

export default function FilesLocalPage() {
  const { t } = useTranslation();
  const [currentPath, setCurrentPath] = useState(documentDirectory || '');
  const [items, setItems] = useState<FileItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = async (path: string) => {
    try {
      const directory = await readDirectoryAsync(path);
      console.log(directory, path);
      const fileInfoPromises = directory.map(async (item) => {
        try {
          const info = await getInfoAsync(`${path}/${item}`, { md5: true });
          return { ...info, name: item };
        } catch (error) {
          console.error('Error reading directory:', error);
        }
      });
      const fileInfo = await Promise.all(fileInfoPromises);
      setItems(fileInfo.filter((item) => !!item && item.exists));
    } catch (error) {
      console.error('Error reading directory:', error);
    }
  };

  const handleDirClick = (name: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    const newPath = `${currentPath}/${name}`;
    setCurrentPath(newPath);
  };

  const handlePathClick = (newPath: string) => {
    if (selectedItems.length > 0) {
      return;
    }
    setCurrentPath(newPath);
  };

  const handleSelectItem = (item: FileItem) => {
    const isSelected = selectedItems.some((i) => i.name === item.name);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i.name !== item.name));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const renderItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity onPress={() => (item.isDirectory ? handleDirClick(item.name) : handleSelectItem(item))}>
      <Text
        style={{
          padding: 10,
          backgroundColor: selectedItems.some((i) => i.name === item.name) ? 'lightgray' : 'white',
        }}
      >
        {item.name} {item.isDirectory ? '(Dir)' : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-layer p-4">
      <Breadcrumb
        pathItems={currentPath.split('/')}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <FlatList data={items} keyExtractor={(item) => item.uri} renderItem={renderItem} />
    </View>
  );
}
