import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../general/button';
import { cn } from '../../utils/cn';

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
    <View className={cn('flex flex-row gap-3 w-full mt-auto justify-center', className)}>
      <Button onPress={onCancel} variant="secondary">
        {cancelText || t('cancel')}
      </Button>
      <Button onPress={onOk}>{okText || t('ok')}</Button>
    </View>
  );
};
