import { FileEntity } from '@/api/generated';
import { ShareIcon, MoveIcon, CopyIcon, TrashIcon, Text, CloseIcon, Button } from '@repo/ui';
import { View } from 'react-native';

type ItemSelectionProps = {
  selectedItems: FileEntity[];
  handleClearSelection: () => void;
};

export const ItemSelection = ({ selectedItems, handleClearSelection }: ItemSelectionProps) => {
  const items = [
    { icon: <ShareIcon />, onPress: () => {} },
    { icon: <MoveIcon />, onPress: () => {} },
    { icon: <CopyIcon />, onPress: () => {} },
    { icon: <TrashIcon className="text-red-600" />, onPress: () => {} },
  ];

  return (
    <View className="flex-row px-4 h-10 items-center bg-layer-secondary gap-4">
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
