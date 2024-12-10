import React, { useRef } from 'react';
import { View, Dimensions, Pressable } from 'react-native';
import { cn } from './cn';
import { useUi } from './UiProvider';
import { Text } from './text';

export type DropdownProps = {
  className?: string;
  children?: React.ReactNode;
  trigger: (ref: React.RefObject<View>, handleOpen: () => void) => React.ReactNode;
  visible?: boolean;
};

const FLIP_POINT = 0.65;
const SPACING = 5;

export const Dropdown = ({ className, trigger, children }: DropdownProps) => {
  const { openModal } = useUi();

  const triggerRef = useRef<View>(null);

  const handleOpen = () => {
    if (!triggerRef.current) return;

    triggerRef.current.measure((_1, _2, width, height, tx, ty) => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
      const bx = screenWidth - tx;
      const by = screenHeight - ty;
      const flipX = tx > screenWidth * FLIP_POINT;
      const flipY = ty + height > screenHeight * FLIP_POINT;
      const modal = (
        <View
          className={cn('absolute bg-layer-secondary rounded-md shadow-md min-w-24', className)}
          style={{
            ...(flipX ? { right: bx - width } : { left: tx }),
            ...(flipY ? { bottom: by + SPACING } : { top: ty + height + SPACING }),
          }}
        >
          {children}
        </View>
      );
      openModal(modal, { noLayout: true });
    });
  };

  return trigger(triggerRef, handleOpen);
};

type DropdownItemProps = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
};
export const DropdownItem = ({ label, icon, onPress }: DropdownItemProps) => {
  return (
    <Pressable key={label} className="flex-row gap-5 py-3 px-4 hover:bg-layer active:bg-layer" onPress={onPress}>
      {icon}
      <Text>{label}</Text>
    </Pressable>
  );
};
