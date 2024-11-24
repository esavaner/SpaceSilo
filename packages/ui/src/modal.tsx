import React from 'react';
import { Modal as RModal, View, Pressable, TouchableWithoutFeedback } from 'react-native';
import { CloseIcon } from './icons';
import { cn } from './cn';
import { Text } from './text';
import { Button } from './button';

export type ModalProps = {
  title?: string;
  noLayout?: boolean;
  children?: React.ReactNode;
  onClose?: () => void;
};

export const Modal = ({ title, children, noLayout, onClose }: ModalProps) => {
  return (
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
  );
};
