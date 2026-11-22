import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  QueryClient,
  QueryClientProvider,
} from '../../native/node_modules/@tanstack/react-query/build/modern/index.js';
import { ClientStatus, ServerType } from '../../native/src/api/_client';
import { CoreApiClient } from '../../native/src/api/core.client';
import { ServerProvider, useServerContext } from '../../native/src/providers/ServerProvider';

const stored = vi.hoisted(() => new Map());
const storageControl = vi.hoisted(() => ({ failNextWrite: false }));

vi.mock('../../native/src/utils/storage', () => ({
  storage: {
    get: async (key) => stored.get(key) ?? null,
    set: async (key, value) => {
      if (storageControl.failNextWrite) {
        storageControl.failNextWrite = false;
        throw new Error('Storage unavailable');
      }
      stored.set(key, value);
    },
  },
}));

const nativeRequire = createRequire(new URL('../../native/package.json', import.meta.url));
const { createElement } = nativeRequire('react');
const { renderToStaticMarkup } = nativeRequire('react-dom/server');

function serverContext() {
  let context;
  function CaptureContext() {
    context = useServerContext();
    return null;
  }
  renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(ServerProvider, null, createElement(CaptureContext))
    )
  );
  if (!context) throw new Error('Server context was not provided');
  return context;
}

const input = {
  type: ServerType.CORE,
  baseUrl: 'http://spacesilo.test',
  label: 'Home',
  email: 'member@example.test',
  password: 'test-password',
};

beforeEach(() => {
  stored.clear();
  storageControl.failNextWrite = false;
});
afterEach(() => vi.unstubAllGlobals());

