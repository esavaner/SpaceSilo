import { useTranslation } from 'react-i18next';
import { Button } from '../general/button';
import { DialogClose, DialogFooter as Footer } from './dialog';

type Props = {
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
  className?: string;
};

export const DialogFooter = ({ okText, cancelText, onOk, onCancel, className }: Props) => {
  const { t } = useTranslation();
  return (
    <Footer className={className}>
      <DialogClose asChild>
        <Button onPress={onCancel} variant="secondary">
          {cancelText || t('cancel')}
        </Button>
      </DialogClose>
      <Button onPress={onOk}>{okText || t('ok')}</Button>
    </Footer>
  );
};
