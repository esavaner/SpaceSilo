import 'reflect-metadata';
import { type INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

type Account = { accessToken: string; user: { id: string } };

const pendingSecurity = process.env.RUN_PENDING_SECURITY_TESTS === '1' ? it : it.skip;
const testDir = dirname(fileURLToPath(import.meta.url));
const sharedDir = resolve(testDir, '../../shared');
const buildDir = resolve(testDir, '../build');
let container: StartedPostgreSqlContainer | undefined;
let app: INestApplication | undefined;
let prisma: import('../src/common/prisma.service').PrismaService | undefined;
let parseCorsOrigins: typeof import('../src/common/env.validation').parseCorsOrigins;
let tempDir: string | undefined;
let baseUrl: string;
let owner: Account;
let editor: Account;
let reader: Account;
let outsider: Account;
let noteId: string;

async function request(
  path: string,
  token?: string,
  method = 'GET',
  body?: object,
  extraHeaders?: Record<string, string>
) {
  return fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function register(name: string): Promise<Account> {
  const response = await request('/auth/register', undefined, 'POST', {
    email: `${name}@example.test`,
    password: 'test-password',
    groupId: `personal-${name}`,
  });
  expect(response.status).toBe(201);
  return response.json() as Promise<Account>;
}

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'spacesilo-test-'));
  container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('spacesilo_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  vi.stubEnv('DATABASE_URL', container.getConnectionUri());
  vi.stubEnv('FILES_PATH', join(tempDir, 'files'));
  vi.stubEnv('STORAGE_PATH', join(tempDir, 'storage'));
  vi.stubEnv('APPDATA_PATH', join(tempDir, 'appdata'));
  vi.stubEnv('CORS_ORIGINS', 'https://allowed.example, https://second.example');

  execFileSync(process.execPath, [join(sharedDir, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: sharedDir,
    env: process.env,
    stdio: 'inherit',
  });

  const { AppModule }: typeof import('../src/app.module') = await import(join(buildDir, 'app.module.js'));
  const { configureApp }: typeof import('../src/common/configure-app') = await import(
    join(buildDir, 'common/configure-app.js')
  );
  ({ parseCorsOrigins } = (await import(
    join(buildDir, 'common/env.validation.js')
  )) as typeof import('../src/common/env.validation'));
  const { PrismaService }: typeof import('../src/common/prisma.service') = await import(
    join(buildDir, 'common/prisma.service.js')
  );
  app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  configureApp(app);
  prisma = app.get(PrismaService);
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();

  owner = await register('owner');
  editor = await register('editor');
  reader = await register('reader');
  outsider = await register('outsider');

  const group = await request('/groups', owner.accessToken, 'POST', {
    id: 'shared-group',
    name: 'Shared',
    members: [
      { userId: editor.user.id, access: 'edit' },
      { userId: reader.user.id, access: 'read' },
    ],
  });
  expect(group.status).toBe(201);
  const note = await request('/notes', owner.accessToken, 'POST', {
    groupId: 'shared-group',
    content: 'Owner note',
  });
  expect(note.status).toBe(201);
  noteId = ((await note.json()) as { id: string }).id;
  await writeFile(join(tempDir, 'sentinel.txt'), 'private test data');
}, 120_000);

afterAll(async () => {
  try {
    await app?.close();
    await prisma?.$disconnect();
  } finally {
    try {
      await container?.stop();
    } finally {
      if (tempDir) await rm(tempDir, { recursive: true, force: true });
      vi.unstubAllEnvs();
    }
  }
}, 60_000);

