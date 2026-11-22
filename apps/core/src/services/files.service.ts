import { BadRequestException, Injectable, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import {
  CopyFileRequest,
  CreateFileRequest,
  CreateFolderRequest,
  DownloadFileRequest,
  FileActionResponse,
  FileInfoResponse,
  FileResponse,
  FindAllFilesRequest,
  FindFileRequest,
  MoveFileRequest,
  RemoveFileRequest,
  FileSearchResponse,
  SearchFilesRequest,
} from '@repo/shared';
import * as fs from 'fs';
import * as fsa from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { type TokenPayload } from '@repo/shared';
import { GroupsService } from './groups.service';
import { Err } from '@/common/api-message';
import { assertValidGroupId, resolveGroupPath } from '@/common/group-path';

const extensionOf = (name: string) => path.extname(name).replace('.', '').toLocaleLowerCase();
const groupUri = (groupPath: string, filePath: string) => path.relative(groupPath, filePath).split(path.sep).join('/');

const io = <T>(action: () => T): T => {
  try {
    return action();
  } catch (error) {
    throw new InternalServerErrorException(error);
  }
};

@Injectable()
export class FilesService {
  constructor(private readonly groupService: GroupsService) {}

  private async assertGroupAccess(groupId: string, user: TokenPayload) {
    assertValidGroupId(groupId);
    return this.groupService.assertGroupAccess(groupId, user);
  }

  private isSafeLink(groupId: string, groupPath: string, filePath: string) {
    try {
      resolveGroupPath(groupId, groupUri(groupPath, filePath));
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) return false;
      throw error;
    }
  }

  private existingPath(groupId: string, fileUri: string) {
    const filePath = resolveGroupPath(groupId, fileUri);
    if (!fs.existsSync(filePath)) {
      throw Err.NotFound('api.files.fileErr.NotFound');
    }

    return filePath;
  }

  // Copy and move never overwrite: a taken target name gets a `_copy` suffix.
  private freeTargetPath(dto: { groupId: string; newPath: string; name: string }, filePath: string, target: string) {
    let name = dto.name;
    while (filePath === target || fs.existsSync(target)) {
      name += '_copy';
      target = resolveGroupPath(dto.groupId, dto.newPath, name);
    }
    return target;
  }

  private toFileResponse(filePath: string, groupId: string, uri: string): FileResponse {
    const stats = fs.statSync(filePath);
    const md5 = stats.isFile() ? crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex') : '';

    return {
      name: path.basename(filePath),
      uri,
      size: stats.size,
      modificationTime: stats.mtime,
      isDirectory: stats.isDirectory(),
      type: extensionOf(filePath),
      md5,
      groupId,
    };
  }

  async createFile(dto: CreateFileRequest, file: Express.Multer.File, user: TokenPayload): Promise<FileActionResponse> {
    await this.assertGroupAccess(dto.groupId, user);
    const groupPath = resolveGroupPath(dto.groupId);
    const fileDir = resolveGroupPath(dto.groupId, dto.newPath, dto.name);
    const name = path.win32.basename(file.originalname);
    if (!name || name === '.' || name === '..') throw Err.BadRequest('api.files.invalidPath');
    const filePath = resolveGroupPath(dto.groupId, dto.newPath, dto.name, name);
    fs.mkdirSync(fileDir, { recursive: true });
    fs.writeFileSync(filePath, file.buffer);
    return { message: 'api.files.createFileSuccess', filePath: groupUri(groupPath, filePath) };
  }

  async createFolder(dto: CreateFolderRequest, user: TokenPayload): Promise<FileActionResponse> {
    await this.assertGroupAccess(dto.groupId, user);
    const groupPath = resolveGroupPath(dto.groupId);
    const folderDir = resolveGroupPath(dto.groupId, dto.newPath, dto.name);
    fs.mkdirSync(folderDir, { recursive: true });
    return { message: 'api.files.createFolderSuccess', folderDir: groupUri(groupPath, folderDir) };
  }

  async findAll(dto: FindAllFilesRequest, user: TokenPayload): Promise<FileResponse[]> {
    const files: FileResponse[] = [];

    for (const { groupId, path: itemPath, skip = 0, take } of dto.items ?? []) {
      const relativePath = itemPath || '';
      await this.assertGroupAccess(groupId, user);
      const groupPath = resolveGroupPath(groupId);
      const fileDir = resolveGroupPath(groupId, relativePath);
      if (!fs.existsSync(fileDir)) {
        continue;
      }

      const entries = io(() => fs.readdirSync(fileDir, { withFileTypes: true }));
      const safeEntries = entries.filter(
        (entry) => !entry.isSymbolicLink() || this.isSafeLink(groupId, groupPath, path.join(fileDir, entry.name))
      );

      io(() => {
        for (const entry of safeEntries.slice(skip, typeof take === 'number' ? skip + take : undefined)) {
          const filePath = path.join(fileDir, entry.name);
          files.push(this.toFileResponse(filePath, groupId, groupUri(groupPath, filePath)));
        }
      });
    }

    return files;
  }

  async search(dto: SearchFilesRequest, user: TokenPayload): Promise<FileSearchResponse[]> {
    const query = dto.query.trim().toLocaleLowerCase();
    if (!query) {
      return [];
    }

    const limit = dto.limit ?? 50;
    const groups = await this.groupService.findAccessibleGroupIds(user);
    const results: FileSearchResponse[] = [];

    for (const group of groups) {
      if (results.length >= limit) {
        break;
      }

      const groupPath = resolveGroupPath(group.id);
      const directories = [groupPath];

      while (directories.length > 0 && results.length < limit) {
        const directoryPath = directories.pop()!;
        let directory: fs.Dir;

        try {
          resolveGroupPath(group.id, groupUri(groupPath, directoryPath));
          directory = fs.opendirSync(directoryPath);
        } catch (error) {
          if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue;
          throw error;
        }

        for await (const entry of directory) {
          if (results.length >= limit) {
            break;
          }

          if (entry.isSymbolicLink()) {
            continue;
          }

          const filePath = path.join(directoryPath, entry.name);
          const uri = groupUri(groupPath, filePath);

          if (`/${uri}`.toLocaleLowerCase().includes(query)) {
            results.push({
              name: entry.name,
              uri,
              isDirectory: entry.isDirectory(),
              groupId: group.id,
              type: entry.isDirectory() ? '' : extensionOf(entry.name),
            });
          }

          if (entry.isDirectory()) {
            directories.push(filePath);
          }
        }
      }
    }

    return results;
  }

  async findFile(dto: FindFileRequest, user: TokenPayload): Promise<FileResponse> {
    await this.assertGroupAccess(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);
    return this.toFileResponse(filePath, dto.groupId, groupUri(resolveGroupPath(dto.groupId), filePath));
  }

  async findInfo(dto: FindFileRequest, user: TokenPayload): Promise<FileInfoResponse> {
    assertValidGroupId(dto.groupId);
    const group = await this.groupService.findFileInfoGroup(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);

    return {
      ...this.toFileResponse(filePath, dto.groupId, groupUri(resolveGroupPath(dto.groupId), filePath)),
      createdAt: fs.statSync(filePath).birthtime,
      group,
    };
  }

  async download(dto: DownloadFileRequest, user: TokenPayload) {
    await this.assertGroupAccess(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);

    return new StreamableFile(fs.createReadStream(filePath, { fd: fs.openSync(filePath, 'r') }), {
      type: 'application/octet-stream',
    });
  }

  async move(dto: MoveFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    await this.assertGroupAccess(dto.groupId, user);
    const target = resolveGroupPath(dto.groupId, dto.newPath, dto.name);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);
    const freeTarget = this.freeTargetPath(dto, filePath, target);

    io(() => fsa.moveSync(filePath, freeTarget)); // @TODO not sure if this is the best way to rename folders
    return { message: 'api.files.moveSuccess' };
  }

  async remove(dto: RemoveFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    await this.assertGroupAccess(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);

    io(() => fsa.removeSync(filePath));
    return { message: 'api.files.removeSuccess' };
  }

  async copy(dto: CopyFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    await this.assertGroupAccess(dto.groupId, user);
    const groupPath = resolveGroupPath(dto.groupId);
    const target = resolveGroupPath(dto.groupId, dto.newPath, dto.name);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);
    const freeTarget = this.freeTargetPath(dto, filePath, target);

    io(() =>
      fsa.copySync(filePath, freeTarget, {
        filter: (source) => !fs.lstatSync(source).isSymbolicLink() || this.isSafeLink(dto.groupId, groupPath, source),
      })
    );
    return { message: 'api.files.copySuccess' };
  }
}
