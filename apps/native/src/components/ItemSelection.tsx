import { FileEntity } from '@/api/generated';
import { View } from 'react-native';
import { FileRemoveModal } from './modals/FileRemove.modal';
import { FileMoveCopyModal } from './modals/FileMoveCopy.modal';
import { Icon } from './general/icon';
import { useUi } from '@/providers/UiProvider';
import { Text } from './general/text';
import { Button } from './general/button';

type ItemSelectionProps = {
  path: string;
  selectedItems: FileEntity[];
  handleClearSelection: () => void;
};

export const ItemSelection = ({ path, selectedItems, handleClearSelection }: ItemSelectionProps) => {
  const { openModal } = useUi();

  const items = [
    { icon: <Icon.Share />, onPress: () => {} },
    { icon: <Icon.Copy />, onPress: () => openModal(<FileMoveCopyModal path={path} selectedItems={selectedItems} />) },
    {
      icon: <Icon.Trash className="text-red-600" />,
      onPress: () => openModal(<FileRemoveModal files={selectedItems} />),
    },
  ];

  return (
    <View className="flex-row w-full items-center gap-2">
      <Button variant="ghost" onPress={handleClearSelection} className="p-2">
        <Icon.Close />
      </Button>
      <Text className="mr-auto">{selectedItems.length} item(s) selected</Text>
      {items.map((item, index) => (
        <Button key={index} onPress={item.onPress} variant="ghost" className="p-2">
          {item.icon}
        </Button>
      ))}
    </View>
  );
};
