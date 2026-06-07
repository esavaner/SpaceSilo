import { type UserResponse } from '@repo/shared';
import { createContext, useContext, useState } from 'react';

type UserContextType = {
  user?: UserResponse;
  setUser: (user: UserResponse) => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

type UserProviderProps = {
  children: React.ReactNode;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<UserResponse>();

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
