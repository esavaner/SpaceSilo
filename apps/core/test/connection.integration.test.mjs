import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientStatus, ServerType } from '../../native/src/api/_client';
import { ServerProvider, useServerContext } from '../../native/src/providers/ServerProvider';

const stored = vi.hoisted(() => new Map());

vi.mock('../../native/src/utils/storage', () => ({
  storage: {
    get: async (key) => stored.get(key) ?? null,
    set: async (key, value) => {
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
  renderToStaticMarkup(createElement(ServerProvider, null, createElement(CaptureContext)));
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

beforeEach(() => stored.clear());
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
        return Response.json({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });
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
});
