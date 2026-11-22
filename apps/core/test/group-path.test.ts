import { BadRequestException } from '@nestjs/common';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { validateEnvironment } from '../src/common/env.validation';
import { resolveGroupPath } from '../src/common/group-path';

let tempDir: string;
let filesRoot: string;
let groupRoot: string;

beforeAll(() => {
  tempDir = mkdtempSync(path.join(tmpdir(), 'spacesilo-group-path-'));
  filesRoot = path.join(tempDir, 'files');
  groupRoot = path.join(filesRoot, 'group');
  const safeDir = path.join(groupRoot, 'safe');
  const otherGroup = path.join(filesRoot, 'group-other');
  mkdirSync(safeDir, { recursive: true });
  mkdirSync(otherGroup);
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  symlinkSync(safeDir, path.join(groupRoot, 'inside-link'), linkType);
  symlinkSync(otherGroup, path.join(groupRoot, 'outside-link'), linkType);
  symlinkSync(otherGroup, path.join(filesRoot, 'linked-group'), linkType);
  validateEnvironment({
    DATABASE_URL: 'unused',
    FILES_PATH: filesRoot,
    STORAGE_PATH: tempDir,
    APPDATA_PATH: tempDir,
  });
});

afterAll(() => {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
});

describe('resolveGroupPath', () => {
  it('resolves the group root and relative paths with either separator', () => {
    expect(resolveGroupPath('group')).toBe(groupRoot);
    expect(resolveGroupPath('group', '')).toBe(groupRoot);
    expect(resolveGroupPath('group', 'safe\\nested', 'photo.jpg')).toBe(
      path.join(groupRoot, 'safe', 'nested', 'photo.jpg')
    );
    expect(resolveGroupPath('group', 'safe/nested', 'photo.jpg')).toBe(
      path.join(groupRoot, 'safe', 'nested', 'photo.jpg')
    );
  });

  it.each([
    '',
    '.',
    '..',
    '../other',
    '..\\other',
    '/absolute',
    'C:\\absolute',
    '%2e%2e',
    'group%2fother',
    'group:other',
  ])('rejects an unsafe group ID: %s', (groupId) => {
    expect(() => resolveGroupPath(groupId)).toThrow(BadRequestException);
  });

  it.each([
    '../group-other/file',
    'safe/../../group-other/file',
    '..\\group-other\\file',
    '/absolute/file',
    '\\absolute\\file',
    'C:\\absolute\\file',
    'C:relative',
    '\\\\server\\share\\file',
    '%2e%2e%2fsecret',
    '%252e%252e%255csecret',
    '%25%32%65%25%32%65%25%32%66secret',
    'safe/\0file',
  ])('rejects unsafe path segments: %s', (segment) => {
    expect(() => resolveGroupPath('group', segment)).toThrow('api.files.invalidPath');
  });

  it('allows links within the group but rejects links to another group, including the group root', () => {
    expect(resolveGroupPath('group', 'inside-link', 'new', 'file.txt')).toBe(
      path.join(groupRoot, 'inside-link', 'new', 'file.txt')
    );
    expect(() => resolveGroupPath('group', 'outside-link', 'file.txt')).toThrow('api.files.invalidPath');
    expect(() => resolveGroupPath('linked-group')).toThrow('api.files.invalidPath');
  });

  it.skipIf(process.platform !== 'win32')('rejects group IDs that alias another group by case', () => {
    expect(() => resolveGroupPath('GROUP')).toThrow('api.files.invalidPath');
  });
});
