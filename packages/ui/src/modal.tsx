import React from 'react';
import { Modal as RModal, View, Pressable, TouchableWithoutFeedback } from 'react-native';
import { CloseIcon } from './icons';
import { useUi } from './UiProvider';
import { cn } from './cn';
import { Text } from './text';
import { Button } from './button';

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
      <Pressable
        className={cn('flex-1 items-center justify-center relative', !noLayout && 'bg-black/60')}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          {noLayout ? (
            children
          ) : (
            <View className="rounded-md bg-layer-secondary min-w-48 min-h-36 p-4">
              <View className="flex flex-row mb-3">
                <Text className="text-lg">{title}</Text>
                <Button onPress={onClose} className="ml-auto" variant="text">
                  <CloseIcon />
                </Button>
              </View>

              {children}
            </View>
          )}
        </TouchableWithoutFeedback>
      </Pressable>
    </RModal>
  ) : (
    <></>
  );
};
