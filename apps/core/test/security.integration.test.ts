import 'reflect-metadata';
import { type INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { compare } from 'bcrypt';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

type Account = { accessToken: string; refreshToken: string; user: { id: string; email: string; role?: string } };

const pendingSecurity = process.env.RUN_PENDING_SECURITY_TESTS === '1' ? it : it.skip;
const testDir = dirname(fileURLToPath(import.meta.url));
const sharedDir = resolve(testDir, '../../shared');
const buildDir = resolve(testDir, '../build');
let container: StartedPostgreSqlContainer | undefined;
let app: INestApplication | undefined;
let prisma: import('../src/common/prisma.service').PrismaService | undefined;
let authService: import('../src/services/auth.service').AuthService | undefined;
let usersService: import('../src/services/users.service').UsersService | undefined;
let jwtService: JwtService | undefined;
let parseCorsOrigins: typeof import('../src/common/env.validation').parseCorsOrigins;
let tempDir: string | undefined;
let baseUrl: string;
let serverOwner: Account;
let serverAdmin: Account;
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
  vi.stubEnv('JWT_SECRET', 'test-jwt-secret-that-is-at-least-32-chars');
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
  const { AuthService }: typeof import('../src/services/auth.service') = await import(
    join(buildDir, 'services/auth.service.js')
  );
  const { UsersService }: typeof import('../src/services/users.service') = await import(
    join(buildDir, 'services/users.service.js')
  );
  app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  configureApp(app);
  prisma = app.get(PrismaService);
  authService = app.get(AuthService);
  usersService = app.get(UsersService);
  jwtService = app.get(JwtService);
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();

  const createPrivilegedAccount = async (name: string, role: 'owner' | 'admin'): Promise<Account> => {
    const created = await usersService!.create({
      email: `${name}@example.test`,
      password: 'test-password',
      name,
      groupId: `personal-${name}`,
    });
    const updated = await prisma!.user.update({ where: { id: created.id }, data: { role } });
    const loggedIn = await authService!.login({ email: updated.email, password: 'test-password' });
    return {
      accessToken: loggedIn.accessToken,
      refreshToken: loggedIn.refreshToken,
      user: { id: updated.id, email: updated.email, role },
    };
  };

  serverOwner = await createPrivilegedAccount('server-owner', 'owner');
  serverAdmin = await createPrivilegedAccount('server-admin', 'admin');
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

  it('rejects tokens signed with a different secret', async () => {
    const forged = new JwtService({ secret: 'another-instance-secret-at-least-32-chars' }).sign({
      sub: serverOwner.user.id,
      email: serverOwner.user.email,
      role: 'owner',
      typ: 'access',
    });
    expect((await request('/users', forged)).status).toBe(401);
    expect((await request('/users', serverOwner.accessToken)).status).toBe(200);
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
          newPath: '',
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

  it('rejects traversal, absolute paths, and invalid group IDs across file operations', async () => {
    if (!tempDir) throw new Error('Temporary storage was not initialized');
    const groupId = 'shared-group';
    await writeFile(join(tempDir, 'files', groupId, 'source.txt'), 'group data');
    const query = (fileUri: string, id = groupId) => new URLSearchParams({ groupId: id, fileUri });
    const body = { groupId, fileUri: 'source.txt', newPath: '', name: 'target.txt' };
    const upload = new FormData();
    upload.append('groupId', groupId);
    upload.append('newPath', '..\\outside');
    upload.append('name', 'upload');
    upload.append('file', new Blob(['data']), 'file.txt');

    const responses = await Promise.all([
      request(`/files?${query('../sentinel.txt')}`, owner.accessToken),
      request(`/files/info?${query('..\\sentinel.txt')}`, owner.accessToken),
      request(`/files/download?${query('../../sentinel.txt')}`, owner.accessToken),
      request(`/files/download?${query('/etc/passwd')}`, owner.accessToken),
      request(`/files/download?${query('C:\\Windows\\file.txt')}`, owner.accessToken),
      request(`/files/download?${query('%252e%252e%252fsentinel.txt')}`, owner.accessToken),
      request(`/files?${query('source.txt', '../other')}`, owner.accessToken),
      request('/files/all', owner.accessToken, 'POST', { items: [{ groupId, path: '../other' }] }),
      request('/files/folder', owner.accessToken, 'POST', { groupId, newPath: '', name: '../other' }),
      fetch(`${baseUrl}/api/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${owner.accessToken}` },
        body: upload,
      }),
      request('/files', owner.accessToken, 'PATCH', { ...body, fileUri: '../sentinel.txt' }),
      request('/files', owner.accessToken, 'PATCH', { ...body, newPath: '../other' }),
      request('/files', owner.accessToken, 'PATCH', { ...body, fileUri: 'missing.txt', newPath: '../other' }),
      request('/files/copy', owner.accessToken, 'POST', { ...body, fileUri: '../sentinel.txt' }),
      request('/files/copy', owner.accessToken, 'POST', { ...body, newPath: '..\\other' }),
      request('/files/copy', owner.accessToken, 'POST', { ...body, fileUri: 'missing.txt', newPath: '..\\other' }),
      request('/files', owner.accessToken, 'DELETE', { groupId, fileUri: '../sentinel.txt' }),
    ]);

    for (const response of responses) {
      expect(response.status, response.url).toBe(400);
      expect(await response.json()).toMatchObject({ message: 'api.files.invalidPath' });
    }
    expect(await readFile(join(tempDir, 'sentinel.txt'), 'utf8')).toBe('private test data');
    expect((await request(`/files?${query('source.txt', 'missing-group')}`, owner.accessToken)).status).toBe(404);
  });

  it('rejects unsafe group IDs before creating groups or users', async () => {
    if (!prisma) throw new Error('Prisma was not initialized');
    const group = await request('/groups', owner.accessToken, 'POST', { id: '../outside', name: 'Unsafe' });
    expect(group.status).toBe(400);
    expect(await group.json()).toMatchObject({ message: 'api.files.invalidPath' });
    expect(await prisma.group.findUnique({ where: { id: '../outside' } })).toBeNull();

    const registration = await request('/auth/register', undefined, 'POST', {
      email: 'unsafe-group@example.test',
      password: 'test-password',
      groupId: '..\\outside',
    });
    expect(registration.status).toBe(400);
    expect(await registration.json()).toMatchObject({ message: 'api.files.invalidPath' });
    expect(await prisma.user.findUnique({ where: { email: 'unsafe-group@example.test' } })).toBeNull();
  });

  it.skipIf(process.platform !== 'win32')(
    'rejects a differently cased ID for an existing group directory',
    async () => {
      const response = await request('/groups', owner.accessToken, 'POST', {
        id: 'SHARED-GROUP',
        name: 'Unsafe alias',
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ message: 'api.files.invalidPath' });
    }
  );

  it('round-trips relative paths through folder, upload, list, search, info, download, move, copy, and remove', async () => {
    if (!tempDir || !app) throw new Error('Test app or temporary storage was not initialized');
    const groupId = 'shared-group';
    const folder = await request('/files/folder', owner.accessToken, 'POST', { groupId, newPath: '', name: 'work' });
    expect(folder.status).toBe(201);
    expect(await folder.json()).toMatchObject({ folderDir: 'work' });
    const rootQuery = new URLSearchParams({ groupId, fileUri: '' });
    const rootInfo = await request(`/files/info?${rootQuery}`, owner.accessToken);
    expect(rootInfo.status).toBe(200);
    expect(await rootInfo.json()).toMatchObject({ uri: '', isDirectory: true });

    const upload = new FormData();
    upload.append('groupId', groupId);
    upload.append('newPath', 'work');
    upload.append('name', 'uploaded');
    upload.append('file', new Blob(['uploaded data']), '..\\safe.txt');
    const uploaded = await fetch(`${baseUrl}/api/files`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner.accessToken}` },
      body: upload,
    });
    expect(uploaded.status).toBe(201);
    expect(await uploaded.json()).toMatchObject({ filePath: 'work/uploaded/safe.txt' });

    const { FilesService }: typeof import('../src/services/files.service') = await import(
      join(buildDir, 'services/files.service.js')
    );
    const directUpload = await app.get(FilesService).createFile(
      { groupId, newPath: 'work', name: 'direct' },
      {
        fieldname: 'file',
        originalname: 'C:\\elsewhere\\direct.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 6,
        buffer: Buffer.from('direct'),
        stream: Readable.from([]),
        destination: '',
        filename: '',
        path: '',
      },
      {
        sub: owner.user.id,
        email: owner.user.email,
        role: 'user',
        typ: 'access',
        sid: jwtService!.verify<{ sid: string }>(owner.accessToken).sid,
      }
    );
    expect(directUpload.filePath).toBe('work/direct/direct.txt');

    const listing = await request('/files/all', owner.accessToken, 'POST', {
      items: [{ groupId, path: 'work/uploaded' }],
    });

    expect(listing.status).toBe(201);
    expect(await listing.json()).toEqual([
      expect.objectContaining({ name: 'safe.txt', uri: 'work/uploaded/safe.txt' }),
    ]);
    const query = new URLSearchParams({ groupId, fileUri: 'work/uploaded/safe.txt' });
    const info = await request(`/files/info?${query}`, owner.accessToken);
    expect(info.status).toBe(200);
    expect(await info.json()).toMatchObject({ uri: 'work/uploaded/safe.txt' });
    const download = await request(`/files/download?${query}`, owner.accessToken);
    expect(download.status).toBe(200);
    expect(await download.text()).toBe('uploaded data');
    const search = await request('/files/search?query=safe.txt', owner.accessToken);
    expect(search.status).toBe(200);
    expect(await search.json()).toContainEqual(expect.objectContaining({ groupId, uri: 'work/uploaded/safe.txt' }));

    expect(
      (
        await request('/files', owner.accessToken, 'PATCH', {
          groupId,
          fileUri: 'work/uploaded/safe.txt',
          newPath: 'work',
          name: 'moved.txt',
        })
      ).status
    ).toBe(200);
    expect(
      (
        await request('/files/copy', owner.accessToken, 'POST', {
          groupId,
          fileUri: 'work/moved.txt',
          newPath: '',
          name: 'copied.txt',
        })
      ).status
    ).toBe(201);
    expect(await readFile(join(tempDir, 'files', groupId, 'copied.txt'), 'utf8')).toBe('uploaded data');
    expect((await request('/files', owner.accessToken, 'DELETE', { groupId, fileUri: 'copied.txt' })).status).toBe(200);
  });

  it('skips outside symlinks in listings and search, and rejects reading or writing through them', async () => {
    if (!tempDir) throw new Error('Temporary storage was not initialized');
    const groupId = 'shared-group';
    const groupRoot = join(tempDir, 'files', groupId);
    const outside = join(tempDir, 'outside');
    const inside = join(groupRoot, 'inside-target');
    await mkdir(outside);
    await mkdir(inside);
    await writeFile(join(outside, 'outside-secret.txt'), 'outside data');
    await writeFile(join(inside, 'inside.txt'), 'inside data');
    const linkType = process.platform === 'win32' ? 'junction' : 'dir';
    await symlink(outside, join(groupRoot, 'outside-link'), linkType);
    await symlink(inside, join(groupRoot, 'inside-link'), linkType);

    const listing = await request('/files/all', owner.accessToken, 'POST', { items: [{ groupId, path: '' }] });
    expect(listing.status).toBe(201);
    const entries = (await listing.json()) as { name: string }[];
    expect(entries).toContainEqual(expect.objectContaining({ name: 'inside-link' }));
    expect(entries).not.toContainEqual(expect.objectContaining({ name: 'outside-link' }));
    const insideQuery = new URLSearchParams({ groupId, fileUri: 'inside-link/inside.txt' });
    expect(await (await request(`/files/download?${insideQuery}`, owner.accessToken)).text()).toBe('inside data');

    const outsideQuery = new URLSearchParams({ groupId, fileUri: 'outside-link/outside-secret.txt' });
    const outsideRead = await request(`/files/download?${outsideQuery}`, owner.accessToken);
    expect(outsideRead.status).toBe(400);
    const outsideWrite = await request('/files/folder', owner.accessToken, 'POST', {
      groupId,
      newPath: 'outside-link',
      name: 'forbidden',
    });
    expect(outsideWrite.status).toBe(400);
    for (const endpoint of ['/files', '/files/copy']) {
      const response = await request(endpoint, owner.accessToken, endpoint === '/files' ? 'PATCH' : 'POST', {
        groupId,
        fileUri: 'source.txt',
        newPath: 'outside-link',
        name: 'forbidden.txt',
      });
      expect(response.status).toBe(400);
    }
    const search = await request('/files/search?query=outside-secret', owner.accessToken);
    expect(await search.json()).not.toContainEqual(expect.objectContaining({ groupId }));
    expect(await readFile(join(outside, 'outside-secret.txt'), 'utf8')).toBe('outside data');

    await symlink(outside, join(inside, 'outside-child'), linkType);
    const copy = await request('/files/copy', owner.accessToken, 'POST', {
      groupId,
      fileUri: 'inside-target',
      newPath: '',
      name: 'inside-copy',
    });
    expect(copy.status).toBe(201);
    await expect(lstat(join(groupRoot, 'inside-copy', 'outside-child'))).rejects.toMatchObject({ code: 'ENOENT' });
    const copied = await request('/files/all', owner.accessToken, 'POST', {
      items: [{ groupId, path: 'inside-copy' }],
    });
    expect(await copied.json()).toEqual([expect.objectContaining({ name: 'inside.txt' })]);
  });

  it('does not merge a copied folder into an existing suffix containing an outside symlink', async () => {
    if (!tempDir) throw new Error('Temporary storage was not initialized');
    const groupId = 'shared-group';
    const groupRoot = join(tempDir, 'files', groupId);
    const outside = join(tempDir, 'copy-outside');
    await mkdir(join(groupRoot, 'copy-source', 'nested'), { recursive: true });
    await mkdir(join(groupRoot, 'collision'));
    await mkdir(join(groupRoot, 'collision_copy'));
    await mkdir(outside);
    await writeFile(join(groupRoot, 'copy-source', 'nested', 'file.txt'), 'group data');
    await writeFile(join(outside, 'file.txt'), 'outside data');
    await symlink(
      outside,
      join(groupRoot, 'collision_copy', 'nested'),
      process.platform === 'win32' ? 'junction' : 'dir'
    );

    const copy = await request('/files/copy', owner.accessToken, 'POST', {
      groupId,
      fileUri: 'copy-source',
      newPath: '',
      name: 'collision',
    });
    expect(copy.status).toBe(201);
    expect(await readFile(join(groupRoot, 'collision_copy_copy', 'nested', 'file.txt'), 'utf8')).toBe('group data');
    expect(await readFile(join(outside, 'file.txt'), 'utf8')).toBe('outside data');
  });

  pendingSecurity('rejects folder creation by a read-only member', async () => {
    const response = await request('/files/folder', reader.accessToken, 'POST', {
      groupId: 'shared-group',
      newPath: '',
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

  it('rejects user listing for an ordinary user', async () => {
    expect((await request('/users', reader.accessToken)).status).toBe(403);
  });

  it('rejects user creation by an ordinary user', async () => {
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

  it('rejects user deletion by an ordinary user', async () => {
    if (!prisma) throw new Error('Prisma was not initialized');
    const user = await prisma.user.create({ data: { email: 'deletable@example.test', password: 'test-password' } });
    expect((await request(`/users/${user.id}`, reader.accessToken, 'DELETE')).status).toBe(403);
  });

  it('rejects role escalation by an ordinary user', async () => {
    expect((await request(`/users/${reader.user.id}`, reader.accessToken, 'PATCH', { role: 'admin' })).status).toBe(
      403
    );
  });

  it('rejects role in public registration and never exposes password in auth responses', async () => {
    if (!authService) throw new Error('AuthService was not initialized');

    const withRole = await request('/auth/register', undefined, 'POST', {
      email: 'role-attempt@example.test',
      password: 'test-password',
      groupId: 'personal-role-attempt',
      role: 'admin',
    });
    expect(withRole.status).toBe(400);

    const registered = await request('/auth/register', undefined, 'POST', {
      email: 'clean-register@example.test',
      password: 'test-password',
      groupId: 'personal-clean-register',
    });
    expect(registered.status).toBe(201);
    const registeredBody = (await registered.json()) as { user: Record<string, unknown> };
    expect(registeredBody.user.role).toBe('user');
    expect(registeredBody.user).not.toHaveProperty('password');

    const loggedIn = await authService.login({ email: 'clean-register@example.test', password: 'test-password' });
    expect(loggedIn.user).not.toHaveProperty('password');
  });

  it('restricts user creation roles to owner, hashes passwords, and omits password from responses', async () => {
    if (!prisma || !usersService || !authService) throw new Error('Services were not initialized');

    const serviceCreated = await usersService.create({
      email: 'service-direct@example.test',
      password: 'direct-password',
      role: 'admin',
      groupId: 'personal-service-direct',
    });
    expect(serviceCreated.role).toBe('user');
    expect(serviceCreated).not.toHaveProperty('password');

    const adminCreateRes = await request('/users', serverAdmin.accessToken, 'POST', {
      email: 'created-by-admin@example.test',
      password: 'admin-created-password',
      name: 'Created By Admin',
      role: 'admin',
      groupId: 'personal-created-by-admin',
    });
    expect(adminCreateRes.status).toBe(201);
    const adminCreated = (await adminCreateRes.json()) as Record<string, unknown> & { id: string; role: string };
    expect(adminCreated.role).toBe('user');
    expect(adminCreated).not.toHaveProperty('password');

    const storedAdminCreated = await prisma.user.findUniqueOrThrow({ where: { id: adminCreated.id } });
    expect(storedAdminCreated.password).not.toBe('admin-created-password');
    expect(await compare('admin-created-password', storedAdminCreated.password)).toBe(true);
    await expect(
      authService.login({ email: 'created-by-admin@example.test', password: 'admin-created-password' })
    ).resolves.toMatchObject({ user: { id: adminCreated.id, role: 'user' } });

    const ownerAdminRes = await request('/users', serverOwner.accessToken, 'POST', {
      email: 'created-admin@example.test',
      password: 'owner-created-password',
      role: 'admin',
      groupId: 'personal-created-admin',
    });
    expect(ownerAdminRes.status).toBe(201);
    const ownerCreatedAdmin = (await ownerAdminRes.json()) as Record<string, unknown> & { id: string; role: string };
    expect(ownerCreatedAdmin.role).toBe('admin');
    expect(ownerCreatedAdmin).not.toHaveProperty('password');

    const ownerSecondOwnerRes = await request('/users', serverOwner.accessToken, 'POST', {
      email: 'second-owner@example.test',
      password: 'owner-created-password',
      role: 'owner',
      groupId: 'personal-second-owner',
    });
    expect(ownerSecondOwnerRes.status).toBe(403);
  });

  it('restricts user listing and user detail lookups while keeping search minimal', async () => {
    const adminListRes = await request('/users', serverAdmin.accessToken);
    expect(adminListRes.status).toBe(200);
    const listedUsers = (await adminListRes.json()) as Record<string, unknown>[];
    expect(listedUsers.length).toBeGreaterThan(0);
    for (const item of listedUsers) {
      expect(item).not.toHaveProperty('password');
    }

    const selfDetailRes = await request(`/users/${reader.user.id}`, reader.accessToken);
    expect(selfDetailRes.status).toBe(200);
    expect((await selfDetailRes.json()) as Record<string, unknown>).not.toHaveProperty('password');

    expect((await request(`/users/${editor.user.id}`, reader.accessToken)).status).toBe(403);
    expect((await request(`/users/${editor.user.id}`, serverAdmin.accessToken)).status).toBe(200);

    const searchRes = await request('/users/search/reader@example.test', editor.accessToken);
    expect(searchRes.status).toBe(200);
    const searchResults = (await searchRes.json()) as Record<string, unknown>[];
    expect(searchResults.length).toBeGreaterThan(0);
    for (const item of searchResults) {
      expect(Object.keys(item).sort()).toEqual(['email', 'id', 'name']);
    }
  });

  it('enforces PATCH /users/:id ownership, owner-only role updates, and bcrypt password hashing', async () => {
    if (!prisma || !authService) throw new Error('Services were not initialized');

    const selfUpdateRes = await request(`/users/${reader.user.id}`, reader.accessToken, 'PATCH', {
      name: 'Reader Self Name',
      settings: { theme: 'dark' },
    });
    expect(selfUpdateRes.status).toBe(200);
    const selfUpdated = (await selfUpdateRes.json()) as Record<string, unknown>;
    expect(selfUpdated).toMatchObject({ id: reader.user.id, name: 'Reader Self Name', settings: { theme: 'dark' } });
    expect(selfUpdated).not.toHaveProperty('password');

    expect((await request(`/users/${editor.user.id}`, reader.accessToken, 'PATCH', { name: 'Tampered' })).status).toBe(
      403
    );
    expect(
      (await request(`/users/${reader.user.id}`, reader.accessToken, 'PATCH', { email: 'new-reader@example.test' }))
        .status
    ).toBe(403);
    expect(
      (await request(`/users/${reader.user.id}`, reader.accessToken, 'PATCH', { password: 'unverified-password' }))
        .status
    ).toBe(403);

    expect(
      (await request(`/users/${editor.user.id}`, serverAdmin.accessToken, 'PATCH', { role: 'admin' })).status
    ).toBe(403);
    expect(
      (
        await request(`/users/${serverOwner.user.id}`, serverAdmin.accessToken, 'PATCH', {
          password: 'admin-takeover-password',
        })
      ).status
    ).toBe(403);

    const promoteRes = await request(`/users/${outsider.user.id}`, serverOwner.accessToken, 'PATCH', {
      role: 'admin',
    });
    expect(promoteRes.status).toBe(200);
    expect(((await promoteRes.json()) as { role: string }).role).toBe('admin');

    expect(
      (await request(`/users/${outsider.user.id}`, serverAdmin.accessToken, 'PATCH', { name: 'Admin Vs Admin' })).status
    ).toBe(403);

    const demoteRes = await request(`/users/${outsider.user.id}`, serverOwner.accessToken, 'PATCH', {
      role: 'user',
    });
    expect(demoteRes.status).toBe(200);
    expect(((await demoteRes.json()) as { role: string }).role).toBe('user');

    expect(
      (await request(`/users/${outsider.user.id}`, serverOwner.accessToken, 'PATCH', { role: 'owner' })).status
    ).toBe(403);
    expect(
      (await request(`/users/${serverOwner.user.id}`, serverOwner.accessToken, 'PATCH', { role: 'admin' })).status
    ).toBe(403);

    const passwordResetRes = await request(`/users/${outsider.user.id}`, serverAdmin.accessToken, 'PATCH', {
      password: 'rotated-by-admin-password',
    });
    expect(passwordResetRes.status).toBe(200);
    expect((await passwordResetRes.json()) as Record<string, unknown>).not.toHaveProperty('password');

    const storedOutsider = await prisma.user.findUniqueOrThrow({ where: { id: outsider.user.id } });
    expect(storedOutsider.password).not.toBe('rotated-by-admin-password');
    expect(await compare('rotated-by-admin-password', storedOutsider.password)).toBe(true);
    await expect(
      authService.login({ email: 'outsider@example.test', password: 'rotated-by-admin-password' })
    ).resolves.toMatchObject({ user: { id: outsider.user.id } });
  });

  it('allows owner and admin to delete regular users while protecting owner and admin accounts', async () => {
    if (!prisma) throw new Error('Prisma was not initialized');

    const targetUser = await prisma.user.create({
      data: { email: 'removable-user@example.test', password: 'removable-password', role: 'user' },
    });
    const targetAdmin = await prisma.user.create({
      data: { email: 'removable-admin@example.test', password: 'removable-password', role: 'admin' },
    });

    expect((await request(`/users/${serverOwner.user.id}`, serverAdmin.accessToken, 'DELETE')).status).toBe(403);
    expect((await request(`/users/${targetAdmin.id}`, serverAdmin.accessToken, 'DELETE')).status).toBe(403);
    expect((await request(`/users/${serverOwner.user.id}`, serverOwner.accessToken, 'DELETE')).status).toBe(403);

    const adminDeleteUserRes = await request(`/users/${targetUser.id}`, serverAdmin.accessToken, 'DELETE');
    expect(adminDeleteUserRes.status).toBe(200);
    expect((await adminDeleteUserRes.json()) as Record<string, unknown>).not.toHaveProperty('password');

    const ownerDeleteAdminRes = await request(`/users/${targetAdmin.id}`, serverOwner.accessToken, 'DELETE');
    expect(ownerDeleteAdminRes.status).toBe(200);
    expect((await ownerDeleteAdminRes.json()) as Record<string, unknown>).not.toHaveProperty('password');
  });
});

describe('session security', () => {
  it('stores hashed tokens, rotates them with a sliding expiry, and revokes a reused token family', async () => {
    if (!prisma || !authService || !jwtService) throw new Error('Services were not initialized');
    const registered = await request(
      '/auth/register',
      undefined,
      'POST',
      { email: 'session-family@example.test', password: 'test-password', groupId: 'session-family' },
      { 'User-Agent': 'Session test device' }
    );
    expect(registered.status).toBe(201);
    const first = (await registered.json()) as Account;
    const claims = jwtService.verify<{ sid: string; iat: number; exp: number; jti: string }>(first.refreshToken);
    expect(claims.exp - claims.iat).toBe(30 * 24 * 60 * 60);

    const stored = await prisma.session.findUniqueOrThrow({ where: { id: claims.sid } });
    expect(stored.tokenHash).toBe(createHash('sha256').update(first.refreshToken).digest('hex'));
    expect(stored.tokenHash).not.toBe(first.refreshToken);
    expect(stored.deviceLabel).toBe('Session test device');

    const previousExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const previousUse = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.session.update({
      where: { id: claims.sid },
      data: { expiresAt: previousExpiry, lastUsedAt: previousUse },
    });

    const listed = await request('/auth/sessions', first.accessToken);
    expect(listed.status).toBe(200);
    const sessions = (await listed.json()) as Record<string, unknown>[];
    expect(sessions).toEqual([
      expect.objectContaining({ id: claims.sid, deviceLabel: 'Session test device', isCurrent: true }),
    ]);
    expect(Object.keys(sessions[0]).sort()).toEqual([
      'createdAt',
      'deviceLabel',
      'expiresAt',
      'id',
      'isCurrent',
      'lastUsedAt',
    ]);

    const refreshedResponse = await request('/auth/refresh', undefined, 'POST', { refreshToken: first.refreshToken });
    expect(refreshedResponse.status).toBe(200);
    const refreshed = (await refreshedResponse.json()) as Account;
    expect(refreshed.refreshToken).not.toBe(first.refreshToken);
    expect(refreshed.user).not.toHaveProperty('password');
    const refreshedClaims = jwtService.verify<{ sid: string; jti: string }>(refreshed.refreshToken);
    expect(refreshedClaims.sid).toBe(claims.sid);
    expect(refreshedClaims.jti).not.toBe(claims.jti);
    const rotated = await prisma.session.findUniqueOrThrow({ where: { id: claims.sid } });
    expect(rotated.tokenHash).toBe(createHash('sha256').update(refreshed.refreshToken).digest('hex'));
    expect(rotated.lastUsedAt.getTime()).toBeGreaterThan(previousUse.getTime());
    expect(rotated.expiresAt.getTime()).toBeGreaterThan(previousExpiry.getTime());

    const other = await authService.login({ email: first.user.email, password: 'test-password' }, 'Other device');
    expect((await request('/auth/refresh', undefined, 'POST', { refreshToken: first.refreshToken })).status).toBe(401);
    expect((await request(`/users/${first.user.id}`, refreshed.accessToken)).status).toBe(401);
    expect((await request('/auth/refresh', undefined, 'POST', { refreshToken: refreshed.refreshToken })).status).toBe(
      401
    );
    expect((await request(`/users/${other.user.id}`, other.accessToken)).status).toBe(200);
    const remaining = await request('/auth/sessions', other.accessToken);
    expect(await remaining.json()).toEqual([expect.objectContaining({ deviceLabel: 'Other device', isCurrent: true })]);
  });

  it('revokes the family if the same refresh token is used concurrently', async () => {
    if (!authService) throw new Error('AuthService was not initialized');
    const account = await authService.login({ email: 'owner@example.test', password: 'test-password' });
    const responses = await Promise.all([
      request('/auth/refresh', undefined, 'POST', { refreshToken: account.refreshToken }),
      request('/auth/refresh', undefined, 'POST', { refreshToken: account.refreshToken }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
    const winner = (await responses.find((response) => response.status === 200)!.json()) as Account;
    expect((await request(`/users/${account.user.id}`, winner.accessToken)).status).toBe(401);
    expect((await request('/auth/refresh', undefined, 'POST', { refreshToken: winner.refreshToken })).status).toBe(401);
  });

  it('restricts session revocation to the account and immediately revokes access', async () => {
    if (!authService || !jwtService) throw new Error('Services were not initialized');
    const credentials = { email: 'owner@example.test', password: 'test-password' };
    const current = await authService.login(credentials);
    const other = await authService.login(credentials);
    const outsiderSession = await authService.login({ email: 'editor@example.test', password: 'test-password' });
    const currentId = jwtService.verify<{ sid: string }>(current.accessToken).sid;
    const otherId = jwtService.verify<{ sid: string }>(other.accessToken).sid;
    const outsiderId = jwtService.verify<{ sid: string }>(outsiderSession.accessToken).sid;

    expect((await request(`/auth/sessions/${outsiderId}`, current.accessToken, 'DELETE')).status).toBe(404);
    expect((await request(`/users/${outsiderSession.user.id}`, outsiderSession.accessToken)).status).toBe(200);
    expect((await request(`/auth/sessions/${otherId}`, current.accessToken, 'DELETE')).status).toBe(204);
    expect((await request(`/users/${other.user.id}`, other.accessToken)).status).toBe(401);
    expect((await request('/auth/refresh', undefined, 'POST', { refreshToken: other.refreshToken })).status).toBe(401);
    expect((await request(`/users/${current.user.id}`, current.accessToken)).status).toBe(200);
    expect((await request(`/auth/sessions/${currentId}`, current.accessToken, 'DELETE')).status).toBe(204);
    expect((await request(`/users/${current.user.id}`, current.accessToken)).status).toBe(401);
  });

  it('logs out only the current session and rejects expired or legacy sessions', async () => {
    if (!authService || !jwtService || !prisma) throw new Error('Services were not initialized');
    const credentials = { email: 'reader@example.test', password: 'test-password' };
    const current = await authService.login(credentials);
    const other = await authService.login(credentials);
    expect((await request('/auth/logout', undefined, 'POST')).status).toBe(401);
    expect((await request('/auth/sessions')).status).toBe(401);
    expect((await request('/auth/logout', current.accessToken, 'POST')).status).toBe(204);
    expect((await request(`/users/${current.user.id}`, current.accessToken)).status).toBe(401);
    expect((await request('/auth/refresh', undefined, 'POST', { refreshToken: current.refreshToken })).status).toBe(
      401
    );
    expect((await request(`/users/${other.user.id}`, other.accessToken)).status).toBe(200);

    const legacy = jwtService.sign({ sub: other.user.id, email: other.user.email, role: 'user', typ: 'refresh' });
    await expect(authService.refresh({ refreshToken: legacy })).rejects.toMatchObject({ status: 401 });
    await expect(authService.refresh({ refreshToken: other.accessToken })).rejects.toMatchObject({ status: 401 });
    const legacyAccess = jwtService.sign({ sub: other.user.id, email: other.user.email, role: 'user', typ: 'access' });
    expect((await request(`/users/${other.user.id}`, legacyAccess)).status).toBe(401);
    const otherId = jwtService.verify<{ sid: string }>(other.accessToken).sid;
    await prisma.session.update({ where: { id: otherId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await request(`/users/${other.user.id}`, other.accessToken)).status).toBe(401);
    await expect(authService.refresh({ refreshToken: other.refreshToken })).rejects.toMatchObject({ status: 401 });
  });
});
