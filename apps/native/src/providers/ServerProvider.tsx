import { createContext, useContext, useEffect, useState } from 'react';
import { ApiClient, endpoints } from '../api/_client';
import { storage } from '../utils/storage';
import { type AuthResponse } from '@repo/shared';

export type CoreServer = AuthResponse & {
  id: string;
  baseUrl: string;
  label: string;
  disabled?: boolean;
};

export type CoreServerWithClient = CoreServer & {
  client: ApiClient;
};

export type LoginAndSaveServerInput = {
  baseUrl: string;
  email: string;
  label?: string;
  password: string;
};

type ServerContextType = {
  isLoading: boolean;
  servers: CoreServerWithClient[];
  enabledServers: CoreServerWithClient[];
  rebuildServers: (newServers?: CoreServer[]) => Promise<void>;
  loginAndSaveServer: (input: LoginAndSaveServerInput) => Promise<CoreServerWithClient>;
  removeServer: (serverId: string) => Promise<boolean>;
  setServerEnabled: (serverId: string, enabled: boolean) => Promise<void>;
};

const SERVER_LIST_KEY = 'servers';

export const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [servers, setServers] = useState<CoreServerWithClient[]>([]);

  const createServerId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  const readServersFromStorage = async (): Promise<CoreServer[]> => {
    try {
      const raw = await storage.get(SERVER_LIST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeServersToStorage = async (servers: CoreServer[]) => {
    await storage.set(SERVER_LIST_KEY, JSON.stringify(servers));
  };

  const updateServersInStorage = async (updater: (current: CoreServer[]) => CoreServer[]) => {
    const oldServers = await readServersFromStorage();
    const newServers = updater(oldServers);
    await writeServersToStorage(newServers);
    return newServers;
  };

  const withClient = (server: CoreServer): CoreServerWithClient => ({
    ...server,
    client: new ApiClient({
      baseUrl: server.baseUrl,
      accessToken: server.accessToken,
      refreshTokensInStorage: async (accessToken, refreshToken) => {
        const newSerwers = await updateServersInStorage((currentServers) =>
          currentServers.map((item) =>
            item.id === server.id
              ? {
                  ...item,
                  accessToken,
                  refreshToken,
                }
              : item
          )
        );
        rebuildServers(newSerwers);
      },
    }),
  });

  const rebuildServers = async (newServers?: CoreServer[]) => {
    const savedServers = newServers ?? (await readServersFromStorage());
    setServers(savedServers.map(withClient));
  };

  const loginAndSaveServer = async ({
    baseUrl: url,
    email: loginEmail,
    password,
    label,
  }: LoginAndSaveServerInput): Promise<CoreServerWithClient> => {
    const email = loginEmail.trim();
    const baseUrl = url.trim().replace(/\/+$/, '');

    const res = await fetch(`${baseUrl}${endpoints.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Login failed: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const result = (await res.json()) as AuthResponse;

    let saved: CoreServer | null = null;

    await updateServersInStorage((currentServers) => {
      const existingIndex = currentServers.findIndex((s) => s.baseUrl === baseUrl && s.user.email === email);
      const newServers = [...currentServers];

      if (existingIndex >= 0) {
        saved = {
          ...newServers[existingIndex],
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        };
        newServers[existingIndex] = saved;
      } else {
        saved = {
          id: createServerId(),
          label: label?.trim() || baseUrl,
          baseUrl,
          disabled: false,
          ...result,
        };
        newServers.push(saved);
      }

      return newServers;
    });

    return withClient(saved!);
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
    await rebuildServers();
    return true;
  };

  const setServerEnabled = async (serverId: string, enabled: boolean) => {
    await updateServersInStorage((currentServers) =>
      currentServers.map((item) => (item.id === serverId ? { ...item, disabled: !enabled } : item))
    );
    await rebuildServers();
  };

  const enabledServers = servers.filter((s) => !s.disabled);

  return (
    <ServerContext.Provider
      value={{
        isLoading,
        servers,
        enabledServers,
        rebuildServers,
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
