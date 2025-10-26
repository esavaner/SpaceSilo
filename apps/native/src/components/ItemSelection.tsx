import { FileEntity } from '@/api/generated';
import { ShareIcon, MoveIcon, CopyIcon, TrashIcon, Text, CloseIcon, Button, useUi } from '@repo/shared';
import { View } from 'react-native';
import { FileRemoveModal } from './modals/FileRemove.modal';
import { FileMoveCopyModal } from './modals/FileMoveCopy.modal';

type ItemSelectionProps = {
  path: string;
  selectedItems: FileEntity[];
  handleClearSelection: () => void;
};

export const ItemSelection = ({ path, selectedItems, handleClearSelection }: ItemSelectionProps) => {
  const { openModal } = useUi();

  const items = [
    { icon: <ShareIcon />, onPress: () => {} },
    { icon: <CopyIcon />, onPress: () => openModal(<FileMoveCopyModal path={path} selectedItems={selectedItems} />) },
    {
      icon: <TrashIcon className="text-red-600" />,
      onPress: () => openModal(<FileRemoveModal files={selectedItems} />),
    },
  ];

  return (
    <View className="flex-row w-full items-center gap-2">
      <Button variant="icon" onPress={handleClearSelection}>
        <CloseIcon />
      </Button>
      <Text className="mr-auto">{selectedItems.length} item(s) selected</Text>
      {items.map((item, index) => (
        <Button key={index} onPress={item.onPress} variant="icon">
          {item.icon}
        </Button>
      ))}
    </View>
  );
};
