import { FileCreateFolderModal } from '../modals/FileCreateFolder.modal';
import { FileText, Folder, Plus } from 'lucide-react-native';
import styled from 'styled-components/native';
import { Button, DropdownMenu, DropdownOption, Text, useModal, useThemeColors } from '@repo/shared/components';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type FileAddDropdownProps = {
  currentPath: string;
};

const AddMenu = styled(DropdownMenu)`
  margin-left: auto;
`;

export const FileAddDropdown = ({ currentPath }: FileAddDropdownProps) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const colors = useThemeColors();
  const pendingAction = useRef<(() => void) | null>(null);

  return (
    <AddMenu
      label={t('files.actions.add')}
      closeLabel={t('common.actions.close')}
      onClose={() => {
        const action = pendingAction.current;
        pendingAction.current = null;
        action?.();
      }}
      trigger={({ isOpen, toggle, menuId }) => (
        <Button
          size="small"
          onPress={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
        >
          <Plus size={18} color={colors.text.inverted} />
          {t('files.actions.add')}
        </Button>
      )}
    >
      {({ close, menuId }) => (
        <View nativeID={menuId} role="menu">
          <DropdownOption
            role="menuitem"
            onPress={() => {
              pendingAction.current = () => openModal(<FileCreateFolderModal currentPath={currentPath} />);
              close();
            }}
          >
            <Folder size={18} color={colors.text.default} />
            <Text.S>{t('files.actions.folder')}</Text.S>
          </DropdownOption>
          <DropdownOption role="menuitem" onPress={close}>
            <FileText size={18} color={colors.text.default} />
            <Text.S>{t('files.actions.file')}</Text.S>
          </DropdownOption>
        </View>
      )}
    </AddMenu>
  );
};
