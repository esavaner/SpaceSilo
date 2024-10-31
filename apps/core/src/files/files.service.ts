import { Injectable, InternalServerErrorException, NotFoundException, StreamableFile } from '@nestjs/common';
import { CreateFileDto, FindAllFilesDto, DownloadFileDto, RemoveFileDto, UpdateFileDto } from './_dto/files.dto';
import { TokenPayload } from 'src/auth/auth.types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  async create(dto: CreateFileDto, file: Express.Multer.File, user: TokenPayload) {
    const fileDir = path.join(process.env.FILES_PATH, dto.path);
    const filePath = path.join(fileDir, file.originalname);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.buffer);
    return { message: 'File created successfully', filePath };
  }

  findAll(dto: FindAllFilesDto) {
    const fileDir = path.join(process.env.FILES_PATH, dto?.path || '');
    if (!fs.existsSync(fileDir)) {
      return new NotFoundException('Path not found');
    }

    try {
      const files = fs.readdirSync(fileDir);
      return files.map((file) => {
        const filePath = path.join(fileDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime,
          type: stats.isDirectory() ? 'directory' : 'file',
        };
      });
    } catch (error) {
      return new InternalServerErrorException(error);
    }
  }

  download(dto: DownloadFileDto) {
    const filePath = path.join(process.env.FILES_PATH, dto?.path);

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

  update(dto: UpdateFileDto) {
    const filePath = path.join(process.env.FILES_PATH, dto.path);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      const newFilePath = path.join(process.env.FILES_PATH, dto.newPath);
      fs.renameSync(filePath, newFilePath);
      return { message: `File ${filePath} successfully moved to ${newFilePath}` };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  remove(dto: RemoveFileDto) {
    const filePath = path.join(process.env.FILES_PATH, dto.path);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      fs.unlinkSync(filePath);
      return { message: `File ${filePath} successfully removed` };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
