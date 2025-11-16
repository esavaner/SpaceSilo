import { Dialog } from '@/components/modals/dialog';
import { Toast, ToastProps } from '@/components/toast';
import React, { createContext, useContext, useState } from 'react';
import { View } from 'react-native';

type ModalProps = React.ComponentProps<typeof Dialog>;

type ContextType = {
  openModal: (modal?: React.ReactNode, options?: ModalProps) => void;
  closeModal: () => void;
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
  const [toasts, setToasts] = useState<Omit<ToastProps, 'removeToast'>[]>([]);
  const [currentModal, setCurrentModal] = useState<React.ReactNode>();
  const [modalOptions, setModalOptions] = useState<ModalProps>();

  const openModal = (modal: React.ReactNode, options: ModalProps = {}) => {
    setModalOptions(options);
    setCurrentModal(modal);
  };

  const closeModal = () => {
    setCurrentModal(undefined);
    setModalOptions(undefined);
  };

  const addToast = (toast: Omit<ToastProps, 'id' | 'removeToast'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 5000);
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
    <UiContext.Provider value={{ openModal, closeModal, toast, removeToast }}>
      {children}
      {currentModal && (
        <Dialog {...modalOptions} open onOpenChange={closeModal}>
          {currentModal}
        </Dialog>
      )}
      <View className="fixed bottom-4 right-4 gap-2 bg-transparent">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} removeToast={removeToast} />
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
