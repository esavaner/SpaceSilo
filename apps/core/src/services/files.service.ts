import { Injectable, InternalServerErrorException, NotFoundException, StreamableFile } from '@nestjs/common';
import {
  CreateFileDto,
  FindAllFilesDto,
  DownloadFileDto,
  RemoveFileDto,
  MoveFileDto,
  CreateFolderDto,
  CopyFileDto,
  FileEntity,
  FindFileDto,
} from '@/_dto/files.dto.js';
import * as fs from 'fs';
import * as fsa from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
// import mime from 'mime';
import { TokenPayload } from '@/common/types.js';
import { GroupsService } from './groups.service.js';

@Injectable()
export class FilesService {
  constructor(private readonly groupService: GroupsService) {}

  private groupCheck(groupId: string, user: TokenPayload) {
    const groupMember = this.groupService.findGroupMember(groupId, user);
    if (!groupMember) {
      throw new NotFoundException('Group not found');
    }

    return groupMember;
  }

  async createFile(dto: CreateFileDto, file: Express.Multer.File, user: TokenPayload) {
    this.groupCheck(dto.groupId, user);
    const fileDir = path.join(process.env.FILES_PATH, dto.groupId, dto.newPath, dto.name);
    const filePath = path.join(fileDir, file.originalname);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.buffer);
    return { message: 'File created successfully', filePath };
  }

  async createFolder(dto: CreateFolderDto, user: TokenPayload) {
    this.groupCheck(dto.groupId, user);
    const folderDir = path.join(process.env.FILES_PATH, dto.groupId, dto.newPath, dto.name);
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, { recursive: true });
    }
    return { message: 'Folder created successfully', folderDir };
  }

  async findAll(dto: FindAllFilesDto, user: TokenPayload): Promise<FileEntity[]> {
    if (!dto.groupIds) {
      return [];
    }
    const files: FileEntity[] = [];
    const ids = Array.isArray(dto.groupIds) ? dto.groupIds : [dto.groupIds];
    for (const groupId of ids) {
      this.groupCheck(groupId, user);
      const fileDir = path.join(process.env.FILES_PATH, groupId, dto.path || '');
      if (!fs.existsSync(fileDir)) {
        continue;
      }

      try {
        const fileList = fs.readdirSync(fileDir);
        for (const fileName of fileList) {
          const filePath = path.join(fileDir, fileName);
          const stats = fs.statSync(filePath);
          let md5Hash = '';
          if (stats.isFile()) {
            const fileBuffer = fs.readFileSync(filePath);
            md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
          }
          files.push({
            name: fileName,
            uri: path.join('/', dto.path || '', fileName),
            size: stats.size,
            modificationTime: stats.mtime,
            isDirectory: stats.isDirectory(),
            type: path.extname(filePath).replace('.', '').toLocaleLowerCase(),
            md5: md5Hash,
            groupId,
          });
        }
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    }
    return files;
  }

  async findFile(dto: FindFileDto, user: TokenPayload): Promise<FileEntity> {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(process.env.FILES_PATH, dto.groupId, dto.fileUri);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    const stats = fs.statSync(filePath);
    let md5Hash = '';
    if (stats.isFile()) {
      const fileBuffer = fs.readFileSync(filePath);
      md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    }

    return {
      name: path.basename(filePath),
      uri: dto.fileUri,
      size: stats.size,
      modificationTime: stats.mtime,
      isDirectory: stats.isDirectory(),
      type: path.extname(filePath).replace('.', '').toLocaleLowerCase(),
      md5: md5Hash,
      groupId: dto.groupId,
    };
  }

  async download(dto: DownloadFileDto, user: TokenPayload) {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(process.env.FILES_PATH, dto.groupId, dto.fileUri);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      const fileContents = fs.createReadStream(filePath);
      // const mimeType = mime.getType(filePath) || 'application/octet-stream';
      const mimeType = 'application/octet-stream';
      console.log(mimeType);
      return new StreamableFile(fileContents, { type: mimeType });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async move(dto: MoveFileDto, user: TokenPayload) {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(process.env.FILES_PATH, dto.groupId, dto.fileUri);
    let newFilePath = path.join(process.env.FILES_PATH, dto.groupId, dto.newPath, dto.name);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    if (filePath === newFilePath || fs.existsSync(newFilePath)) {
      newFilePath = `${newFilePath}_copy`;
    }

    try {
      fsa.moveSync(filePath, newFilePath); // @TODO not sure if this is the best way to rename folders
      return { message: `File ${filePath} successfully moved to ${newFilePath}` };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(dto: RemoveFileDto, user: TokenPayload) {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(process.env.FILES_PATH, dto.groupId, dto.fileUri);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      fsa.removeSync(filePath);
      return { message: `File ${filePath} successfully removed` };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async copy(dto: CopyFileDto, user: TokenPayload) {
    this.groupCheck(dto.groupId, user);
    const filePath = path.join(process.env.FILES_PATH, dto.groupId, dto.fileUri);
    let newFilePath = path.join(process.env.FILES_PATH, dto.groupId, dto.newPath, dto.name);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    if (filePath === newFilePath || fs.existsSync(newFilePath)) {
      newFilePath = `${newFilePath}_copy`;
    }

    try {
      fsa.copySync(filePath, newFilePath);
      return { message: `File ${filePath} successfully copied to ${newFilePath}` };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
