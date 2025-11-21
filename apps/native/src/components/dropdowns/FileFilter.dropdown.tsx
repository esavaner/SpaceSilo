import { Pressable } from 'react-native';
import { GetGroupDto } from '@/api/generated';
import { useFilesContext } from '@/providers/FilesProvider';
import { Checkbox } from '../checkbox';
import { FilterIcon } from '../icons';
import { Text } from '../general/text';
import { Button } from '../general/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown';

type Props = {
  className?: string;
};

export const FileFilterDropdown = ({ className }: Props) => {
  const { groupsPersonal, groupsShared, handleApplyGroupSelect, handleSelectGroup, selectedGroupIds } =
    useFilesContext();

  const handleApply = () => {
    handleApplyGroupSelect();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" className={className}>
          <Text>Filter</Text>
          <FilterIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-3">
        <Text>Personal</Text>
        {groupsPersonal?.map((group) => (
          <FilterGroupItem
            key={group.id}
            group={group}
            onPress={handleSelectGroup}
            checked={selectedGroupIds.includes(group.id)}
          />
        ))}
        <Text>Groups</Text>
        {groupsShared?.map((group) => (
          <FilterGroupItem
            key={group.id}
            group={group}
            onPress={handleSelectGroup}
            checked={selectedGroupIds.includes(group.id)}
          />
        ))}
        {/* <Dropdown */}
        {/* <ButtonGroup okText={'Apply'} onOk={handleApply} /> */}
        <Button onPress={handleApply}>Apply</Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type FilterGroupItemProps = {
  group: GetGroupDto;
  checked: boolean;
  onPress: (group: GetGroupDto) => void;
};

const FilterGroupItem = ({ group, checked, onPress }: FilterGroupItemProps) => {
  return (
    <Pressable onPress={() => onPress(group)} className="flex-row gap-3 px-4 justify-between items-center">
      <Text>{group.name}</Text>
      <Checkbox checked={checked} onChange={() => onPress(group)} />
    </Pressable>
  );
};