describe('server connections', () => {
  it.each(['user', 'admin', 'owner'])('connects a %s without listing all users', async (role) => {
    const user = { id: 'member-id', email: input.email, role };
    const fetchMock = vi.fn(async (url, options) => {
      if (url === `${input.baseUrl}/api/auth/login`) {
        return Response.json({ user, accessToken: 'access-token', refreshToken: 'refresh-token' });
      }
      if (url === `${input.baseUrl}/api/users/${user.id}`) {
        expect(options?.headers).toMatchObject({ Authorization: 'Bearer access-token' });
        expect(stored.has('servers')).toBe(false);
        return Response.json(user);
      }
      if (url === `${input.baseUrl}/api/auth/refresh`) {
        return Response.json({ user, accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });
      }
      return Response.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const connection = await serverContext().loginAndSaveServer(input);

    expect(connection.client.status).toBe(ClientStatus.LOGGED_IN);
    expect(connection.client.account).toMatchObject(user);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${input.baseUrl}/api/auth/login`,
      `${input.baseUrl}/api/users/${user.id}`,
    ]);
    const saved = JSON.parse(stored.get('servers') ?? '[]');
    expect(saved).toEqual([
      expect.objectContaining({ id: connection.id, refreshToken: 'refresh-token', baseUrl: input.baseUrl }),
    ]);
    expect(saved[0]).not.toHaveProperty('password');
    expect(saved[0]).not.toHaveProperty('accessToken');

    expect(await connection.client.reconnect()).toBe(true);
    const refreshed = JSON.parse(stored.get('servers') ?? '[]');
    expect(refreshed[0]?.refreshToken).toBe('new-refresh-token');
  });

  it('does not save a connection when credentials are invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ statusCode: 401, message: 'api.auth.invalidCredentials' }, { status: 401 }))
    );

    await expect(serverContext().loginAndSaveServer(input)).rejects.toMatchObject({
      status: 401,
      responseBody: { message: 'api.auth.invalidCredentials' },
    });
    expect(stored.has('servers')).toBe(false);
  });

  it('does not save a connection without a refresh token', async () => {
    const user = { id: 'member-id', email: input.email, role: 'user' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => Response.json(url.endsWith('/auth/login') ? { user, accessToken: 'access-token' } : user))
    );

    await expect(serverContext().loginAndSaveServer(input)).rejects.toThrow();
    expect(stored.has('servers')).toBe(false);
  });

  it('preserves an existing connection if verification fails', async () => {
    const existing = {
      id: 'existing-id',
      type: input.type,
      baseUrl: input.baseUrl,
      label: input.label,
      disabled: false,
      refreshToken: 'previous-token',
    };
    stored.set('servers', JSON.stringify([existing]));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (url === `${input.baseUrl}/api/auth/login`) {
          return Response.json({
            user: { id: 'member-id', email: input.email, role: 'user' },
            accessToken: 'access-token',
            refreshToken: 'replacement-token',
          });
        }
        return Response.json({ statusCode: 503, message: 'Unavailable' }, { status: 503 });
      })
    );

    await expect(serverContext().loginAndSaveServer(input)).rejects.toMatchObject({ status: 503 });
    expect(JSON.parse(stored.get('servers') ?? '[]')).toEqual([existing]);
  });

  it('shares one rotation across concurrent requests and restores the account', async () => {
    const user = { id: 'member-id', email: input.email, role: 'user' };
    let oldRequests = 0;
    let releaseRefresh;
    const bothRequestsStarted = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    const fetchMock = vi.fn(async (url, options) => {
      if (url.endsWith('/auth/login')) {
        return Response.json({ user, accessToken: 'access-token', refreshToken: 'refresh-token' });
      }
      if (url.endsWith(`/users/${user.id}`)) return Response.json(user);
      if (url.endsWith('/auth/refresh')) {
        await bothRequestsStarted;
        return Response.json({ user, accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });
      }
      if (url.endsWith('/groups')) {
        if (options.headers.Authorization === 'Bearer access-token') {
          oldRequests += 1;
          if (oldRequests === 2) releaseRefresh();
          return Response.json({ statusCode: 401, message: 'api.common.unauthorized' }, { status: 401 });
        }
        return Response.json([{ id: 'group' }]);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const connection = await serverContext().loginAndSaveServer(input);

    await expect(
      Promise.all([connection.client.groups.findUserGroups(), connection.client.groups.findUserGroups()])
    ).resolves.toEqual([[{ id: 'group' }], [{ id: 'group' }]]);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(connection.client.account).toEqual(user);
    expect(JSON.parse(stored.get('servers'))[0].refreshToken).toBe('new-refresh-token');
  });

  it('preserves refresh tokens when multiple connections rotate at once', async () => {
    const fetchMock = vi.fn(async (url) => {
      const name = new URL(url).hostname.startsWith('first') ? 'first' : 'second';
      const user = { id: `${name}-id`, email: `${name}@example.test`, role: 'user' };
      if (url.endsWith('/auth/login')) {
        return Response.json({ user, accessToken: `${name}-access`, refreshToken: `${name}-old` });
      }
      if (url.endsWith('/auth/refresh')) {
        return Response.json({ user, accessToken: `${name}-new-access`, refreshToken: `${name}-new` });
      }
      return Response.json(user);
    });
    vi.stubGlobal('fetch', fetchMock);
    const context = serverContext();
    const [first, second] = await Promise.all([
      context.loginAndSaveServer({ ...input, baseUrl: 'http://first.test', label: 'First' }),
      context.loginAndSaveServer({ ...input, baseUrl: 'http://second.test', label: 'Second' }),
    ]);

    await expect(Promise.all([first.client.reconnect(), second.client.reconnect()])).resolves.toEqual([true, true]);
    const saved = JSON.parse(stored.get('servers'));
    expect(saved).toHaveLength(2);
    expect(saved.find((server) => server.id === first.id).refreshToken).toBe('first-new');
    expect(saved.find((server) => server.id === second.id).refreshToken).toBe('second-new');
  });

  it('does not let an old client overwrite a newly signed-in connection', async () => {
    vi.stubGlobal('navigator', {});
    const user = { id: 'member-id', email: input.email, role: 'user' };
    let loginCount = 0;
    let releaseRefresh;
    let notifyRefreshStarted;
    const refreshStarted = new Promise((resolve) => {
      notifyRefreshStarted = resolve;
    });
    const refreshReleased = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    const fetchMock = vi.fn(async (url) => {
      if (url.endsWith('/auth/login')) {
        loginCount += 1;
        return Response.json({ user, accessToken: `access-${loginCount}`, refreshToken: `login-${loginCount}` });
      }
      if (url.endsWith('/auth/refresh')) {
        notifyRefreshStarted();
        await refreshReleased;
        return Response.json({ user, accessToken: 'old-refreshed-access', refreshToken: 'old-refreshed-token' });
      }
      return Response.json(user);
    });
    vi.stubGlobal('fetch', fetchMock);
    const context = serverContext();
    const first = await context.loginAndSaveServer(input);
    const pendingRefresh = first.client.reconnect();
    await refreshStarted;
    const replacement = await context.loginAndSaveServer(input);
    releaseRefresh();
    await pendingRefresh;

    expect(replacement.id).toBe(first.id);
    expect(JSON.parse(stored.get('servers'))[0].refreshToken).toBe('login-2');
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh')).length;
    expect(await first.client.reconnect()).toBe(false);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(refreshCalls);
  });

  it('waits for a running refresh before replacing a connection', async () => {
    const locks = new Map();
    let sessionLockCount = 0;
    let notifyReplacementQueued;
    const replacementQueued = new Promise((resolve) => {
      notifyReplacementQueued = resolve;
    });
    vi.stubGlobal('navigator', {
      locks: {
        request: (name, action) => {
          const previous = locks.get(name) ?? Promise.resolve();
          if (name.startsWith('spacesilo-session:') && ++sessionLockCount === 2) notifyReplacementQueued();
          const result = previous.then(action);
          locks.set(
            name,
            result.then(
              () => undefined,
              () => undefined
            )
          );
          return result;
        },
      },
    });
    const user = { id: 'member-id', email: input.email, role: 'user' };
    let loginCount = 0;
    let releaseRefresh;
    let notifyRefreshStarted;
    const refreshStarted = new Promise((resolve) => {
      notifyRefreshStarted = resolve;
    });
    const refreshReleased = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (url.endsWith('/auth/login')) {
          loginCount += 1;
          return Response.json({ user, accessToken: `access-${loginCount}`, refreshToken: `login-${loginCount}` });
        }
        if (url.endsWith('/auth/refresh')) {
          notifyRefreshStarted();
          await refreshReleased;
          return Response.json({ user, accessToken: 'refreshed-access', refreshToken: 'refreshed-token' });
        }
        return Response.json(user);
      })
    );
    const context = serverContext();
    const first = await context.loginAndSaveServer(input);
    const pendingRefresh = first.client.reconnect();
    await refreshStarted;
    const pendingReplacement = context.loginAndSaveServer(input);
    await replacementQueued;
    releaseRefresh();
    const [, replacement] = await Promise.all([pendingRefresh, pendingReplacement]);

    expect(replacement.id).toBe(first.id);
    expect(JSON.parse(stored.get('servers'))[0].refreshToken).toBe('login-2');
  });

  it('keeps the existing client active when saving a replacement fails', async () => {
    const user = { id: 'member-id', email: input.email, role: 'user' };
    let loginCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (url.endsWith('/auth/login')) {
          loginCount += 1;
          return Response.json({ user, accessToken: `access-${loginCount}`, refreshToken: `login-${loginCount}` });
        }
        if (url.endsWith('/auth/refresh')) {
          return Response.json({ user, accessToken: 'refreshed-access', refreshToken: 'refreshed-token' });
        }
        return Response.json(user);
      })
    );
    const context = serverContext();
    const first = await context.loginAndSaveServer(input);
    storageControl.failNextWrite = true;

    await expect(context.loginAndSaveServer(input)).rejects.toThrow('Storage unavailable');
    expect(await first.client.reconnect()).toBe(true);
    expect(JSON.parse(stored.get('servers'))[0].refreshToken).toBe('refreshed-token');
  });

  it('keeps a refresh token after a temporary server failure and can retry', async () => {
    const user = { id: 'member-id', email: input.email, role: 'user' };
    let available = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (url.endsWith('/auth/login')) {
          return Response.json({ user, accessToken: 'access-token', refreshToken: 'refresh-token' });
        }
        if (url.endsWith(`/users/${user.id}`)) return Response.json(user);
        if (url.endsWith('/auth/refresh')) {
          return available
            ? Response.json({ user, accessToken: 'new-access', refreshToken: 'new-refresh' })
            : Response.json({ statusCode: 503, message: 'api.common.internalServerError' }, { status: 503 });
        }
        return Response.json({ statusCode: 401, message: 'api.common.unauthorized' }, { status: 401 });
      })
    );
    const connection = await serverContext().loginAndSaveServer(input);

    await expect(connection.client.groups.findUserGroups()).rejects.toMatchObject({ status: 503 });
    expect(connection.client.status).toBe(ClientStatus.ERROR);
    expect(JSON.parse(stored.get('servers'))[0].refreshToken).toBe('refresh-token');
    available = true;
    expect(await connection.client.reconnect()).toBe(true);
    expect(connection.client.account).toEqual(user);
    expect(JSON.parse(stored.get('servers'))[0].refreshToken).toBe('new-refresh');
  });

  it('clears only a revoked connection and allows signing in again', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        const name = new URL(url).hostname.startsWith('first') ? 'first' : 'second';
        const user = { id: `${name}-id`, email: `${name}@example.test`, role: 'user' };
        if (url.endsWith('/auth/login')) {
          return Response.json({ user, accessToken: `${name}-access`, refreshToken: `${name}-refresh` });
        }
        if (url.endsWith('/auth/refresh') || url.endsWith('/groups')) {
          return Response.json({ statusCode: 401, message: 'api.auth.invalidRefreshToken' }, { status: 401 });
        }
        return Response.json(user);
      })
    );
    const context = serverContext();
    const firstInput = { ...input, baseUrl: 'http://first.test', label: 'First' };
    const first = await context.loginAndSaveServer(firstInput);
    const second = await context.loginAndSaveServer({ ...input, baseUrl: 'http://second.test', label: 'Second' });

    await expect(first.client.groups.findUserGroups()).rejects.toMatchObject({ status: 401 });
    expect(first.client.status).toBe(ClientStatus.LOGGED_OUT);
    const afterRevocation = JSON.parse(stored.get('servers'));
    expect(afterRevocation.find((server) => server.id === first.id).refreshToken).toBeUndefined();
    expect(afterRevocation.find((server) => server.id === second.id).refreshToken).toBe('second-refresh');

    const restored = await context.loginAndSaveServer(firstInput);
    expect(restored.id).toBe(first.id);
    expect(JSON.parse(stored.get('servers'))).toHaveLength(2);
    expect(JSON.parse(stored.get('servers')).find((server) => server.id === first.id).refreshToken).toBe(
      'first-refresh'
    );
  });

  it('refreshes an expired access token before logging out', async () => {
    const user = { id: 'member-id', email: input.email, role: 'user' };
    let logoutAttempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, options) => {
        if (url.endsWith('/auth/login')) {
          return Response.json({ user, accessToken: 'expired-access', refreshToken: 'refresh-token' });
        }
        if (url.endsWith('/auth/refresh')) {
          return Response.json({ user, accessToken: 'new-access', refreshToken: 'new-refresh' });
        }
        if (url.endsWith('/auth/logout')) {
          logoutAttempts += 1;
          if (options.headers.Authorization === 'Bearer expired-access') {
            return Response.json({ statusCode: 401, message: 'api.common.unauthorized' }, { status: 401 });
          }
          expect(options.headers.Authorization).toBe('Bearer new-access');
          return new Response(null, { status: 204 });
        }
        return Response.json(user);
      })
    );
    const connection = await serverContext().loginAndSaveServer(input);

    await connection.client.logout();
    expect(logoutAttempts).toBe(2);
    expect(connection.client.status).toBe(ClientStatus.LOGGED_OUT);
    expect(JSON.parse(stored.get('servers'))[0].refreshToken).toBeUndefined();
  });

  it('rejects malformed refresh responses instead of marking the connection active', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ accessToken: 'access', refreshToken: 'refresh' }))
    );
    const client = new CoreApiClient({
      baseUrl: input.baseUrl,
      refreshToken: 'previous-refresh',
      saveRefreshToken: vi.fn(),
    });

    expect(await client.reconnect()).toBe(false);
    expect(client.status).toBe(ClientStatus.ERROR);
    expect(client.loginError?.message).toBe('Invalid refresh response');
  });

  it('saves a rotated token before retrying after a storage failure', async () => {
    const user = { id: 'member-id', email: input.email, role: 'user' };
    let storedToken = 'refresh-0';
    let serverToken = 'refresh-0';
    let failSave = true;
    const received = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, options) => {
        const token = JSON.parse(options.body).refreshToken;
        received.push(token);
        if (token !== serverToken) {
          return Response.json({ statusCode: 401, message: 'api.auth.invalidRefreshToken' }, { status: 401 });
        }
        serverToken = `refresh-${received.length}`;
        return Response.json({ user, accessToken: `access-${received.length}`, refreshToken: serverToken });
      })
    );
    const client = new CoreApiClient({
      baseUrl: input.baseUrl,
      refreshToken: storedToken,
      loadRefreshToken: async () => storedToken,
      saveRefreshToken: async (token) => {
        if (failSave) {
          failSave = false;
          throw new Error('Storage unavailable');
        }
        storedToken = token;
      },
    });

    expect(await client.reconnect()).toBe(false);
    expect(client.status).toBe(ClientStatus.ERROR);
    expect(storedToken).toBe('refresh-0');
    expect(await client.reconnect()).toBe(true);
    expect(received).toEqual(['refresh-0', 'refresh-1']);
    expect(storedToken).toBe('refresh-2');
  });

  it('can revoke a rotated session even when saving the token failed', async () => {
    const user = { id: 'member-id', email: input.email, role: 'user' };
    const calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        calls.push(url);
        if (url.endsWith('/auth/refresh')) {
          return Response.json({ user, accessToken: 'new-access', refreshToken: 'new-refresh' });
        }
        return new Response(null, { status: 204 });
      })
    );
    let storedToken = 'previous-refresh';
    const client = new CoreApiClient({
      baseUrl: input.baseUrl,
      refreshToken: storedToken,
      loadRefreshToken: async () => storedToken,
      saveRefreshToken: async (token) => {
        if (token) throw new Error('Storage unavailable');
        storedToken = token;
      },
    });

    expect(await client.reconnect()).toBe(false);
    await client.logout();
    expect(calls.map((url) => new URL(url).pathname)).toEqual(['/api/auth/refresh', '/api/auth/logout']);
    expect(storedToken).toBeUndefined();
    expect(client.status).toBe(ClientStatus.LOGGED_OUT);
  });

  it('revokes only the chosen connection and keeps its token if logout fails', async () => {
    let logoutStatus = 503;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, options) => {
        const name = new URL(url).hostname.startsWith('first') ? 'first' : 'second';
        const user = { id: `${name}-id`, email: `${name}@example.test`, role: 'user' };
        if (url.endsWith('/auth/login')) {
          return Response.json({ user, accessToken: `${name}-access`, refreshToken: `${name}-refresh` });
        }
        if (url.endsWith('/auth/logout')) {
          expect(options.headers.Authorization).toBe('Bearer first-access');
          return logoutStatus === 204
            ? new Response(null, { status: 204 })
            : Response.json({ statusCode: 503, message: 'api.common.internalServerError' }, { status: 503 });
        }
        if (url.endsWith('/auth/sessions/session-id')) return new Response(null, { status: 204 });
        if (url.endsWith('/auth/sessions')) return Response.json([{ id: 'session-id', isCurrent: false }]);
        return Response.json(user);
      })
    );
    const context = serverContext();
    const first = await context.loginAndSaveServer({ ...input, baseUrl: 'http://first.test', label: 'First' });
    const second = await context.loginAndSaveServer({ ...input, baseUrl: 'http://second.test', label: 'Second' });

    await expect(first.client.logout()).rejects.toMatchObject({ status: 503 });
    expect(JSON.parse(stored.get('servers')).find((server) => server.id === first.id).refreshToken).toBe(
      'first-refresh'
    );
    logoutStatus = 204;
    await first.client.logout();
    expect(first.client.status).toBe(ClientStatus.LOGGED_OUT);
    expect(first.client.account).toBeUndefined();
    const saved = JSON.parse(stored.get('servers'));
    expect(saved.find((server) => server.id === first.id).refreshToken).toBeUndefined();
    expect(saved.find((server) => server.id === second.id).refreshToken).toBe('second-refresh');
    await expect(second.client.auth.listSessions()).resolves.toEqual([{ id: 'session-id', isCurrent: false }]);
    await expect(second.client.auth.revokeSession('session-id')).resolves.toBeUndefined();
  });

  it('serializes refreshes across browser tabs and reads the latest stored token', async () => {
    const locks = new Map();
    vi.stubGlobal('navigator', {
      locks: {
        request: (name, action) => {
          const previous = locks.get(name) ?? Promise.resolve();
          const result = previous.then(action);
          locks.set(
            name,
            result.then(
              () => undefined,
              () => undefined
            )
          );
          return result;
        },
      },
    });
    let storedToken = 'refresh-0';
    let serverToken = 'refresh-0';
    const received = [];
    const user = { id: 'member-id', email: input.email, role: 'user' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, options) => {
        const token = JSON.parse(options.body).refreshToken;
        received.push(token);
        if (token !== serverToken) {
          return Response.json({ statusCode: 401, message: 'api.auth.invalidRefreshToken' }, { status: 401 });
        }
        serverToken = `refresh-${received.length}`;
        return Response.json({ user, accessToken: `access-${received.length}`, refreshToken: serverToken });
      })
    );
    const options = {
      baseUrl: input.baseUrl,
      refreshToken: storedToken,
      loadRefreshToken: async () => storedToken,
      saveRefreshToken: async (token) => {
        storedToken = token;
      },
      getRefreshLockKey: () => 'same-connection',
    };
    const first = new CoreApiClient(options);
    const second = new CoreApiClient(options);

    await expect(Promise.all([first.reconnect(), second.reconnect()])).resolves.toEqual([true, true]);
    expect(received).toEqual(['refresh-0', 'refresh-1']);
    expect(storedToken).toBe('refresh-2');
  });
});
