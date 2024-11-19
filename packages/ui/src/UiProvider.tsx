import React, { createContext, useContext, useState } from 'react';
import { Toast, ToastProps } from './toast';
import { View } from 'react-native';

type ContextType = {
  currentModal?: string;
  setCurrentModal: (modal?: string) => void;
  removeToast: (id: string) => void;
  toast: {
    error: (message: string) => void;
    info: (message: string) => void;
    success: (message: string) => void;
    warning: (message: string) => void;
  };
};

export const UiContext = createContext<ContextType | undefined>(undefined);

type UiProviderProps = {
  children: React.ReactNode;
};

export const UiProvider = ({ children }: UiProviderProps) => {
  const [currentModal, setCurrentModal] = useState<string>();
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    setToasts((prev) => [...prev, { ...toast, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    error: (message: string) => addToast({ message, type: 'error' }),
    info: (message: string) => addToast({ message, type: 'info' }),
    success: (message: string) => addToast({ message, type: 'success' }),
    warning: (message: string) => addToast({ message, type: 'warning' }),
  };

  return (
    <UiContext.Provider value={{ currentModal, setCurrentModal, toast, removeToast }}>
      {children}
      <View className="fixed bottom-0 right-0 p-4 gap-2">
        {toasts.map((toast, index) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </View>
    </UiContext.Provider>
  );
};

export const useUi = () => {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return context;
};
