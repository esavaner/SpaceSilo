import { useRef } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, DropdownMenu, DropdownOption, Text, useModal, useThemeColors } from '@repo/shared/components';
import { Edit3, EllipsisVertical, Plus, Trash2 } from 'lucide-react-native';
import { GroupAddMembersModal } from '../modals/GroupAddMembers.modal';
import { GroupEditModal } from '../modals/GroupEdit.modal';
import { GroupRemoveModal } from '../modals/GroupRemove.modal';
import { type GroupListItem } from '@/hooks/useGroupList';

type Props = {
  group: GroupListItem;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
};

export const GroupOptionsDropdown = ({ group, canManage, onOpenChange }: Props) => {
  const { openModal } = useModal();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const pendingAction = useRef<(() => void) | null>(null);

  if (!canManage) return null;

  const items = [
    {
      label: t('groups.details.editGroup'),
      icon: <Edit3 size={18} color={colors.text.default} aria-hidden />,
      onPress: () => openModal(<GroupEditModal group={group} />),
    },
    {
      label: t('groups.membersModal.title'),
      icon: <Plus size={18} color={colors.text.default} aria-hidden />,
      onPress: () => openModal(<GroupAddMembersModal group={group} />),
    },
    {
      label: t('groups.details.removeGroup'),
      icon: <Trash2 size={18} color={colors.text.danger} aria-hidden />,
      color: colors.text.danger,
      onPress: () => openModal(<GroupRemoveModal group={group} />),
    },
  ];

  return (
    <DropdownMenu
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
          accessibilityState={{ expanded: isOpen }}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onPress={(event) => {
            event.stopPropagation();
            if (!isOpen) onOpenChange(true);
            toggle();
          }}
        >
          <EllipsisVertical size={18} color={colors.text.brand} aria-hidden />
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
              <Text.S color={item.color}>{item.label}</Text.S>
            </DropdownOption>
          ))}
        </View>
      )}
    </DropdownMenu>
  );
};
