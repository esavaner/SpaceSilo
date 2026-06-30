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

export type GroupFilter = 'all' | 'owned' | 'personal' | 'shared' | 'with-members';

const filters: { label: string; value: GroupFilter }[] = [
  { label: 'All groups', value: 'all' },
  { label: 'Owned by me', value: 'owned' },
  { label: 'Personal', value: 'personal' },
  { label: 'Shared', value: 'shared' },
  { label: 'With members', value: 'with-members' },
];

type Props = {
  value: GroupFilter;
  onChange: (value: GroupFilter) => void;
};

export const GroupFilterDropdown = ({ value, onChange }: Props) => {
  const { ref, closeDropdown } = useDropdown();
  const selected = filters.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger ref={ref}>
        <Button variant="outline" size="sm">
          <Text>{selected?.label ?? 'Filter groups'}</Text>
          <Icon.Filter />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Filter groups</DropdownMenuLabel>
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
