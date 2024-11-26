import { useFiles } from '@/hooks/useFiles';
import { Breadcrumb, Button, Text, useUi } from '@repo/ui';
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
      <Text>Move or copy</Text>
      <Breadcrumb
        pathItems={currentPath.split('/')}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <FileListCompact items={items} handleDirClick={handleDirClick} />
      <View className="flex-row gap-2">
        <Button variant="outline" onPress={closeModal}>
          Cancel
        </Button>
        <Button variant="primary">Copy here</Button>
        <Button variant="primary">Move here</Button>
      </View>
    </>
  );
};
