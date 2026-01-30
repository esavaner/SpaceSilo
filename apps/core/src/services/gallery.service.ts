import { ConflictException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { CreatePhotoDto } from '@/_dto/photo.dto.js';
// import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { PrismaService } from '@/common/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TokenPayload } from '@/common/types.js';
import sharp from 'sharp';

const THUMBNAIL_HEIGHT = 200;

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPhotoDto: CreatePhotoDto, file: Express.Multer.File, user: TokenPayload) {
    console.log(file);
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const existingPhoto = await this.prisma.photo.findFirst({
      where: { hash },
      select: { id: true },
    });
    if (existingPhoto) {
      return new ConflictException('Photo already exists');
    }
    const photoPath = path.join(process.env.STORAGE_PATH, file.originalname);
    fs.writeFileSync(photoPath, file.buffer);

    const thumbnailPath = path.join(process.env.APPDATA_PATH, 'thumbnails', `${file.originalname}`);
    const sharpFile = await sharp(file.buffer);
    const metadata = await sharpFile.metadata();
    const aspectRatio = metadata.width / metadata.height;
    await sharpFile.resize(Math.floor(aspectRatio * THUMBNAIL_HEIGHT), THUMBNAIL_HEIGHT).toFile(thumbnailPath);

    const photo = await this.prisma.photo.create({
      data: {
        url: '',
        thumbnailPath,
        path: photoPath,
        // metadata: {}, // Add any metadata if needed
        ownerId: user.sub,
        hash,
      },
    });

    return photo;
  }

  async findAll() {
    return await this.prisma.photo.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.photo.findUnique({
      where: { id },
    });
  }

  // update(id: number, updatePhotoDto: UpdatePhotoDto) {
  //   return `This action updates a #${id} photo`;
  // }

  async remove(id: string) {
    return await this.prisma.photo.delete({
      where: { id },
    });
  }

  async findThumbnail(id: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
    });
    if (!photo || !photo.thumbnailPath || !fs.existsSync(photo.thumbnailPath)) {
      return new NotFoundException('Thumbnail not found');
    }
    const file = fs.createReadStream(photo.thumbnailPath);
    return new StreamableFile(file, { type: 'image/jpeg' });
  }
}
