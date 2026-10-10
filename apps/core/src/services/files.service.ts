import { Injectable, InternalServerErrorException, StreamableFile } from '@nestjs/common';
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
import { environment } from '@/common/env.validation';

const extensionOf = (name: string) => path.extname(name).replace('.', '').toLocaleLowerCase();

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

  private existingPath(groupId: string, fileUri: string) {
    const filePath = path.join(environment.filesPath, groupId, fileUri);
    if (!fs.existsSync(filePath)) {
      throw Err.NotFound('api.files.fileErr.NotFound');
    }

    return filePath;
  }

  // Copy and move never overwrite: a taken target name gets a `_copy` suffix.
  private freeTargetPath(dto: { groupId: string; newPath: string; name: string }, filePath: string) {
    const target = path.join(environment.filesPath, dto.groupId, dto.newPath, dto.name);
    return filePath === target || fs.existsSync(target) ? `${target}_copy` : target;
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
    await this.groupService.assertGroupAccess(dto.groupId, user);
    const fileDir = path.join(environment.filesPath, dto.groupId, dto.newPath, dto.name);
    const filePath = path.join(fileDir, file.originalname);
    fs.mkdirSync(fileDir, { recursive: true });
    fs.writeFileSync(filePath, file.buffer);
    return { message: 'api.files.createFileSuccess', filePath };
  }

  async createFolder(dto: CreateFolderRequest, user: TokenPayload): Promise<FileActionResponse> {
    await this.groupService.assertGroupAccess(dto.groupId, user);
    const folderDir = path.join(environment.filesPath, dto.groupId, dto.newPath, dto.name);
    fs.mkdirSync(folderDir, { recursive: true });
    return { message: 'api.files.createFolderSuccess', folderDir };
  }

  async findAll(dto: FindAllFilesRequest, user: TokenPayload): Promise<FileResponse[]> {
    const files: FileResponse[] = [];

    for (const { groupId, path: itemPath, skip = 0, take } of dto.items ?? []) {
      const relativePath = itemPath || '';
      await this.groupService.assertGroupAccess(groupId, user);
      const fileDir = path.join(environment.filesPath, groupId, relativePath);
      if (!fs.existsSync(fileDir)) {
        continue;
      }

      io(() => {
        const names = fs.readdirSync(fileDir).slice(skip, typeof take === 'number' ? skip + take : undefined);
        for (const name of names) {
          files.push(this.toFileResponse(path.join(fileDir, name), groupId, path.join('/', relativePath, name)));
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

      const groupPath = path.join(environment.filesPath, group.id);
      const directories = [groupPath];

      while (directories.length > 0 && results.length < limit) {
        const directoryPath = directories.pop()!;
        let entries: fs.Dirent[];

        try {
          entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
        } catch {
          continue;
        }

        for (const entry of entries) {
          if (results.length >= limit) {
            break;
          }

          if (entry.isSymbolicLink()) {
            continue;
          }

          const filePath = path.join(directoryPath, entry.name);
          const relativePath = path.relative(groupPath, filePath);
          const uri = `/${relativePath.split(path.sep).join('/')}`;

          if (uri.toLocaleLowerCase().includes(query)) {
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
    await this.groupService.assertGroupAccess(dto.groupId, user);
    return this.toFileResponse(this.existingPath(dto.groupId, dto.fileUri), dto.groupId, dto.fileUri);
  }

  async findInfo(dto: FindFileRequest, user: TokenPayload): Promise<FileInfoResponse> {
    const group = await this.groupService.findFileInfoGroup(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);

    return {
      ...this.toFileResponse(filePath, dto.groupId, dto.fileUri),
      createdAt: fs.statSync(filePath).birthtime,
      group,
    };
  }

  async download(dto: DownloadFileRequest, user: TokenPayload) {
    await this.groupService.assertGroupAccess(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);

    return new StreamableFile(fs.createReadStream(filePath), { type: 'application/octet-stream' });
  }

  async move(dto: MoveFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    await this.groupService.assertGroupAccess(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);

    io(() => fsa.moveSync(filePath, this.freeTargetPath(dto, filePath))); // @TODO not sure if this is the best way to rename folders
    return { message: 'api.files.moveSuccess' };
  }

  async remove(dto: RemoveFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    await this.groupService.assertGroupAccess(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);

    io(() => fsa.removeSync(filePath));
    return { message: 'api.files.removeSuccess' };
  }

  async copy(dto: CopyFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    await this.groupService.assertGroupAccess(dto.groupId, user);
    const filePath = this.existingPath(dto.groupId, dto.fileUri);

    io(() => fsa.copySync(filePath, this.freeTargetPath(dto, filePath)));
    return { message: 'api.files.copySuccess' };
  }
}
