import React from 'react';
import { Pressable } from 'react-native';
import { Text } from './text';
import { Icon } from './general/icon';

export type ToastProps = {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success' | 'warning';
  removeToast: (id: string) => void;
};

const icons: Record<ToastProps['type'], React.ReactNode> = {
  error: <Icon.AlertOctagon className="text-red-600" />,
  info: <Icon.Info className="text-blue-600" />,
  success: <Icon.CheckCircle className="text-green-600" />,
  warning: <Icon.AlertTriangle className="text-yellow-600" />,
};

export const Toast = ({ id, message, removeToast, type }: ToastProps) => {
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
