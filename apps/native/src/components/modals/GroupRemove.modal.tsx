import { DialogDescription, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { DialogFooter } from './dialog-footer';
import { useGroupActions } from '@/hooks/useGroupActions';
import { Text } from '../general/text';
import { type GroupListItem } from '@/hooks/useGroupList';

type GroupRemoveModalProps = {
  group: Pick<GroupListItem, 'id' | 'name' | 'serverId'>;
  onRemoved?: () => void;
};

export const GroupRemoveModal = ({ group, onRemoved }: GroupRemoveModalProps) => {
  const { removeGroup, isPending } = useGroupActions();

  const handleRemove = () => {
    removeGroup(
      { id: group.id, serverId: group.serverId },
      {
        onSuccess: () => onRemoved?.(),
      }
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Remove group</DialogTitle>
        <DialogDescription>This permanently removes the group and its membership references.</DialogDescription>
      </DialogHeader>
      <Text>{group.name}</Text>
      <Text className="text-sm text-muted-foreground">#{group.id}</Text>
      <DialogFooter okText="Remove" onOk={handleRemove} loading={isPending} />
    </DialogContent>
  );
};
