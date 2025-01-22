import React from 'react';
import { Modal as RModal, View, Pressable, TouchableWithoutFeedback } from 'react-native';
import { cn } from './cn';
import { Text } from './text';

export type ModalProps = {
  noLayout?: boolean;
  children?: React.ReactNode;
  onClose?: () => void;
};

export const Modal = ({ children, noLayout, onClose }: ModalProps) => {
  return (
    <View className="flex-1 absolute top-0 left-0 right-0 bottom-0 z-50">
      <RModal transparent visible animationType="fade" onRequestClose={onClose}>
        <Pressable
          className={cn('flex-1 items-center justify-center relative p-4', !noLayout && 'bg-black/60')}
          onPress={onClose}
        >
          <TouchableWithoutFeedback>{children}</TouchableWithoutFeedback>
        </Pressable>
      </RModal>
    </View>
  );
};

export const ModalTitle = ({ children }: { children: React.ReactNode }) => {
  return <Text className="text-xl min-h-8 mb-3 flex items-center">{children}</Text>;
};
