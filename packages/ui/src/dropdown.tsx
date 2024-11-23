import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { cn } from './cn';
import { Modal } from './modal';
import { useUi } from './UiProvider';
import { Button } from './button';

export type DropdownProps = {
  id: string;
  className?: string;
  modalClassName?: string;
  children?: React.ReactNode;
  trigger: React.ReactNode;
  visible?: boolean;
};

const FLIP_POINT = 0.65;

export const Dropdown = ({ id, className, modalClassName, trigger, children }: DropdownProps) => {
  const { currentModal, setCurrentModal } = useUi();

  const visible = currentModal === id;
  const triggerRef = useRef<View>(null);
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

  const toggleVisible = () => {
    setCurrentModal(visible ? undefined : id);
  };

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
      <Button className={cn(className)} onPress={toggleVisible} variant="text" ref={triggerRef}>
        {trigger}
      </Button>
      <Modal id={id} noLayout>
        <View
          className={cn('absolute bg-layer-secondary rounded-md shadow-md min-w-24', modalClassName)}
          style={{
            ...(triggerPos.flipX ? { right: triggerPos.bx - triggerPos.width } : { left: triggerPos.tx }),
            ...(triggerPos.flipY ? { bottom: triggerPos.by } : { top: triggerPos.ty + triggerPos.height }),
          }}
        >
          {children}
        </View>
      </Modal>
    </>
  );
};
