import { useFileList } from '@/hooks/useFileList';
import { useTranslation } from 'react-i18next';
import { FileListCompact } from '../FileListCompact';
import { View } from 'react-native';
import { useFileActions } from '@/hooks/useFileActions';
import { useUi } from '@/providers/UiProvider';
import { Breadcrumb } from '../breadcrumb';
import { Text } from '../general/text';
import { Button } from '../general/button';
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
        pathItems={currentPath.split('/|\\')}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <FileListCompact items={items} handleItemClick={handleItemClick} className="" />
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
