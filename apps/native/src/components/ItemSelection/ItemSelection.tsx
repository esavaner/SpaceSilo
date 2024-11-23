import { FileEntity } from '@/api/generated';
import { ShareIcon, MoveIcon, CopyIcon, TrashIcon, Text, CloseIcon, Button } from '@repo/ui';
import { View } from 'react-native';

type ItemSelectionProps = {
  selectedItems: FileEntity[];
  handleClearSelection: () => void;
};

export const ItemSelection = ({ selectedItems, handleClearSelection }: ItemSelectionProps) => {
  return (
    <View className="flex-row px-4 h-10 items-center bg-layer-secondary gap-4">
      <Button variant="text">
        <CloseIcon onPress={handleClearSelection} />
      </Button>
      <Text className="mr-auto">{selectedItems.length} item(s) selected</Text>
      <ShareIcon />
      <MoveIcon />
      <CopyIcon />
      <TrashIcon className="text-red-600" />
    </View>
  );
};