describe('backend permissions', () => {
  it('rejects unauthenticated user management requests', async () => {
    expect((await request('/users')).status).toBe(401);
  });

  it('allows group members to read but rejects non-members', async () => {
    expect((await request('/groups/shared-group', reader.accessToken)).status).toBe(200);
    expect((await request('/groups/shared-group', editor.accessToken)).status).toBe(200);
    expect((await request('/groups/shared-group', outsider.accessToken)).status).toBe(401);
  });

  it('rejects group changes by a non-owner member', async () => {
    expect((await request('/groups/shared-group', editor.accessToken, 'PATCH', { name: 'Changed' })).status).toBe(403);
  });

  it('lets an editor create a folder', async () => {
    expect(
      (
        await request('/files/folder', editor.accessToken, 'POST', {
          groupId: 'shared-group',
          newPath: '/',
          name: 'ok',
        })
      ).status
    ).toBe(201);
  });

  it('lets editors create notes but rejects readers and outsiders', async () => {
    const body = { groupId: 'shared-group', content: 'Editor note' };
    expect((await request('/notes', editor.accessToken, 'POST', body)).status).toBe(201);
    expect((await request('/notes', reader.accessToken, 'POST', body)).status).toBe(403);
    expect((await request('/notes', outsider.accessToken, 'POST', body)).status).toBe(403);
  });

  it('validates request bodies and rejects non-whitelisted fields', async () => {
    expect((await request('/notes', editor.accessToken, 'POST', { groupId: 'shared-group' })).status).toBe(400);
    expect(
      (
        await request('/notes', editor.accessToken, 'POST', {
          groupId: 'shared-group',
          content: 'Valid content',
          unexpectedField: true,
        })
      ).status
    ).toBe(400);
    expect((await request('/gallery?unexpected=1', editor.accessToken)).status).toBe(400);
    expect(
      (
        await request('/backups/incoming', owner.accessToken, 'POST', {
          pairSecret: 'secret',
          schedule: '0 * * * *',
          sourceServerLabel: 'Src',
          sourceServerBaseUrl: 'http://127.0.0.1:3100',
          sourceServerKey: 'src',
          destinationServerLabel: 'Dst',
          destinationServerBaseUrl: 'http://127.0.0.2:3100',
          destinationServerKey: 'dst',
          unexpectedField: true,
        })
      ).status
    ).toBe(400);
  });

  it('allows only configured CORS_ORIGINS and drops the hardcoded localhost origin', async () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
    expect(parseCorsOrigins(' , ')).toEqual([]);

    const allowed = await request('/notes', editor.accessToken, 'GET', undefined, {
      Origin: 'https://allowed.example',
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://allowed.example');

    const secondAllowed = await request('/notes', editor.accessToken, 'GET', undefined, {
      Origin: 'https://second.example',
    });
    expect(secondAllowed.headers.get('access-control-allow-origin')).toBe('https://second.example');

    const legacyOrigin = await request('/notes', editor.accessToken, 'GET', undefined, {
      Origin: 'http://localhost:8081',
    });
    expect(legacyOrigin.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('logs method, path, status, and duration while redacting authorization and omitting bodies', async () => {
    const spy = vi.spyOn(Logger.prototype, 'log');
    try {
      const response = await request('/notes?sensitiveQuery=secret-query', editor.accessToken, 'POST', {
        groupId: 'shared-group',
        content: 'secret-note-body-content',
      });
      expect(response.status).toBe(201);

      const messages = spy.mock.calls.map(([msg]) => String(msg));
      const entry = messages.find((msg) => msg.startsWith('POST /api/notes '));
      expect(entry).toMatch(/^POST \/api\/notes 201 \d+ms authorization=\[REDACTED\]$/);
      expect(messages.join('\n')).not.toContain('secret-note-body-content');
      expect(messages.join('\n')).not.toContain('secret-query');
      expect(messages.join('\n')).not.toContain(editor.accessToken);
    } finally {
      spy.mockRestore();
    }
  });

  it('rate limits auth endpoints without throttling authenticated resource routes', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const res = await request('/auth/login', undefined, 'POST', {
        email: 'owner@example.test',
        password: 'wrong-password',
      });
      expect(res.status).toBe(401);
    }

    const throttled = await request('/auth/login', undefined, 'POST', {
      email: 'owner@example.test',
      password: 'wrong-password',
    });
    expect(throttled.status).toBe(429);
    expect(await throttled.json()).toMatchObject({
      statusCode: 429,
      message: 'api.common.tooManyRequests',
    });

    expect((await request('/notes', editor.accessToken)).status).toBe(200);
  });

  it("allows readers to view notes but not change another user's note", async () => {
    expect((await request(`/notes/${noteId}`, reader.accessToken)).status).toBe(200);
    expect((await request(`/notes/${noteId}`, reader.accessToken, 'PATCH', { content: 'Changed' })).status).toBe(403);
    expect((await request(`/notes/${noteId}`, outsider.accessToken)).status).toBe(401);
    expect((await request(`/notes/${noteId}`, editor.accessToken, 'PATCH', { content: 'Edited' })).status).toBe(200);
  });

  pendingSecurity("rejects path traversal outside a group's storage root", async () => {
    const query = new URLSearchParams({ groupId: 'shared-group', fileUri: '../../sentinel.txt' });
    const response = await request(`/files/download?${query}`, owner.accessToken);
    expect([400, 403, 404]).toContain(response.status);
    expect(await response.text()).not.toContain('private test data');
  });

  pendingSecurity('rejects folder creation by a read-only member', async () => {
    const response = await request('/files/folder', reader.accessToken, 'POST', {
      groupId: 'shared-group',
      newPath: '/',
      name: 'forbidden',
    });
    expect(response.status).toBe(403);
  });

  pendingSecurity('rejects edits to an owned note after write access is revoked', async () => {
    const formerEditor = await register('former-editor');
    const added = await request('/groups/shared-group/add_member', owner.accessToken, 'PATCH', {
      userId: formerEditor.user.id,
      access: 'edit',
    });
    expect(added.status).toBe(200);
    const note = await request('/notes', formerEditor.accessToken, 'POST', {
      groupId: 'shared-group',
      content: 'Former editor note',
    });
    expect(note.status).toBe(201);
    const id = ((await note.json()) as { id: string }).id;
    const downgraded = await request('/groups/shared-group/update_member', owner.accessToken, 'PATCH', {
      userId: formerEditor.user.id,
      access: 'read',
    });
    expect(downgraded.status).toBe(200);
    expect((await request(`/notes/${id}`, formerEditor.accessToken, 'PATCH', { content: 'Changed' })).status).toBe(403);
  });

  pendingSecurity('rejects user listing for an ordinary user', async () => {
    expect((await request('/users', reader.accessToken)).status).toBe(403);
  });

  pendingSecurity('rejects user creation by an ordinary user', async () => {
    expect(
      (
        await request('/users', reader.accessToken, 'POST', {
          email: 'unexpected@example.test',
          password: 'test-password',
          groupId: 'unexpected',
        })
      ).status
    ).toBe(403);
  });

  pendingSecurity('rejects user deletion by an ordinary user', async () => {
    if (!prisma) throw new Error('Prisma was not initialized');
    const user = await prisma.user.create({ data: { email: 'deletable@example.test', password: 'test-password' } });
    expect((await request(`/users/${user.id}`, reader.accessToken, 'DELETE')).status).toBe(403);
  });

  pendingSecurity('rejects role escalation by an ordinary user', async () => {
    expect((await request(`/users/${reader.user.id}`, reader.accessToken, 'PATCH', { role: 'admin' })).status).toBe(
      403
    );
  });
});
