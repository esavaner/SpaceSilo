import { useUi } from '@/providers/UiProvider';
import { GroupAddMembersModal } from '../modals/GroupAddMembers.modal';
import { GroupEditModal } from '../modals/GroupEdit.modal';
import { GroupRemoveModal } from '../modals/GroupRemove.modal';
import { Button } from '../general/button';
import { Icon } from '../general/icon';
import { Text } from '../general/text';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown';
import { type GroupListItem } from '@/hooks/useGroupList';

type Props = {
  group: GroupListItem;
  canManage: boolean;
};

export const GroupOptionsDropdown = ({ group, canManage }: Props) => {
  const { openModal } = useUi();

  if (!canManage) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon">
          <Icon.Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        insets={{
          right: 24,
        }}
      >
        <DropdownMenuItem onPress={() => openModal(<GroupEditModal group={group} />)}>
          <Icon.Edit />
          <Text>Edit group</Text>
        </DropdownMenuItem>
        <DropdownMenuItem onPress={() => openModal(<GroupAddMembersModal group={group} />)}>
          <Icon.Add />
          <Text>Add members</Text>
        </DropdownMenuItem>
        <DropdownMenuItem onPress={() => openModal(<GroupRemoveModal group={group} />)} variant="destructive">
          <Icon.Trash />
          <Text>Remove group</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
