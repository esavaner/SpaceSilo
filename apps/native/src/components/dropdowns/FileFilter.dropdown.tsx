import { useDropdown, Button, Text, FilterIcon, Checkbox, useUi } from '@repo/ui';
import { ButtonGroup } from '../modals/ButtonGroup';
import { Pressable, View } from 'react-native';
import { GetGroupDto } from '@/api/generated';
import { useFilesContext } from '@/providers/FilesProvider';

type Props = {
  className?: string;
};

export const FileFilterDropdown = ({ className }: Props) => {
  const { openDropdown, ref } = useDropdown();

  return (
    <Button ref={ref} onPress={() => openDropdown(<FilterDropdown />)} variant="text" className={className}>
      <Text>Filter</Text>
      <FilterIcon />
    </Button>
  );
};

const FilterDropdown = () => {
  const { closeModal } = useUi();
  const { groupsPersonal, groupsShared, handleApplyGroupSelect, handleSelectGroup, selectedGroupIds } =
    useFilesContext();

  const handleApply = () => {
    closeModal();
    handleApplyGroupSelect();
  };

  return (
    <View className="p-3 gap-2">
      <Text>Personal</Text>
      {groupsPersonal.map((group) => (
        <FilterGroupItem
          key={group.id}
          group={group}
          onPress={handleSelectGroup}
          checked={selectedGroupIds.includes(group.id)}
        />
      ))}
      <Text>Groups</Text>
      {groupsShared.map((group) => (
        <FilterGroupItem
          key={group.id}
          group={group}
          onPress={handleSelectGroup}
          checked={selectedGroupIds.includes(group.id)}
        />
      ))}
      <ButtonGroup okText={'Apply'} onOk={handleApply} onCancel={closeModal} />
    </View>
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
