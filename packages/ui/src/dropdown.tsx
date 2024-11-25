import React, { useCallback, useMemo } from 'react';
import { useEffect, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { cn } from './cn';
import { useUi } from './UiProvider';
import { Button } from './button';

export type DropdownProps = {
  className?: string;
  modalClassName?: string;
  children?: React.ReactNode;
  trigger: React.ReactNode;
  visible?: boolean;
};

const FLIP_POINT = 0.65;

export const Dropdown = ({ className, modalClassName, trigger, children }: DropdownProps) => {
  const { openModal } = useUi();

  const triggerRef = useRef<View>(null);

  const handleOpenModal = () => {
    if (!triggerRef.current) return;

    triggerRef.current.measure((_1, _2, width, height, tx, ty) => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
      const bx = screenWidth - tx;
      const by = screenHeight - ty;
      const flipX = tx > screenWidth * FLIP_POINT;
      const flipY = ty + height > screenHeight * FLIP_POINT;
      const modal = (
        <View
          className={cn('absolute bg-layer-secondary rounded-md shadow-md min-w-24', modalClassName)}
          style={{
            ...(flipX ? { right: bx - width } : { left: tx }),
            ...(flipY ? { bottom: by } : { top: ty + height }),
          }}
        >
          {children}
        </View>
      );
      openModal(modal, { noLayout: true });
    });
  };

  return (
    <Button className={cn(className)} onPress={handleOpenModal} variant="text" ref={triggerRef}>
      {trigger}
    </Button>
  );
};
