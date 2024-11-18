import React, { createContext, useContext, useState } from 'react';

type ContextType = {
  currentModal?: string;
  setCurrentModal: (modal?: string) => void;
};

export const UiContext = createContext<ContextType | undefined>(undefined);

type UiProviderProps = {
  children: React.ReactNode;
};

export const UiProvider = ({ children }: UiProviderProps) => {
  const [currentModal, setCurrentModal] = useState<string>();

  return <UiContext.Provider value={{ currentModal, setCurrentModal }}>{children}</UiContext.Provider>;
};

export const useUi = () => {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useUi must be used within a UiProvider');
  }
  return context;
};
