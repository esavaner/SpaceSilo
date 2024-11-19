import React from 'react';
import { Pressable } from 'react-native';
import { Text } from './text';
import { AlertOctagonIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon } from './icons';
import { useUi } from './UiProvider';

export type ToastProps = {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success' | 'warning';
};

const icons: Record<ToastProps['type'], React.ReactNode> = {
  error: <AlertOctagonIcon className="text-red-600" />,
  info: <InfoIcon className="text-blue-600" />,
  success: <CheckCircleIcon className="text-green-600" />,
  warning: <AlertTriangleIcon className="text-yellow-600" />,
};

export const Toast = ({ id, message, type }: ToastProps) => {
  const { removeToast } = useUi();

  return (
    <Pressable
      className="flex-row p-4 gap-4 items-center rounded-md bg-layer-secondary"
      onPress={() => removeToast(id)}
    >
      {icons[type]}
      <Text>{message}</Text>
    </Pressable>
  );
};
