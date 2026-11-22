import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClientStatus, type ServerType } from '../api/_client';
import { CoreApiClient, withSessionLock } from '../api/core.client';
import { storage } from '../utils/storage';
import { createId } from '../utils/common';

export type ServerConnection = {
  id: string;
  type: ServerType;
  baseUrl: string;
  label: string;
  disabled: boolean;
  refreshToken?: string;
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
  allServers: ServerConnectionWithClient[];
  loginAndSaveServer: (input: LoginAndSaveServerInput) => Promise<ServerConnectionWithClient>;
  removeServer: (serverId: string) => Promise<boolean>;
  setServerEnabled: (serverId: string, enabled: boolean) => Promise<void>;
};

const SERVER_LIST_KEY = 'servers';

export const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [allServers, setServers] = useState<ServerConnectionWithClient[]>([]);
  const queryClient = useQueryClient();
  const storageWrites = useRef<Promise<void>>(Promise.resolve());
  const activeClients = useRef(new Map<string, CoreApiClient>());
  const restoreStarted = useRef(false);

  const readServersFromStorage = async () => {
    const raw = await storage.get(SERVER_LIST_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Stored server connections are invalid');
    return parsed as ServerConnection[];
  };

  const writeServersToStorage = async (servers: ServerConnection[]) => {
    await storage.set(SERVER_LIST_KEY, JSON.stringify(servers));
  };

  const updateServersInStorage = (updater: (current: ServerConnection[]) => ServerConnection[]) => {
    const update = storageWrites.current.then(async () => {
      const write = async () => {
        const oldServers = await readServersFromStorage();
        const newServers = updater(oldServers);
        await writeServersToStorage(newServers);
        return newServers;
      };
      if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request('spacesilo-server-storage', write);
      }
      return write();
    });
    storageWrites.current = update.then(
      () => undefined,
      () => undefined
    );
    return update;
  };

  const clearServerQueries = (serverId: string) => {
    const referencesServer = (value: unknown): boolean =>
      value === serverId || (Array.isArray(value) && value.some(referencesServer));
    queryClient.removeQueries({ predicate: (query) => referencesServer(query.queryKey) });
  };

  const onClientStatusChange = (serverId: string, client: CoreApiClient, status: ClientStatus) => {
    if (activeClients.current.get(serverId) !== client) return;
    if (status === ClientStatus.LOGGED_OUT) clearServerQueries(serverId);
    setServers((current) =>
      current.map((server) =>
        server.id === serverId
          ? { ...server, ...(status === ClientStatus.LOGGED_OUT ? { refreshToken: undefined } : {}) }
          : server
      )
    );
  };

  const updateRefreshTokenInStorage = async (serverId: string, client: CoreApiClient, token: string | undefined) => {
    await updateServersInStorage((currentServers) => {
      if (activeClients.current.get(serverId) !== client) return currentServers;
      return currentServers.map((server) => (server.id === serverId ? { ...server, refreshToken: token } : server));
    });
  };

  const loadRefreshTokenFromStorage = async (serverId: string, client: CoreApiClient) => {
    if (activeClients.current.get(serverId) !== client) return undefined;
    const server = (await readServersFromStorage()).find((item) => item.id === serverId);
    return activeClients.current.get(serverId) === client ? server?.refreshToken : undefined;
  };

  const loginAndSaveServer = async ({
    type,
    label,
    baseUrl,
    email,
    password,
  }: LoginAndSaveServerInput): Promise<ServerConnectionWithClient> => {
    let saved: ServerConnection | undefined;
    let refreshToken: string | undefined;
    const client: CoreApiClient = new CoreApiClient({
      baseUrl,
      email,
      password,
      saveRefreshToken: (token) => {
        if (saved) return updateRefreshTokenInStorage(saved.id, client, token);
        refreshToken = token;
      },
      loadRefreshToken: async () => (saved ? loadRefreshTokenFromStorage(saved.id, client) : refreshToken),
      getRefreshLockKey: () => saved?.id,
      onStatusChange: (status) => {
        if (saved) onClientStatusChange(saved.id, client, status);
      },
    });

    await client.waitForLogin();
    if (!client.account?.id || typeof refreshToken !== 'string' || !refreshToken) {
      throw new Error('Login response did not include a user and refresh token');
    }
    await client.users.findOne(client.account.id);

    const matchesConnection = (server: ServerConnection) =>
      server.type === type && server.baseUrl === baseUrl && server.label === label;
    const existing = (await readServersFromStorage()).find(matchesConnection);
    let replacedClient: CoreApiClient | undefined;
    try {
      await withSessionLock(existing?.id, () =>
        updateServersInStorage((currentServers) => {
          const existingIndex = currentServers.findIndex(matchesConnection);
          const newServers = [...currentServers];
          if (existingIndex >= 0) {
            saved = { ...newServers[existingIndex], refreshToken };
            newServers[existingIndex] = saved;
          } else {
            saved = {
              id: createId(),
              type,
              label: label || baseUrl || email,
              baseUrl,
              disabled: false,
              refreshToken,
            };
            newServers.push(saved);
          }
          replacedClient = activeClients.current.get(saved.id);
          activeClients.current.set(saved.id, client);
          return newServers;
        })
      );
    } catch (error) {
      if (saved && activeClients.current.get(saved.id) === client) {
        if (replacedClient) activeClients.current.set(saved.id, replacedClient);
        else activeClients.current.delete(saved.id);
      }
      throw error;
    }

    if (!saved) throw new Error('Unable to save server connection');

    const newServer = {
      ...saved,
      client,
    };

    clearServerQueries(saved.id);
    setServers((prev) =>
      prev.some((server) => server.id === newServer.id)
        ? prev.map((server) => (server.id === newServer.id ? newServer : server))
        : [...prev, newServer]
    );
    return newServer;
  };

  const rebuildServers = async () => {
    const savedServers = await readServersFromStorage();
    const newServers = savedServers.map((server) => {
      const client: CoreApiClient = new CoreApiClient({
        ...server,
        saveRefreshToken: (token) => updateRefreshTokenInStorage(server.id, client, token),
        loadRefreshToken: () => loadRefreshTokenFromStorage(server.id, client),
        getRefreshLockKey: () => server.id,
        onStatusChange: (status) => onClientStatusChange(server.id, client, status),
      });
      return { ...server, client };
    });
    activeClients.current = new Map(newServers.map((server) => [server.id, server.client]));
    await Promise.all(newServers.map(async (server) => await server.client.reconnect()));
    setServers(newServers);
  };

  useEffect(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;
    rebuildServers()
      .catch((error) => console.error('Failed to restore server connections', error))
      .finally(() => setIsLoading(false));
  }, []);

  const removeServer = async (serverId: string) => {
    let removed = false;
    await updateServersInStorage((currentServers) => {
      removed = currentServers.some((s) => s.id === serverId);
      return currentServers.filter((s) => s.id !== serverId);
    });

    if (!removed) return false;
    activeClients.current.delete(serverId);
    clearServerQueries(serverId);
    setServers((prev) => prev.filter((s) => s.id !== serverId));
    return true;
  };

  const setServerEnabled = async (serverId: string, enabled: boolean) => {
    await updateServersInStorage((currentServers) =>
      currentServers.map((item) => (item.id === serverId ? { ...item, disabled: !enabled } : item))
    );
    setServers((prev) => prev.map((item) => (item.id === serverId ? { ...item, disabled: !enabled } : item)));
  };

  const servers = allServers.filter((s) => !s.disabled && s.client.status === 'logged_in');

  return (
    <ServerContext.Provider
      value={{
        isLoading,
        servers,
        allServers,
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
