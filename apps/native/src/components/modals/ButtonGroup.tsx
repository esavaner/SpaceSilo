import { View } from 'react-native';
import { Button } from '@repo/ui';
import { useTranslation } from 'react-i18next';

type Props = {
  okText: string;
  cancelText?: string;
  onOk: () => void;
  onCancel: () => void;
};

export const ButtonGroup = ({ okText, cancelText, onOk, onCancel }: Props) => {
  const { t } = useTranslation();
  return (
    <View className="flex flex-row gap-2 w-full mt-auto">
      <Button onPress={onCancel} variant="primaryOutline" className="flex-1">
        {cancelText || t('cancel')}
      </Button>
      <Button variant="primary" onPress={onOk} className="flex-1">
        {okText || t('ok')}
      </Button>
    </View>
  );
};
