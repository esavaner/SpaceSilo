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
// import mime from 'mime';
import { type TokenPayload } from '@repo/shared';
import { GroupsService } from './groups.service';
import { Err } from '@/common/api-message';
import { environment } from '@/common/env.validation';

@Injectable()
export class FilesService {
  constructor(private readonly groupService: GroupsService) {}

  private groupCheck(groupId: string, user: TokenPayload) {
    const groupMember = this.groupService.findGroupMember(groupId, user);
    if (!groupMember) {
      throw Err.NotFound('api.files.groupErr.NotFound');
    }

    return groupMember;
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
      type: path.extname(filePath).replace('.', '').toLocaleLowerCase(),
      md5,
      groupId,
    };
  }

  async createFile(dto: CreateFileRequest, file: Express.Multer.File, user: TokenPayload): Promise<FileActionResponse> {
    this.groupCheck(dto.groupId, user);
    const fileDir = path.join(environment.filesPath, dto.groupId, dto.newPath, dto.name);
    const filePath = path.join(fileDir, file.originalname);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.buffer);
    return { message: 'api.files.createFileSuccess', filePath };
  }

  async createFolder(dto: CreateFolderRequest, user: TokenPayload): Promise<FileActionResponse> {
    this.groupCheck(dto.groupId, user);
    const folderDir = path.join(environment.filesPath, dto.groupId, dto.newPath, dto.name);
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, { recursive: true });
    }
    return { message: 'api.files.createFolderSuccess', folderDir };
  }

  async findAll(dto: FindAllFilesRequest, user: TokenPayload): Promise<FileResponse[]> {
    if (!dto.items?.length) {
      return [];
    }

    const files: FileResponse[] = [];
    for (const item of dto.items) {
      const groupId = item.groupId;
      const relativePath = item.path || '';
      const skip = item.skip ?? 0;
      const take = item.take;
      this.groupCheck(groupId, user);
      const fileDir = path.join(environment.filesPath, groupId, relativePath);
      if (!fs.existsSync(fileDir)) {
        continue;
      }

      try {
        const fileList = fs.readdirSync(fileDir);
        const slicedFileList =
          typeof take === 'number' ? fileList.slice(skip, skip + take) : skip > 0 ? fileList.slice(skip) : fileList;

        for (const fileName of slicedFileList) {
          const filePath = path.join(fileDir, fileName);
          files.push(this.toFileResponse(filePath, groupId, path.join('/', relativePath, fileName)));
        }
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
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
              type: entry.isDirectory() ? '' : path.extname(entry.name).replace('.', '').toLocaleLowerCase(),
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
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(environment.filesPath, dto.groupId, dto.fileUri);
    if (!fs.existsSync(filePath)) {
      throw Err.NotFound('api.files.fileErr.NotFound');
    }

    return this.toFileResponse(filePath, dto.groupId, dto.fileUri);
  }

  async findInfo(dto: FindFileRequest, user: TokenPayload): Promise<FileInfoResponse> {
    const group = await this.groupService.findFileInfoGroup(dto.groupId, user);
    const filePath = path.join(environment.filesPath, dto.groupId, dto.fileUri);
    if (!fs.existsSync(filePath)) {
      throw Err.NotFound('api.files.fileErr.NotFound');
    }

    return {
      ...this.toFileResponse(filePath, dto.groupId, dto.fileUri),
      createdAt: fs.statSync(filePath).birthtime,
      group,
    };
  }

  async download(dto: DownloadFileRequest, user: TokenPayload) {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(environment.filesPath, dto.groupId, dto.fileUri);
    if (!fs.existsSync(filePath)) {
      throw Err.NotFound('api.files.fileErr.NotFound');
    }

    try {
      const fileContents = fs.createReadStream(filePath);
      // const mimeType = mime.getType(filePath) || 'application/octet-stream';
      const mimeType = 'application/octet-stream';
      return new StreamableFile(fileContents, { type: mimeType });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async move(dto: MoveFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(environment.filesPath, dto.groupId, dto.fileUri);
    let newFilePath = path.join(environment.filesPath, dto.groupId, dto.newPath, dto.name);
    if (!fs.existsSync(filePath)) {
      throw Err.NotFound('api.files.fileErr.NotFound');
    }

    if (filePath === newFilePath || fs.existsSync(newFilePath)) {
      newFilePath = `${newFilePath}_copy`;
    }

    try {
      fsa.moveSync(filePath, newFilePath); // @TODO not sure if this is the best way to rename folders
      return { message: 'api.files.moveSuccess' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(dto: RemoveFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(environment.filesPath, dto.groupId, dto.fileUri);
    if (!fs.existsSync(filePath)) {
      throw Err.NotFound('api.files.fileErr.NotFound');
    }

    try {
      fsa.removeSync(filePath);
      return { message: 'api.files.removeSuccess' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async copy(dto: CopyFileRequest, user: TokenPayload): Promise<FileActionResponse> {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(environment.filesPath, dto.groupId, dto.fileUri);
    let newFilePath = path.join(environment.filesPath, dto.groupId, dto.newPath, dto.name);

    if (!fs.existsSync(filePath)) {
      throw Err.NotFound('api.files.fileErr.NotFound');
    }

    if (filePath === newFilePath || fs.existsSync(newFilePath)) {
      newFilePath = `${newFilePath}_copy`;
    }

    try {
      fsa.copySync(filePath, newFilePath);
      return { message: 'api.files.copySuccess' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
