import { Dialog } from '@/components/modals/dialog';
import React, { createContext, useContext, useState } from 'react';

type ModalProps = React.ComponentProps<typeof Dialog>;

type ContextType = {
  openModal: (modal?: React.ReactNode, options?: ModalProps) => void;
  closeModal: () => void;
};

export const UiContext = createContext<ContextType | undefined>(undefined);

type UiProviderProps = {
  children: React.ReactNode;
};

export const UiProvider = ({ children }: UiProviderProps) => {
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

  return (
    <UiContext.Provider value={{ openModal, closeModal }}>
      {children}
      {currentModal && (
        <Dialog {...modalOptions} open onOpenChange={closeModal}>
          {currentModal}
        </Dialog>
      )}
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
