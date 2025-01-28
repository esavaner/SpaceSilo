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
} from 'src/_dto/files.dto';
import * as fs from 'fs';
import * as fsa from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { TokenPayload } from 'src/common/types';
import { GroupsService } from './groups.service';

@Injectable()
export class FilesService {
  constructor(private readonly groupService: GroupsService) {}

  async createFile(dto: CreateFileDto, file: Express.Multer.File, user: TokenPayload) {
    const fileDir = path.join(process.env.FILES_PATH, dto.newPath, dto.name);
    const filePath = path.join(fileDir, file.originalname);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.buffer);
    return { message: 'File created successfully', filePath };
  }

  async createFolder(dto: CreateFolderDto, user: TokenPayload) {
    const folderDir = path.join(process.env.FILES_PATH, dto.newPath, dto.name);
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, { recursive: true });
    }
    return { message: 'Folder created successfully', folderDir };
  }

  findAll(dto: FindAllFilesDto, user: TokenPayload): FileEntity[] {
    console.log(dto);
    if (!dto.groupIds) {
      throw new NotFoundException('Group not found');
    }
    let files: FileEntity[] = [];
    const ids = Array.isArray(dto.groupIds) ? dto.groupIds : [dto.groupIds];
    for (const groupId of ids) {
      const groupMember = this.groupService.findGroupMember(groupId, user);
      if (!groupMember) {
        throw new NotFoundException('Group not found');
      }
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

  download(dto: DownloadFileDto) {
    const filePath = path.join(process.env.FILES_PATH, dto.fileUri);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      const fileContents = fs.createReadStream(filePath);
      return new StreamableFile(fileContents, { type: 'image/jpeg' });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  move(dto: MoveFileDto) {
    const filePath = path.join(process.env.FILES_PATH, dto.fileUri);
    let newFilePath = path.join(process.env.FILES_PATH, dto.newPath, dto.name);

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

  remove(dto: RemoveFileDto) {
    const filePath = path.join(process.env.FILES_PATH, dto.fileUri);

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

  copy(dto: CopyFileDto) {
    const filePath = path.join(process.env.FILES_PATH, dto.fileUri);
    let newFilePath = path.join(process.env.FILES_PATH, dto.newPath, dto.name);

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
