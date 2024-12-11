import { FileEntity } from '@/api/generated';
import { ShareIcon, MoveIcon, CopyIcon, TrashIcon, Text, CloseIcon, Button, useUi } from '@repo/ui';
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
    { icon: <MoveIcon />, onPress: () => {} },
    { icon: <CopyIcon />, onPress: () => openModal(<FileMoveCopyModal path={path} selectedItems={selectedItems} />) },
    {
      icon: <TrashIcon className="text-red-600" />,
      onPress: () => openModal(<FileRemoveModal files={selectedItems} />),
    },
  ];

  return (
    <View className="flex-row px-5 h-10 items-center bg-layer-secondary gap-2">
      <Button variant="text" onPress={handleClearSelection}>
        <CloseIcon />
      </Button>
      <Text className="mr-auto">{selectedItems.length} item(s) selected</Text>
      {items.map((item, index) => (
        <Button key={index} onPress={item.onPress} variant="text">
          {item.icon}
        </Button>
      ))}
    </View>
  );
};
