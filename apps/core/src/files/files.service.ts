import { Injectable, InternalServerErrorException, NotFoundException, StreamableFile } from '@nestjs/common';
import { CreateFileDto, FindAllFilesDto, DownloadFileDto, RemoveFileDto, UpdateFileDto } from '../_dto/files.dto';
import { TokenPayload } from 'src/auth/auth.types';
import * as fs from 'fs';
import * as path from 'path';
import { FilesEntity } from 'src/_entity/files.entity';
import * as crypto from 'crypto';

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

  findAll(dto: FindAllFilesDto): FilesEntity[] | NotFoundException | InternalServerErrorException {
    const fileDir = path.join(process.env.FILES_PATH, dto?.path || '');
    if (!fs.existsSync(fileDir)) {
      return new NotFoundException('Path not found');
    }

    try {
      const files = fs.readdirSync(fileDir);
      return files.map((file) => {
        const filePath = path.join(fileDir, file);
        const stats = fs.statSync(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        return {
          name: file,
          uri: filePath,
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
