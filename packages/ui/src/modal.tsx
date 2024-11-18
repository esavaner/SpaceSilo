import React from 'react';
import { Modal as RModal, View, Pressable } from 'react-native';
import { CloseIcon } from './icons';
import { useUi } from './UiProvider';
import { cn } from './cn';
import { Text } from './text';

export type ModalProps = {
  id: string;
  title?: string;
  noLayout?: boolean;
  children?: React.ReactNode;
};

export const Modal = ({ id, title, children, noLayout }: ModalProps) => {
  const { currentModal, setCurrentModal } = useUi();

  const visible = currentModal === id;

  const onClose = () => {
    setCurrentModal(undefined);
  };

  return visible ? (
    <RModal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable className={cn('flex-1 items-center justify-center relative')} onPressIn={onClose}>
        {noLayout ? (
          children
        ) : (
          <View className="rounded bg-layer-secondary min-w-48 min-h-36 p-3">
            <Pressable onPress={onClose}>
              <Text>{title}</Text>
              <CloseIcon className="ml-auto text-content" />
            </Pressable>
            {children}
          </View>
        )}
      </Pressable>
    </RModal>
  ) : (
    <></>
  );
};
