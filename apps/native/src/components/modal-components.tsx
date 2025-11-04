import React from 'react';
import { Pressable } from 'react-native';
import { CloseIcon } from './icons';
import { Button } from './button';
import { Text } from './text';
import { useUi } from '@/providers/UiProvider';
import { cn } from './cn';

type ModalLayoutProps = {
  children?: React.ReactNode;
  className?: string;
};

export const ModalLayout = ({ children, className }: ModalLayoutProps) => {
  const { closeModal } = useUi();
  return (
    <Pressable
      className={cn(
        'relative rounded-md bg-layer-secondary min-w-56 min-h-36 p-4 w-min max-h-[70%] cursor-default',
        className
      )}
      onPress={() => {}}
    >
      <Button onPress={closeModal} className="absolute top-3 right-3 z-10" variant="icon">
        <CloseIcon />
      </Button>
      {children}
    </Pressable>
  );
};

type ModalTitleProps = {
  children?: React.ReactNode;
  className?: string;
};

export const ModalTitle = ({ children, className }: ModalTitleProps) => {
  return <Text className={cn('text-xl min-h-8 mb-3 flex items-center', className)}>{children}</Text>;
};
