import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

export type DropdownProps = {
  className?: string;
  children: React.ReactNode;
  trigger: React.ReactNode;
  width?: number;
};

export const Dropdown = ({ className, trigger, width = 150, children }: DropdownProps) => {
  const triggerRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0 });

  useEffect(() => {
    if (triggerRef.current && visible) {
      triggerRef.current.measure((_1, _2, width, height, px, py) => {
        setPosition({
          x: px,
          y: py + height,
          width: width,
        });
      });
    }
  }, [visible]);

  return (
    <>
      <Pressable className="w-min" onPress={() => setVisible(true)} ref={triggerRef}>
        {trigger}
      </Pressable>
      {visible && (
        <Modal visible={visible} onRequestClose={() => setVisible(false)} transparent={true} animationType="fade">
          <Pressable
            className="flex-1 bg-transparent items-center justify-center relative"
            onPress={() => setVisible(false)}
          >
            <View
              className={`absolute bg-layer rounded-md shadow-md ${className}`}
              style={{
                top: position.y,
                left: position.x + position.width / 2 - width / 2,
                width,
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
