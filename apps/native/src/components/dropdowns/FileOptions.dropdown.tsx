import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { FileRenameModal } from '../modals/FileRename.modal';
import { FileRemoveModal } from '../modals/FileRemove.modal';
import { FileMoveCopyModal } from '../modals/FileMoveCopy.modal';
import { FileInfoModal } from '../modals/FileInfo.modal';
import { Button, DropdownMenu, DropdownOption, Icon, Text, useModal, useThemeColors } from '@repo/shared/components';
import { type FileListItem } from '@/hooks/useFileList';

type FileOptionsDropdownProps = {
  file: FileListItem;
  onOpenChange: (open: boolean) => void;
};

const OptionsMenu = styled(DropdownMenu)`
  margin-left: auto;
`;

export const FileOptionsDropdown = ({ file, onOpenChange }: FileOptionsDropdownProps) => {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const colors = useThemeColors();
  const pendingAction = useRef<(() => void) | null>(null);

  const items = [
    {
      label: t('dropdown.info'),
      icon: <Icon.Info size={18} color={colors.text.default} />,
      onPress: () => openModal(<FileInfoModal file={file} />),
    },
    { label: t('dropdown.share'), icon: <Icon.Share size={18} color={colors.text.default} />, onPress: () => {} },
    {
      label: t('dropdown.rename'),
      icon: <Icon.PencilLine size={18} color={colors.text.default} />,
      onPress: () => openModal(<FileRenameModal file={file} />),
    },
    {
      label: `${t('dropdown.move')} / ${t('dropdown.copy')}`,
      icon: <Icon.Copy size={18} color={colors.text.default} />,
      onPress: () => openModal(<FileMoveCopyModal selectedItems={[file]} />),
    },
    {
      label: t('dropdown.remove'),
      icon: <Icon.Trash size={18} color={colors.text.default} />,
      onPress: () => openModal(<FileRemoveModal files={[file]} />),
    },
  ];

  return (
    <OptionsMenu
      label={t('common.labels.actions')}
      closeLabel={t('common.actions.close')}
      onClose={() => {
        onOpenChange(false);
        const action = pendingAction.current;
        pendingAction.current = null;
        action?.();
      }}
      trigger={({ isOpen, toggle, menuId }) => (
        <Button
          variant="tertiary"
          size="small"
          accessibilityLabel={t('common.labels.actions')}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onPress={(event) => {
            event.stopPropagation();
            if (!isOpen) onOpenChange(true);
            toggle();
          }}
        >
          <Icon.EllipsisVertical size={18} color={colors.text.brand} />
        </Button>
      )}
    >
      {({ close, menuId }) => (
        <View nativeID={menuId} role="menu">
          {items.map((item) => (
            <DropdownOption
              key={item.label}
              role="menuitem"
              onPress={(event) => {
                event.stopPropagation();
                pendingAction.current = item.onPress;
                close();
              }}
            >
              {item.icon}
              <Text.S>{item.label}</Text.S>
            </DropdownOption>
          ))}
        </View>
      )}
    </OptionsMenu>
  );
};
