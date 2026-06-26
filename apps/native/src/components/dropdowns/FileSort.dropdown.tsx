import { Comparator, SortBy } from '@/hooks/useFileList';
import { t } from 'i18next';
import { Text } from '../general/text';
import { Button } from '../general/button';
import { cn } from '../../utils/cn';
import { Icon } from '../general/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './dropdown';
import { useDropdown } from './useDropdown';

type Props = {
  handleSort: (sortBy: SortBy) => void;
  comparator: Comparator;
};

export const FileSortDropdown = ({ handleSort, comparator }: Props) => {
  const { ref, closeDropdown } = useDropdown();

  const sortOptions = [
    { label: t('sort.name'), value: 'name' as SortBy },
    { label: t('sort.size'), value: 'size' as SortBy },
    { label: t('sort.date'), value: 'date' as SortBy },
    { label: t('sort.type'), value: 'type' as SortBy },
  ];

  const onSort = (sortBy: SortBy) => {
    handleSort(sortBy);
    closeDropdown();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger ref={ref}>
        <Button variant="ghost">
          <Text>{t(`sort.${comparator.sort}`)}</Text>
          <Icon.ChevronDown className={cn('transition-all transform', comparator.order === 1 && 'rotate-180')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={comparator.sort} onValueChange={(value) => onSort(value as SortBy)}>
          {sortOptions.map((sort) => (
            <DropdownMenuRadioItem key={sort.value} value={sort.value}>
              <Text>{sort.label}</Text>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
