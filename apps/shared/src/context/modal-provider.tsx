import { Fragment, createContext, useCallback, useContext, useRef, useState } from 'react';

type ContextType = {
  openModal: (modal: React.ReactNode) => void;
  closeModal: () => void;
  currentModal?: React.ReactNode;
  isClosing: boolean;
  completeClose: () => void;
};

type ModalProviderProps = {
  children?: React.ReactNode;
  // if true, ModalProvider will not render currentModal itself
  // use <ModalHost /> somewhere in the component tree instead
  disableDefaultHost?: boolean;
};

export const ModalContext = createContext<ContextType | undefined>(undefined);

export const ModalProvider = ({ children, disableDefaultHost }: ModalProviderProps) => {
  const [state, setState] = useState<{ currentModal: React.ReactNode; id: number; isClosing: boolean }>();
  const nextId = useRef(0);

  const openModal = useCallback((modal: React.ReactNode) => {
    const id = nextId.current++;
    setState({ currentModal: <Fragment key={id}>{modal}</Fragment>, id, isClosing: false });
  }, []);

  const closeModal = useCallback(() => {
    setState((current) => (current && !current.isClosing ? { ...current, isClosing: true } : current));
  }, []);

  const id = state?.id;
  const completeClose = useCallback(() => {
    setState((current) => (current?.id === id && current?.isClosing ? undefined : current));
  }, [id]);

  return (
    <ModalContext.Provider
      value={{ openModal, closeModal, currentModal: state?.currentModal, isClosing: !!state?.isClosing, completeClose }}
    >
      {children}
      {!disableDefaultHost && state?.currentModal}
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
