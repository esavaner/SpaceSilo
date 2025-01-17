import { View } from 'react-native';
import { Button, cn } from '@repo/ui';
import { useTranslation } from 'react-i18next';

type Props = {
  okText: string;
  cancelText?: string;
  onOk: () => void;
  onCancel: () => void;
  className?: string;
};

export const ButtonGroup = ({ okText, cancelText, onOk, onCancel, className }: Props) => {
  const { t } = useTranslation();
  return (
    <View className={cn('flex flex-row gap-2 w-full mt-auto', className)}>
      <Button onPress={onCancel} variant="primaryOutline" className="flex-1">
        {cancelText || t('cancel')}
      </Button>
      <Button variant="primary" onPress={onOk} className="flex-1">
        {okText || t('ok')}
      </Button>
    </View>
  );
};
