import { Comparator, SortBy } from '@/hooks/useFileList';
import { t } from 'i18next';
import { useMemo } from 'react';
import { Pressable } from 'react-native';
import { useUi } from '@/providers/UiProvider';
import { Text } from '../text';
import { Button } from '../button';
import { cn } from '../../utils/cn';
import { useDropdown } from '../dropdown';
import { ChevronDownIcon } from '../icons';

type Props = {
  handleSort: (sortBy: SortBy) => void;
  comparator: Comparator;
};

export const FileSortDropdown = ({ handleSort, comparator }: Props) => {
  const { ref, openDropdown } = useDropdown();
  const { closeModal } = useUi();

  const sortOptions = useMemo(
    () => [
      { label: t('sort.name'), value: 'name' as SortBy },
      { label: t('sort.size'), value: 'size' as SortBy },
      { label: t('sort.date'), value: 'date' as SortBy },
      { label: t('sort.type'), value: 'type' as SortBy },
    ],
    [t]
  );

  const onSort = (sortBy: SortBy) => {
    handleSort(sortBy);
    closeModal();
  };

  const dropdownItems = sortOptions.map((sort) => (
    <Pressable
      key={sort.value}
      onPress={() => onSort(sort.value)}
      className="flex-row gap-5 py-3 px-4 items-center hover:bg-background active:bg-background"
    >
      <Text>{sort.label}</Text>
      <ChevronDownIcon
        className={cn(
          'text-foreground hidden transition-all transform',
          comparator.sort === sort.value && 'block',
          comparator.order === 1 && 'rotate-180'
        )}
      />
    </Pressable>
  ));

  return (
    <Button ref={ref} onPress={() => openDropdown(<>{dropdownItems}</>)} variant="text" className="">
      <Text>{t(`sort.${comparator.sort}`)}</Text>
      <ChevronDownIcon
        className={cn('text-foreground transition-all transform', comparator.order === 1 && 'rotate-180')}
      />
    </Button>
  );
};
