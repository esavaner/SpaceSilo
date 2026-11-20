import { Button, DropdownMenu, DropdownOption, Icon, Text, useThemeColors } from '@repo/shared/components';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

export type GroupFilter = 'all' | 'owned' | 'personal' | 'shared' | 'with-members';

type Props = {
  value: GroupFilter;
  onChange: (value: GroupFilter) => void;
};

export const GroupFilterDropdown = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const filters: { label: string; value: GroupFilter }[] = [
    { label: t('groups.filters.all'), value: 'all' },
    { label: t('groups.filters.owned'), value: 'owned' },
    { label: t('groups.filters.personal'), value: 'personal' },
    { label: t('groups.filters.shared'), value: 'shared' },
    { label: t('groups.filters.withMembers'), value: 'with-members' },
  ];
  const label = t('groups.filters.trigger');

  return (
    <DropdownMenu
      label={label}
      closeLabel={t('common.actions.close')}
      style={{ alignSelf: 'flex-start' }}
      trigger={({ isOpen, toggle, menuId }) => (
        <Button
          variant="secondary"
          size="small"
          onPress={toggle}
          accessibilityLabel={label}
          accessibilityState={{ expanded: isOpen }}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
        >
          {filters.find((option) => option.value === value)?.label ?? label}
          <Icon.Funnel size={18} color={colors.text.default} aria-hidden />
        </Button>
      )}
    >
      {({ close, menuId }) => (
        <View nativeID={menuId} role="menu" accessibilityLabel={label}>
          {filters.map((option) => (
            <DropdownOption
              key={option.value}
              role="menuitem"
              accessibilityState={{ selected: option.value === value }}
              $selected={option.value === value}
              onPress={() => {
                onChange(option.value);
                close();
              }}
            >
              <Text.S style={{ flex: 1 }}>{option.label}</Text.S>
              {option.value === value && <Icon.Check size={18} color={colors.text.default} aria-hidden />}
            </DropdownOption>
          ))}
        </View>
      )}
    </DropdownMenu>
  );
};
