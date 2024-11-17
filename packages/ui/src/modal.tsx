import React from 'react';
import { Modal as RModal, View, Text, Pressable } from 'react-native';

export type ModalProps = {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

export const Modal = ({ visible, onClose, children }: ModalProps) => {
  return (
    <RModal transparent={true} visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center backdrop-blur" onPressIn={onClose}>
        <View className="rounded bg-layer-secondary shadow-md min-w-48 min-h-36">
          <Pressable onPress={onClose}>
            <Text>X</Text>
          </Pressable>
          {children}
        </View>
      </Pressable>
    </RModal>
  );
};
