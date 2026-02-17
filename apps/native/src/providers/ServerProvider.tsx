import { createContext, useContext, useEffect, useState } from 'react';
import { type ServerType } from '../api/_client';
import { CoreApiClient } from '../api/core.client';
import { storage } from '../utils/storage';

export type ServerConnection = {
  id: string;
  type: ServerType;
  baseUrl: string;
  label: string;
  disabled: boolean;
};

export type ServerConnectionWithClient = ServerConnection & {
  client: CoreApiClient;
};

export type LoginAndSaveServerInput = {
  type: ServerType;
  baseUrl: string;
  email: string;
  password: string;
  label?: string;
};

export type ReconnectServerInput = {
  serverId: string;
  email: string;
  password: string;
};

type ServerContextType = {
  isLoading: boolean;
  servers: ServerConnectionWithClient[];
  enabledServers: ServerConnectionWithClient[];
  loginAndSaveServer: (input: LoginAndSaveServerInput) => Promise<ServerConnectionWithClient>;
  removeServer: (serverId: string) => Promise<boolean>;
  setServerEnabled: (serverId: string, enabled: boolean) => Promise<void>;
};

const SERVER_LIST_KEY = 'servers';

export const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [servers, setServers] = useState<ServerConnectionWithClient[]>([]);

  const createServerId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  const readServersFromStorage = async () => {
    try {
      const raw = await storage.get(SERVER_LIST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return (Array.isArray(parsed) ? parsed : []) as ServerConnection[];
    } catch {
      return [];
    }
  };

  const writeServersToStorage = async (servers: ServerConnection[]) => {
    await storage.set(SERVER_LIST_KEY, JSON.stringify(servers));
  };

  const updateServersInStorage = async (updater: (current: ServerConnection[]) => ServerConnection[]) => {
    const oldServers = await readServersFromStorage();
    const newServers = updater(oldServers);
    await writeServersToStorage(newServers);
    return newServers;
  };

  const updateRefreshTokenInStorage = async (serverId: string, token: string | undefined) => {
    await updateServersInStorage((currentServers) =>
      currentServers.map((s) => (s.id === serverId ? { ...s, refreshToken: token } : s))
    );
  };

  const loginAndSaveServer = async ({
    type,
    label,
    baseUrl,
    email,
    password,
  }: LoginAndSaveServerInput): Promise<ServerConnectionWithClient> => {
    let saved: ServerConnection | undefined;
    await updateServersInStorage((currentServers) => {
      const existingIndex = currentServers.findIndex(
        (s) => s.type === type && s.baseUrl === baseUrl && s.label === label
      );
      const newServers = [...currentServers];
      if (existingIndex >= 0) {
        saved = newServers[existingIndex];
      } else {
        saved = {
          id: createServerId(),
          type,
          label: label || baseUrl || email,
          baseUrl,
          disabled: false,
        };
        newServers.push(saved);
      }
      return newServers;
    });

    if (!saved) throw new Error('Unable to save server connection');

    const newServer = {
      ...saved,
      client: new CoreApiClient({
        baseUrl,
        email,
        password,
        saveRefreshToken: (token) => updateRefreshTokenInStorage(saved!.id, token),
      }),
    };

    setServers((prev) => [...prev, newServer]);
    return newServer;
  };

  const rebuildServers = async () => {
    const savedServers = await readServersFromStorage();
    const newServers = savedServers.map((s) => ({
      ...s,
      client: new CoreApiClient({
        baseUrl: s.baseUrl,
        saveRefreshToken: (token) => updateRefreshTokenInStorage(s.id, token),
      }),
    }));
    setServers(newServers);
  };

  useEffect(() => {
    rebuildServers().finally(() => setIsLoading(false));
  }, []);

  const removeServer = async (serverId: string) => {
    let removed = false;
    await updateServersInStorage((currentServers) => {
      removed = currentServers.some((s) => s.id === serverId);
      return currentServers.filter((s) => s.id !== serverId);
    });

    if (!removed) return false;
    setServers((prev) => prev.filter((s) => s.id !== serverId));
    return true;
  };

  const setServerEnabled = async (serverId: string, enabled: boolean) => {
    await updateServersInStorage((currentServers) =>
      currentServers.map((item) => (item.id === serverId ? { ...item, disabled: !enabled } : item))
    );
    setServers((prev) => prev.map((item) => (item.id === serverId ? { ...item, disabled: !enabled } : item)));
  };

  const enabledServers = servers.filter((s) => !s.disabled);

  return (
    <ServerContext.Provider
      value={{
        isLoading,
        servers,
        enabledServers,
        loginAndSaveServer,
        removeServer,
        setServerEnabled,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServerContext = () => {
  const context = useContext(ServerContext);
  if (!context) throw new Error('useServerContext must be used within a ServerProvider');
  return context;
};
