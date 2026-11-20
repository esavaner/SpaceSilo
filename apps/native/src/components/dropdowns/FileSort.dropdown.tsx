import { Comparator, SortBy } from '@/hooks/useFileList';
import { useTranslation } from 'react-i18next';
import { Button, DropdownMenu, DropdownOption, Icon, Text, useThemeColors } from '@repo/shared/components';
import styled from 'styled-components/native';
import { View } from 'react-native';

type Props = {
  handleSort: (sortBy: SortBy) => void;
  comparator: Comparator;
};

const SortDirection = styled(Icon.ChevronDown)<{ $ascending: boolean }>`
  transform: rotate(${({ $ascending }) => ($ascending ? '180deg' : '0deg')});
`;

export const FileSortDropdown = ({ handleSort, comparator }: Props) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sortOptions: SortBy[] = ['name', 'size', 'date', 'type'];

  return (
    <DropdownMenu
      label={t('files.sort')}
      closeLabel={t('common.actions.close')}
      trigger={({ isOpen, toggle, menuId }) => (
        <Button
          variant="tertiary"
          size="small"
          onPress={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
        >
          {t(`sort.${comparator.sort}`)}
          <SortDirection size={18} color={colors.text.brand} $ascending={comparator.order === 1} />
        </Button>
      )}
    >
      {({ close, menuId }) => (
        <View nativeID={menuId} role="menu">
          {sortOptions.map((sort) => (
            <DropdownOption
              key={sort}
              role="menuitem"
              $selected={sort === comparator.sort}
              accessibilityState={{ selected: sort === comparator.sort }}
              onPress={() => {
                handleSort(sort);
                close();
              }}
            >
              <Text.S>{t(`sort.${sort}`)}</Text.S>
            </DropdownOption>
          ))}
        </View>
      )}
    </DropdownMenu>
  );
};
