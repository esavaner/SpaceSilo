import * as fs from 'node:fs';
import * as path from 'node:path';
import { Err } from './api-message';
import { environment } from './env.validation';

const invalidPath = () => Err.BadRequest('api.files.invalidPath');

function decodeForValidation(value: string): string {
  let decoded = value;
  while (true) {
    const next = decoded.replace(/%(?:25)*([0-9a-f]{2})/gi, (_match, byte: string) =>
      String.fromCharCode(parseInt(byte, 16))
    );
    if (next === decoded) return decoded;
    decoded = next;
  }
}

function isWithin(root: string, candidate: string): boolean {
  const normalizedRoot = process.platform === 'win32' ? root.toLowerCase() : root;
  const normalizedCandidate = process.platform === 'win32' ? candidate.toLowerCase() : candidate;
  const prefix = normalizedRoot.endsWith(path.sep) ? normalizedRoot : `${normalizedRoot}${path.sep}`;
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(prefix);
}

export function assertValidGroupId(groupId: string): void {
  const decoded = decodeForValidation(groupId);
  if (
    !groupId ||
    decoded === '.' ||
    decoded === '..' ||
    /[\\/:\0]/.test(decoded) ||
    (process.platform === 'win32' && /[. ]$/.test(decoded))
  ) {
    throw invalidPath();
  }
}

export function resolveGroupPath(groupId: string, ...segments: string[]): string {
  assertValidGroupId(groupId);

  for (const segment of segments) {
    const decoded = decodeForValidation(segment).replace(/\\/g, '/');
    const parts = decoded.split('/');
    if (
      decoded.startsWith('/') ||
      /^[a-z]:/i.test(decoded) ||
      decoded.includes('\0') ||
      parts.includes('..') ||
      (process.platform === 'win32' && parts.some((part) => part !== '.' && /[. ]$/.test(part)))
    ) {
      throw invalidPath();
    }
  }

  const filesRoot = path.resolve(environment.filesPath);
  const groupRoot = path.resolve(filesRoot, groupId);
  const target = path.resolve(groupRoot, ...segments.map((segment) => segment.replace(/\\/g, '/')));
  if (groupRoot === filesRoot || !isWithin(filesRoot, groupRoot) || !isWithin(groupRoot, target)) {
    throw invalidPath();
  }

  let current = groupRoot;
  for (const part of ['', ...path.relative(groupRoot, target).split(path.sep).filter(Boolean)]) {
    if (part) current = path.join(current, part);
    const stats = fs.lstatSync(current, { throwIfNoEntry: false });
    if (!stats) break;
    if (
      current === groupRoot &&
      process.platform === 'win32' &&
      !stats.isSymbolicLink() &&
      path.basename(fs.realpathSync.native(groupRoot)) !== groupId
    ) {
      throw invalidPath();
    }
    if (!stats.isSymbolicLink()) continue;
    if (current === groupRoot) throw invalidPath();

    try {
      if (!isWithin(fs.realpathSync.native(groupRoot), fs.realpathSync.native(current))) throw invalidPath();
    } catch (error) {
      if (error instanceof Error && 'code' in error && ['ENOENT', 'ELOOP', 'ENOTDIR'].includes(String(error.code))) {
        throw invalidPath();
      }
      throw error;
    }
  }

  return target;
}
