import { useFileList } from '@/hooks/useFileList';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { Folder } from 'lucide-react-native';
import { useFileActions } from '@/hooks/useFileActions';
import { Breadcrumb } from '../breadcrumb';
import {
  Button,
  Modal,
  ModalButtons,
  ModalTitle,
  Text,
  theme,
  useModal,
  useThemeColors,
} from '@repo/shared/components';
import { FileListItem } from '@/hooks/useFileList';

type Props = {
  path?: string;
  selectedItems: FileListItem[];
};

const Folders = styled.View`
  width: 100%;
  padding: ${theme.spacing[200]};
`;

const FolderTarget = styled.Pressable`
  flex-direction: row;
  align-items: center;
  gap: ${theme.spacing[400]};
  margin-bottom: ${theme.spacing[200]};
  padding: ${theme.spacing[200]};
  border-radius: ${theme.radius[150]};
  cursor: pointer;
  &:hover,
  &:active {
    background-color: ${theme.colors.surface.medium};
  }
`;

export const FileMoveCopyModal = ({ path = '', selectedItems }: Props) => {
  const { t } = useTranslation();
  const { closeModal } = useModal();
  const colors = useThemeColors();
  const { currentPath, handleItemClick, handlePathClick, items } = useFileList({ path });
  const { copy, move, isPending } = useFileActions();
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
    <Modal closeLabel={t('common.actions.close')} accessibilityLabel={t('files.moveCopy.title')}>
      <ModalTitle>{t('files.moveCopy.title')}</ModalTitle>
      <Text>
        {selectedItems.length} {t('common.nouns.items')} {t('files.moveCopy.selected')}
      </Text>
      <Breadcrumb
        pathItems={currentPath.split(/\/|\\/)}
        handlePathClick={handlePathClick}
        homeDirName={t('files.homeDir')}
      />
      <Folders>
        {directoryItems.length === 0 ? <Text>{t('files.moveCopy.empty')}</Text> : null}
        {directoryItems.map((item) => (
          <FolderTarget key={item.name} onPress={() => handleItemClick(item)}>
            <Folder size={18} color={colors.text.brand} />
            <Text.L>{item.name}</Text.L>
          </FolderTarget>
        ))}
      </Folders>
      <ModalButtons>
        <Button onPress={closeModal} variant="secondary" disabled={isPending}>
          {t('common.actions.cancel')}
        </Button>
        <Button onPress={handleCopy} disabled={isPending}>
          {t('files.moveCopy.copyHere')}
        </Button>
        <Button onPress={handleMove} disabled={isPending}>
          {t('files.moveCopy.moveHere')}
        </Button>
      </ModalButtons>
    </Modal>
  );
};
