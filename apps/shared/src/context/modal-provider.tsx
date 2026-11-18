import { createContext, useContext, useState } from 'react';

type ContextType = {
  openModal: (modal: React.ReactNode) => void;
  closeModal: () => void;
  currentModal?: React.ReactNode;
  isClosing: boolean;
};

type ModalProviderProps = {
  children?: React.ReactNode;
  // if true, ModalProvider will not render currentModal itself
  // use <ModalHost /> somewhere in the DOM tree instead
  disableDefaultHost?: boolean;
};

const ModalContext = createContext<ContextType | undefined>(undefined);

export const MODAL_ANIMATION_MS = 400;

export const ModalProvider = ({ children, disableDefaultHost }: ModalProviderProps) => {
  const [currentModal, setCurrentModal] = useState<React.ReactNode>();
  const [isClosing, setIsClosing] = useState(false);

  const openModal = (modal: React.ReactNode) => {
    setCurrentModal(modal);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCurrentModal(undefined);
      setIsClosing(false);
    }, MODAL_ANIMATION_MS);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, currentModal, isClosing }}>
      {children} {!disableDefaultHost && currentModal}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Error from Modal context api');
  }
  return context;
};

// render current modal somewhere instead of inside ModalProvider
export const ModalHost = () => {
  const { currentModal } = useModal();
  return currentModal;
};
