import React from 'react';
import { Modal as RModal, View, Pressable } from 'react-native';
import { cn } from '../utils/cn';

export type ModalProps = {
  noLayout?: boolean;
  children?: React.ReactNode;
  onClose?: () => void;
};

// @TODO fix modal layout
export const Modal = ({ children, noLayout, onClose }: ModalProps) => {
  return (
    <View className="flex-1 absolute top-0 left-0 right-0 bottom-0">
      <RModal transparent visible animationType="fade" onRequestClose={onClose}>
        <Pressable
          className={cn('flex-1 items-center justify-center relative p-4', !noLayout && 'bg-black/60')}
          onPress={onClose}
        >
          {children}
        </Pressable>
      </RModal>
    </View>
  );
};
