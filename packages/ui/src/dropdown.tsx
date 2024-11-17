import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View, Dimensions } from 'react-native';
import { cn } from './cn';

export type DropdownProps = {
  className?: string;
  modalClassName?: string;
  children?: React.ReactNode;
  trigger: React.ReactNode;
  visible?: boolean;
};

const FLIP_POINT = 0.65;

export const Dropdown = ({ className, modalClassName, trigger, children }: DropdownProps) => {
  const triggerRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [triggerPos, setTriggerPos] = useState({
    tx: 0,
    ty: 0,
    bx: 0,
    by: 0,
    width: 0,
    height: 0,
    flipX: false,
    flipY: false,
  });

  useEffect(() => {
    if (triggerRef.current && visible) {
      triggerRef.current.measure((_1, _2, width, height, tx, ty) => {
        const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
        setTriggerPos({
          tx,
          ty,
          bx: screenWidth - tx,
          by: screenHeight - ty,
          width,
          height,
          flipX: tx > screenWidth * FLIP_POINT,
          flipY: ty + height > screenHeight * FLIP_POINT,
        });
      });
    }
  }, [visible]);

  return (
    <>
      <Pressable
        className={cn(
          'w-min min-w-8 min-h-8 items-center justify-center rounded',
          'hover:bg-layer-secondary active:bg-layer-secondary focus:bg-layer-secondary',
          className
        )}
        onPress={() => setVisible(true)}
        ref={triggerRef}
      >
        {trigger}
      </Pressable>
      {visible && (
        <Modal visible={visible} onRequestClose={() => setVisible(false)} transparent={true} animationType="fade">
          <Pressable className="flex-1 bg-transparent relative" onPressIn={() => setVisible(false)}>
            <View
              className={cn('absolute bg-layer-secondary rounded shadow-md min-w-28', modalClassName)}
              style={{
                ...(triggerPos.flipX ? { right: triggerPos.bx - triggerPos.width } : { left: triggerPos.tx }),
                ...(triggerPos.flipY ? { bottom: triggerPos.by } : { top: triggerPos.ty + triggerPos.height }),
              }}
            >
              {children}
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
};
