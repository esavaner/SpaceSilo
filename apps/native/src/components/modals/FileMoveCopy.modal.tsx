import { useFileList } from '@/hooks/useFileList';
import { Breadcrumb, Button, ModalTitle, Text, useUi } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { FileListCompact } from '../FileListCompact';
import { View } from 'react-native';
import { FileEntity } from '@/api/generated';
import { useFileActions } from '@/hooks/useFileActions';

type Props = {
  path?: string;
  selectedItems: FileEntity[];
};

export const FileMoveCopyModal = ({ path = '', selectedItems }: Props) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { currentPath, handleItemClick, handlePathClick, items } = useFileList({ path });
  const { copy, move } = useFileActions();

  const handleMove = () => {
    selectedItems.forEach((item) => {
      move({ fileUri: item.uri, newPath: currentPath, name: item.name });
    });
  };

  const handleCopy = () => {
    selectedItems.forEach((item) => {
      copy({ fileUri: item.uri, newPath: currentPath, name: item.name });
    });
  };

  return (
    <>
      <ModalTitle>Move or copy</ModalTitle>
      <Text>{selectedItems.length} item(s) selected</Text>
      <Breadcrumb
        pathItems={currentPath.split('/|\\')}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <FileListCompact items={items} handleItemClick={handleItemClick} className="min-h-64 max-h-64" />
      <View className="flex-row gap-2 mt-2">
        <Button variant="primaryOutline" onPress={closeModal}>
          Cancel
        </Button>
        <Button variant="primary" onPress={handleCopy}>
          Copy here
        </Button>
        <Button variant="primary" onPress={handleMove}>
          Move here
        </Button>
      </View>
    </>
  );
};
