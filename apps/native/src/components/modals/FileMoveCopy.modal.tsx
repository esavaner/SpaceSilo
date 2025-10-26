import { useFileList } from '@/hooks/useFileList';
import { Breadcrumb, Button, ModalLayout, ModalTitle, Text, useUi } from '@repo/shared';
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
      move({ fileUri: item.uri, newPath: currentPath, name: item.name, groupId: item.groupId });
    });
  };

  const handleCopy = () => {
    // @TODO copy files between groups
    selectedItems.forEach((item) => {
      copy({ fileUri: item.uri, newPath: currentPath, name: item.name, groupId: item.groupId });
    });
  };

  return (
    <ModalLayout>
      <ModalTitle>Move or copy</ModalTitle>
      <Text>{selectedItems.length} item(s) selected</Text>
      <Breadcrumb
        pathItems={currentPath.split('/|\\')}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <FileListCompact items={items} handleItemClick={handleItemClick} className="" />
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
    </ModalLayout>
  );
};
