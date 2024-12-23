import { Injectable, InternalServerErrorException, NotFoundException, StreamableFile } from '@nestjs/common';
import {
  CreateFileDto,
  FindAllFilesDto,
  DownloadFileDto,
  RemoveFileDto,
  MoveFileDto,
  CreateFolderDto,
  CopyFileDto,
} from '../_dto/files.dto';
import { TokenPayload } from 'src/auth/auth.types';
import * as fs from 'fs';
import * as fsa from 'fs-extra';
import * as path from 'path';
import { FileEntity } from 'src/_entity/files.entity';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
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

  findAll(dto: FindAllFilesDto): FileEntity[] | NotFoundException | InternalServerErrorException {
    const fileDir = path.join(process.env.FILES_PATH, dto.path || '');
    if (!fs.existsSync(fileDir)) {
      return new NotFoundException('Path not found');
    }

    try {
      const files = fs.readdirSync(fileDir);
      return files.map((file) => {
        const filePath = path.join(fileDir, file);
        const stats = fs.statSync(filePath);
        let md5Hash = '';
        if (stats.isFile()) {
          const fileBuffer = fs.readFileSync(filePath);
          md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        }
        return {
          name: file,
          uri: path.join('/', dto.path || '', file),
          size: stats.size,
          modificationTime: stats.mtime,
          isDirectory: stats.isDirectory(),
          md5: md5Hash,
        };
      });
    } catch (error) {
      return new InternalServerErrorException(error);
    }
  }

  download(dto: DownloadFileDto) {
    const filePath = path.join(process.env.FILES_PATH, dto.fileUri);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      const fileContents = fs.createReadStream(filePath);
      return new StreamableFile(fileContents);
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
