import { Button } from '@/components/general/button';
import { Icon } from '@/components/general/icon';
import { Text } from '@/components/general/text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './dropdown';
import { useDropdown } from './useDropdown';
import { useTranslation } from 'react-i18next';

export type GroupFilter = 'all' | 'owned' | 'personal' | 'shared' | 'with-members';

type Props = {
  value: GroupFilter;
  onChange: (value: GroupFilter) => void;
};

export const GroupFilterDropdown = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const { ref, closeDropdown } = useDropdown();
  const filters: { label: string; value: GroupFilter }[] = [
    { label: t('groups.filters.all'), value: 'all' },
    { label: t('groups.filters.owned'), value: 'owned' },
    { label: t('groups.filters.personal'), value: 'personal' },
    { label: t('groups.filters.shared'), value: 'shared' },
    { label: t('groups.filters.withMembers'), value: 'with-members' },
  ];
  const selected = filters.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger ref={ref}>
        <Button variant="outline" size="sm">
          <Text>{selected?.label ?? t('groups.filters.trigger')}</Text>
          <Icon.Filter />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('groups.filters.trigger')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => {
            onChange(nextValue as GroupFilter);
            closeDropdown();
          }}
        >
          {filters.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <Text>{option.label}</Text>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
