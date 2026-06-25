import { useFileList } from '@/hooks/useFileList';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useFileActions } from '@/hooks/useFileActions';
import { useUi } from '@/providers/UiProvider';
import { Breadcrumb } from '../breadcrumb';
import { Text } from '../general/text';
import { Button } from '../general/button';
import { Icon } from '../general/icon';
import { cn } from '@/utils/cn';
import { DialogContent, DialogHeader, DialogTitle } from './dialog';
import { FileListItem } from '@/hooks/useFileList';

type Props = {
  path?: string;
  selectedItems: FileListItem[];
};

export const FileMoveCopyModal = ({ path = '', selectedItems }: Props) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { currentPath, handleItemClick, handlePathClick, items } = useFileList({ path });
  const { copy, move } = useFileActions();
  const directoryItems = items.filter((item) => item.isDirectory);

  const handleMove = () => {
    selectedItems.forEach((item) => {
      move({
        fileUri: item.uri,
        newPath: currentPath,
        name: item.name,
        groupId: item.groupId,
        serverId: item.serverId,
      });
    });
  };

  const handleCopy = () => {
    // @TODO copy files between groups
    selectedItems.forEach((item) => {
      copy({
        fileUri: item.uri,
        newPath: currentPath,
        name: item.name,
        groupId: item.groupId,
        serverId: item.serverId,
      });
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Move or copy</DialogTitle>
      </DialogHeader>
      <Text>{selectedItems.length} item(s) selected</Text>
      <Breadcrumb
        pathItems={currentPath.split(/\/|\\/)}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <ScrollView className="flex-1 w-full p-2">
        {directoryItems.length === 0 ? <Text>No folders</Text> : null}
        {directoryItems.map((item) => (
          <Pressable
            key={item.name}
            className={cn(
              'mb-2 flex-row items-center gap-4 rounded-md hover:bg-layer-secondary active:bg-layer-secondary'
            )}
            onPress={() => handleItemClick(item)}
          >
            <Text>
              <Icon.Folder className="text-primary" />
            </Text>
            <Text className="text-lg leading-5">{item.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View className="flex-row gap-2 mt-2">
        <Button onPress={closeModal} variant="secondary">
          Cancel
        </Button>
        <Button onPress={handleCopy}>Copy here</Button>
        <Button onPress={handleMove}>Move here</Button>
      </View>
    </DialogContent>
  );
};
