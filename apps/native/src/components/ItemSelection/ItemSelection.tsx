import { FileEntity } from '@/api/generated';
import { ShareIcon, MoveIcon, CopyIcon, TrashIcon, Text, CloseIcon, Button, useUi } from '@repo/ui';
import { View } from 'react-native';
import { FileRemoveModal } from '../modals/FileRemoveModal';
import { useTranslation } from 'react-i18next';

type ItemSelectionProps = {
  selectedItems: FileEntity[];
  handleClearSelection: () => void;
};

export const ItemSelection = ({ selectedItems, handleClearSelection }: ItemSelectionProps) => {
  const { t } = useTranslation();
  const { openModal } = useUi();

  const items = [
    { icon: <ShareIcon />, onPress: () => {} },
    { icon: <MoveIcon />, onPress: () => {} },
    { icon: <CopyIcon />, onPress: () => {} },
    {
      icon: <TrashIcon className="text-red-600" />,
      onPress: () => openModal(<FileRemoveModal files={selectedItems} />, { title: t('removeItem') }),
    },
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
