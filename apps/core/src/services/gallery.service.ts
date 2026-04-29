import { BadRequestException, ConflictException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
// import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { PrismaService } from '@/common/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  type GalleryImageResponse,
  type GalleryScanResponse,
  type GalleryStatsResponse,
  type Prisma,
  type TokenPayload,
} from '@repo/shared';
import exifr from 'exifr';
import sharp from 'sharp';

const THUMBNAIL_HEIGHT = 200;
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff', '.avif']);

type StoredPhotoMetadata = Prisma.InputJsonObject & {
  capturedAt?: string | null;
};

type UploadedImageFile = {
  buffer?: Buffer;
  originalname: string;
};

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  private asStoredPhotoMetadata(metadata: unknown): StoredPhotoMetadata | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    return { ...(metadata as Prisma.InputJsonObject) };
  }

  private normalizeCapturedAt(value: unknown): string | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return null;
  }

  private getCapturedAtFromMetadata(metadata: unknown): Date | null {
    const storedMetadata = this.asStoredPhotoMetadata(metadata);
    const capturedAt = this.normalizeCapturedAt(storedMetadata?.capturedAt);
    return capturedAt ? new Date(capturedAt) : null;
  }

  private mergePhotoMetadata(metadata: unknown, capturedAt: string | null): StoredPhotoMetadata | undefined {
    const storedMetadata = this.asStoredPhotoMetadata(metadata) ?? {};

    if (!capturedAt) {
      return Object.keys(storedMetadata).length > 0 ? storedMetadata : undefined;
    }

    return {
      ...storedMetadata,
      capturedAt,
    };
  }

  private async extractCapturedAt(fileBuffer: Buffer): Promise<string | null> {
    try {
      const metadata = await exifr.parse(fileBuffer, ['DateTimeOriginal', 'CreateDate', 'ModifyDate']);
      return this.normalizeCapturedAt(metadata?.DateTimeOriginal ?? metadata?.CreateDate ?? metadata?.ModifyDate);
    } catch {
      return null;
    }
  }

  private async ensureCapturedAt(photo: { id: string; path: string; metadata?: unknown }, fileBuffer?: Buffer) {
    const existingCapturedAt = this.getCapturedAtFromMetadata(photo.metadata);
    if (existingCapturedAt) {
      return existingCapturedAt;
    }

    const sourceBuffer = fileBuffer ?? (fs.existsSync(photo.path) ? fs.readFileSync(photo.path) : null);
    if (!sourceBuffer) {
      return null;
    }

    const capturedAt = await this.extractCapturedAt(sourceBuffer);
    if (!capturedAt) {
      return null;
    }

    await this.prisma.photo.update({
      where: { id: photo.id },
      data: {
        metadata: this.mergePhotoMetadata(photo.metadata, capturedAt),
      },
    });

    return new Date(capturedAt);
  }

  private toGalleryImageResponse(
    photo: { id: string; createdAt: Date },
    capturedAt: Date | null
  ): GalleryImageResponse {
    return {
      id: photo.id,
      imagePath: `/gallery/${photo.id}/file`,
      thumbnailPath: `/gallery/${photo.id}/thumbnail`,
      capturedAt,
      createdAt: photo.createdAt,
    };
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private getStoragePaths() {
    return {
      storagePath: process.env.STORAGE_PATH!,
      thumbnailsPath: path.join(process.env.APPDATA_PATH!, 'thumbnails'),
    };
  }

  private ensureStoragePaths() {
    const paths = this.getStoragePaths();
    this.ensureDirectoryExists(paths.storagePath);
    this.ensureDirectoryExists(paths.thumbnailsPath);
    return paths;
  }

  private listFilesRecursive(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(dirPath, entry.name);
      return entry.isDirectory() ? this.listFilesRecursive(entryPath) : [entryPath];
    });
  }

  private isSupportedImage(filePath: string) {
    return SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
  }

  private getThumbnailOutputPath(imagePath: string) {
    const { storagePath, thumbnailsPath } = this.ensureStoragePaths();
    const relativePath = path.relative(storagePath, imagePath);
    const parsed = path.parse(relativePath);
    return path.join(thumbnailsPath, parsed.dir, `${parsed.name}.jpg`);
  }

  private async createThumbnail(fileBuffer: Buffer, targetPath: string) {
    this.ensureDirectoryExists(path.dirname(targetPath));

    const sharpFile = sharp(fileBuffer);
    const metadata = await sharpFile.metadata();
    const width = metadata.width ?? THUMBNAIL_HEIGHT;
    const height = metadata.height ?? THUMBNAIL_HEIGHT;
    const aspectRatio = height === 0 ? 1 : width / height;

    await sharpFile
      .resize(Math.max(1, Math.floor(aspectRatio * THUMBNAIL_HEIGHT)), THUMBNAIL_HEIGHT)
      .jpeg({ quality: 82 })
      .toFile(targetPath);
  }

  private getMimeType(filePath: string) {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.bmp':
        return 'image/bmp';
      case '.tif':
      case '.tiff':
        return 'image/tiff';
      case '.avif':
        return 'image/avif';
      default:
        return 'application/octet-stream';
    }
  }

  private async findOwnedPhoto(id: string, user: TokenPayload) {
    return this.prisma.photo.findFirst({
      where: { id, ownerId: user.sub },
    });
  }

  async create(file: UploadedImageFile, user: TokenPayload) {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }

    const { storagePath } = this.ensureStoragePaths();
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const existingPhoto = await this.prisma.photo.findFirst({
      where: { hash },
      select: { id: true },
    });
    if (existingPhoto) {
      throw new ConflictException('Photo already exists');
    }
    const photoPath = path.join(storagePath, file.originalname);
    this.ensureDirectoryExists(path.dirname(photoPath));
    fs.writeFileSync(photoPath, file.buffer);

    const thumbnailPath = this.getThumbnailOutputPath(photoPath);
    await this.createThumbnail(file.buffer, thumbnailPath);
    const capturedAt = await this.extractCapturedAt(file.buffer);

    const photo = await this.prisma.photo.create({
      data: {
        url: '',
        thumbnailPath,
        path: photoPath,
        metadata: this.mergePhotoMetadata(null, capturedAt),
        ownerId: user.sub,
        hash,
      },
    });

    return photo;
  }

  async getStats(user: TokenPayload): Promise<GalleryStatsResponse> {
    const { storagePath } = this.ensureStoragePaths();
    const allFiles = this.listFilesRecursive(storagePath);
    const totalImages = allFiles.filter((filePath) => this.isSupportedImage(filePath)).length;
    const storageSize = allFiles.reduce((total, filePath) => total + fs.statSync(filePath).size, 0);
    const indexedImages = await this.prisma.photo.count({
      where: { ownerId: user.sub },
    });

    return {
      totalFiles: allFiles.length,
      totalImages,
      indexedImages,
      storageSize,
    };
  }

  async scan(user: TokenPayload): Promise<GalleryScanResponse> {
    const { storagePath } = this.ensureStoragePaths();
    const imageFiles = this.listFilesRecursive(storagePath).filter((filePath) => this.isSupportedImage(filePath));

    let addedImages = 0;

    for (const filePath of imageFiles) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const capturedAt = await this.extractCapturedAt(fileBuffer);
        const existingPhoto = await this.prisma.photo.findFirst({
          where: { hash },
          select: { id: true, metadata: true },
        });

        if (existingPhoto) {
          if (!this.getCapturedAtFromMetadata(existingPhoto.metadata) && capturedAt) {
            await this.prisma.photo.update({
              where: { id: existingPhoto.id },
              data: {
                metadata: this.mergePhotoMetadata(existingPhoto.metadata, capturedAt),
              },
            });
          }
          continue;
        }

        const thumbnailPath = this.getThumbnailOutputPath(filePath);
        await this.createThumbnail(fileBuffer, thumbnailPath);

        await this.prisma.photo.create({
          data: {
            url: '',
            thumbnailPath,
            path: filePath,
            metadata: this.mergePhotoMetadata(null, capturedAt),
            ownerId: user.sub,
            hash,
          },
        });

        addedImages += 1;
      } catch {
        continue;
      }
    }

    return {
      scannedImages: imageFiles.length,
      addedImages,
    };
  }

  async findAll(user: TokenPayload): Promise<GalleryImageResponse[]> {
    const photos = await this.prisma.photo.findMany({
      where: { ownerId: user.sub },
      select: { id: true, path: true, metadata: true, createdAt: true },
    });

    const resolvedPhotos = await Promise.all(
      photos.map(async (photo) => ({
        photo,
        capturedAt: await this.ensureCapturedAt(photo),
      }))
    );

    resolvedPhotos.sort((a, b) => {
      const left = +(a.capturedAt ?? a.photo.createdAt);
      const right = +(b.capturedAt ?? b.photo.createdAt);
      return right - left;
    });

    return resolvedPhotos.map(({ photo, capturedAt }) => this.toGalleryImageResponse(photo, capturedAt));
  }

  async findOne(id: string, user: TokenPayload): Promise<GalleryImageResponse> {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const capturedAt = await this.ensureCapturedAt(photo);

    return this.toGalleryImageResponse(photo, capturedAt);
  }

  // update(id: number, updatePhotoDto: UpdatePhotoDto) {
  //   return `This action updates a #${id} photo`;
  // }

  async remove(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return await this.prisma.photo.delete({
      where: { id: photo.id },
    });
  }

  async findImage(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo || !photo.path || !fs.existsSync(photo.path)) {
      throw new NotFoundException('Photo not found');
    }
    const file = fs.createReadStream(photo.path);
    return new StreamableFile(file, { type: this.getMimeType(photo.path) });
  }

  async findThumbnail(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo || !photo.thumbnailPath || !fs.existsSync(photo.thumbnailPath)) {
      throw new NotFoundException('Thumbnail not found');
    }
    const file = fs.createReadStream(photo.thumbnailPath);
    return new StreamableFile(file, { type: this.getMimeType(photo.thumbnailPath) });
  }
}
