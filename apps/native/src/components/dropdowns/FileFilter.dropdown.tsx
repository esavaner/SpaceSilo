import { View } from 'react-native';
import { useFilesContext } from '@/providers/FilesProvider';
import { Icon } from '../general/icon';
import { Text } from '../general/text';
import { Button } from '../general/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from './dropdown';
import { useDropdown } from './useDropdown';
import { type GroupResponse } from '@repo/shared';
import { useTranslation } from 'react-i18next';

type Props = {
  className?: string;
};

export const FileFilterDropdown = ({ className }: Props) => {
  const { t } = useTranslation();
  const { ref, closeDropdown } = useDropdown();

  const { groupsPersonal, groupsShared, handleApplyGroupSelect, handleSelectGroup, selectedGroupIds } =
    useFilesContext();

  const handleApply = () => {
    handleApplyGroupSelect();
    closeDropdown();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger ref={ref}>
        <Button variant="ghost" className={className}>
          <Text>{t('files.filter.title')}</Text>
          <Icon.Filter />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-3">
        <Text>{t('files.filter.personal')}</Text>
        {groupsPersonal?.map((group) => (
          <FilterGroupItem
            key={group.id}
            group={group}
            onPress={handleSelectGroup}
            checked={selectedGroupIds.includes(group.id)}
          />
        ))}
        <Text>{t('files.filter.groups')}</Text>
        {groupsShared?.map((group) => (
          <FilterGroupItem
            key={group.id}
            group={group}
            onPress={handleSelectGroup}
            checked={selectedGroupIds.includes(group.id)}
          />
        ))}
        <View className="flex-row justify-end gap-2 mt-3">
          <Button variant="secondary" onPress={closeDropdown}>
            {t('common.actions.cancel')}
          </Button>
          <Button onPress={handleApply}>{t('common.actions.apply')}</Button>
        </View>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type FilterGroupItemProps = {
  group: GroupResponse;
  checked: boolean;
  onPress: (group: GroupResponse) => void;
};

const FilterGroupItem = ({ group, checked, onPress }: FilterGroupItemProps) => {
  return (
    <DropdownMenuCheckboxItem checked={checked} onCheckedChange={() => onPress(group)}>
      <Text>{group.name}</Text>
    </DropdownMenuCheckboxItem>
  );
};
