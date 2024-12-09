import { useFiles } from '@/hooks/useFiles';
import { Breadcrumb, Button, ModalTitle, useUi } from '@repo/ui';
import { useTranslation } from 'react-i18next';
import { FileListCompact } from '../FileListCompact';
import { View } from 'react-native';

type Props = {
  path?: string;
};

export const FileMoveCopyModal = ({ path = '' }: Props) => {
  const { t } = useTranslation();
  const { closeModal } = useUi();
  const { currentPath, handleDirClick, handlePathClick, items } = useFiles({ path });

  return (
    <>
      <ModalTitle>Move or copy</ModalTitle>
      <Breadcrumb
        pathItems={currentPath.split('/')}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <FileListCompact items={items} handleDirClick={handleDirClick} className="min-h-64 max-h-64" />
      <View className="flex-row gap-2 mt-2">
        <Button variant="outline" onPress={closeModal}>
          Cancel
        </Button>
        <Button variant="primary">Copy here</Button>
        <Button variant="primary">Move here</Button>
      </View>
    </>
  );
};
