import { BadRequestException, ConflictException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { type GalleryImageResponse, type Prisma, type TokenPayload } from '@repo/shared';
import exifr from 'exifr';
import sharp from 'sharp';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const THUMBNAIL_HEIGHT = 200;
const THUMBNAIL_JPEG_QUALITY = 82;
const PREVIEW_MAX_WIDTH = 1920;
const PREVIEW_MAX_HEIGHT = 1080;
const PREVIEW_JPEG_QUALITY = 90;
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff', '.avif']);

type StoredPhotoMetadata = Prisma.InputJsonObject & {
  capturedAt?: string | null;
};

type UploadedImageFile = {
  buffer?: Buffer;
  originalname: string;
};

@Injectable()
export class PhotoService {
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

  getCapturedAtFromMetadata(metadata: unknown): Date | null {
    const storedMetadata = this.asStoredPhotoMetadata(metadata);
    const capturedAt = this.normalizeCapturedAt(storedMetadata?.capturedAt);
    return capturedAt ? new Date(capturedAt) : null;
  }

  mergePhotoMetadata(metadata: unknown, capturedAt: string | null): StoredPhotoMetadata | undefined {
    const storedMetadata = this.asStoredPhotoMetadata(metadata) ?? {};

    if (!capturedAt) {
      return Object.keys(storedMetadata).length > 0 ? storedMetadata : undefined;
    }

    return {
      ...storedMetadata,
      capturedAt,
    };
  }

  async extractCapturedAt(fileBuffer: Buffer): Promise<string | null> {
    try {
      const metadata = await exifr.parse(fileBuffer, ['DateTimeOriginal', 'CreateDate', 'ModifyDate']);
      return this.normalizeCapturedAt(metadata?.DateTimeOriginal ?? metadata?.CreateDate ?? metadata?.ModifyDate);
    } catch {
      return null;
    }
  }

  private async ensureCapturedAt(
    photo: { id: string; path: string; createdAt: Date; capturedAt?: Date | null; metadata?: unknown },
    fileBuffer?: Buffer
  ) {
    const metadataCapturedAt = this.getCapturedAtFromMetadata(photo.metadata);
    if (metadataCapturedAt) {
      if (!photo.capturedAt || metadataCapturedAt.getTime() !== photo.capturedAt.getTime()) {
        await this.prisma.photo.update({
          where: { id: photo.id },
          data: {
            capturedAt: metadataCapturedAt,
            metadata: this.mergePhotoMetadata(photo.metadata, metadataCapturedAt.toISOString()),
          },
        });
      }

      return metadataCapturedAt;
    }

    if (photo.capturedAt) {
      return photo.capturedAt;
    }

    const sourceBuffer = fileBuffer ?? (fs.existsSync(photo.path) ? fs.readFileSync(photo.path) : null);
    if (!sourceBuffer) {
      return photo.createdAt;
    }

    const capturedAt = await this.extractCapturedAt(sourceBuffer);
    const resolvedCapturedAt = capturedAt ? new Date(capturedAt) : photo.createdAt;

    await this.prisma.photo.update({
      where: { id: photo.id },
      data: {
        capturedAt: resolvedCapturedAt,
        metadata: this.mergePhotoMetadata(photo.metadata, capturedAt),
      },
    });

    return resolvedCapturedAt;
  }

  resolveCapturedAt(photo: { createdAt: Date; capturedAt?: Date | null; metadata?: unknown }) {
    return this.getCapturedAtFromMetadata(photo.metadata) ?? photo.capturedAt ?? photo.createdAt;
  }

  async repairCapturedAtFromMetadata(ownerId: string) {
    await this.prisma.$executeRaw`
      UPDATE "Photo"
      SET "capturedAt" = NULLIF("metadata"->>'capturedAt', '')::timestamptz
      WHERE "ownerId" = ${ownerId}
        AND NULLIF("metadata"->>'capturedAt', '') IS NOT NULL
        AND "capturedAt" IS DISTINCT FROM NULLIF("metadata"->>'capturedAt', '')::timestamptz
    `;
  }

  async repairCapturedAtForPhotos(
    photos: Array<{ id: string; createdAt: Date; capturedAt?: Date | null; metadata?: unknown }>
  ) {
    const stalePhotos = photos
      .map((photo) => ({
        id: photo.id,
        resolvedCapturedAt: this.resolveCapturedAt(photo),
        capturedAt: photo.capturedAt,
      }))
      .filter((photo) => !photo.capturedAt || photo.capturedAt.getTime() !== photo.resolvedCapturedAt.getTime());

    if (!stalePhotos.length) {
      return;
    }

    await Promise.all(
      stalePhotos.map((photo) =>
        this.prisma.photo.update({
          where: { id: photo.id },
          data: { capturedAt: photo.resolvedCapturedAt },
        })
      )
    );
  }

  toGalleryImageResponse(photo: { id: string; createdAt: Date; capturedAt: Date }): GalleryImageResponse {
    return {
      id: photo.id,
      imagePath: `/gallery/photo/${photo.id}/file`,
      previewPath: `/gallery/photo/${photo.id}/preview`,
      thumbnailPath: `/gallery/photo/${photo.id}/thumbnail`,
      capturedAt: photo.capturedAt,
      createdAt: photo.createdAt,
    };
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  getStoragePaths() {
    return {
      storagePath: process.env.STORAGE_PATH!,
      thumbnailsPath: path.join(process.env.APPDATA_PATH!, 'thumbnails'),
      previewsPath: path.join(process.env.APPDATA_PATH!, 'previews'),
    };
  }

  private ensureStoragePaths() {
    const paths = this.getStoragePaths();
    this.ensureDirectoryExists(paths.storagePath);
    this.ensureDirectoryExists(paths.thumbnailsPath);
    this.ensureDirectoryExists(paths.previewsPath);
    return paths;
  }

  listFilesRecursive(dirPath: string): string[] {
    if (!fs.existsSync(dirPath)) {
      return [];
    }

    return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(dirPath, entry.name);
      return entry.isDirectory() ? this.listFilesRecursive(entryPath) : [entryPath];
    });
  }

  isSupportedImage(filePath: string) {
    return SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
  }

  getThumbnailOutputPath(imagePath: string) {
    const { storagePath, thumbnailsPath } = this.ensureStoragePaths();
    const relativePath = path.relative(storagePath, imagePath);
    const parsed = path.parse(relativePath);
    return path.join(thumbnailsPath, parsed.dir, `${parsed.name}.jpg`);
  }

  private getPreviewOutputPath(imagePath: string) {
    const { storagePath, previewsPath } = this.ensureStoragePaths();
    const relativePath = path.relative(storagePath, imagePath);
    const parsed = path.parse(relativePath);
    return path.join(previewsPath, parsed.dir, `${parsed.name}.jpg`);
  }

  private getNormalizedDimensions(metadata: sharp.Metadata) {
    const isRotated = metadata.orientation !== undefined && [5, 6, 7, 8].includes(metadata.orientation);
    const width = isRotated ? metadata.height : metadata.width;
    const height = isRotated ? metadata.width : metadata.height;

    return {
      width: width ?? 0,
      height: height ?? 0,
    };
  }

  private shouldCreatePreview(metadata: sharp.Metadata) {
    const { width, height } = this.getNormalizedDimensions(metadata);
    if (!width || !height) {
      return true;
    }

    return width > PREVIEW_MAX_WIDTH || height > PREVIEW_MAX_HEIGHT;
  }

  async createThumbnail(fileBuffer: Buffer, targetPath: string) {
    this.ensureDirectoryExists(path.dirname(targetPath));

    await sharp(fileBuffer)
      .rotate()
      .resize({ height: THUMBNAIL_HEIGHT })
      .jpeg({ quality: THUMBNAIL_JPEG_QUALITY })
      .toFile(targetPath);
  }

  private async createPreview(fileBuffer: Buffer, targetPath: string) {
    const sharpFile = sharp(fileBuffer).rotate();
    const metadata = await sharpFile.metadata();

    if (!this.shouldCreatePreview(metadata)) {
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { force: true });
      }
      return false;
    }

    this.ensureDirectoryExists(path.dirname(targetPath));
    await sharpFile
      .resize({
        width: PREVIEW_MAX_WIDTH,
        height: PREVIEW_MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: PREVIEW_JPEG_QUALITY, progressive: true })
      .toFile(targetPath);

    return true;
  }

  async ensurePreviewAsset(imagePath: string, fileBuffer?: Buffer) {
    const previewPath = this.getPreviewOutputPath(imagePath);
    if (fs.existsSync(previewPath)) {
      return previewPath;
    }

    const sourceBuffer = fileBuffer ?? (fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null);
    if (!sourceBuffer) {
      return null;
    }

    const generated = await this.createPreview(sourceBuffer, previewPath);
    return generated ? previewPath : null;
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

  private createStreamableFile(filePath: string) {
    const file = fs.createReadStream(filePath);
    return new StreamableFile(file, { type: this.getMimeType(filePath) });
  }

  async create(file: UploadedImageFile, user: TokenPayload) {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }

    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const existingPhoto = await this.prisma.photo.findFirst({
      where: { hash },
      select: { id: true },
    });
    if (existingPhoto) {
      throw new ConflictException('Photo already exists');
    }
    const { storagePath } = this.ensureStoragePaths();
    const photoPath = path.join(storagePath, file.originalname);
    this.ensureDirectoryExists(path.dirname(photoPath));
    fs.writeFileSync(photoPath, file.buffer);

    const thumbnailPath = this.getThumbnailOutputPath(photoPath);
    await this.createThumbnail(file.buffer, thumbnailPath);
    await this.ensurePreviewAsset(photoPath, file.buffer);
    const capturedAt = await this.extractCapturedAt(file.buffer);
    const createdAt = new Date();
    const resolvedCapturedAt = capturedAt ? new Date(capturedAt) : createdAt;

    const photo = await this.prisma.photo.create({
      data: {
        url: '',
        thumbnailPath,
        path: photoPath,
        capturedAt: resolvedCapturedAt,
        createdAt,
        metadata: this.mergePhotoMetadata(null, capturedAt),
        ownerId: user.sub,
        hash,
      },
    });

    return this.toGalleryImageResponse({
      id: photo.id,
      createdAt: photo.createdAt,
      capturedAt: resolvedCapturedAt,
    });
  }

  async findOne(id: string, user: TokenPayload): Promise<GalleryImageResponse> {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const capturedAt = await this.ensureCapturedAt(photo);

    return this.toGalleryImageResponse({
      id: photo.id,
      createdAt: photo.createdAt,
      capturedAt,
    });
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

    return this.createStreamableFile(photo.path);
  }

  async findPreview(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo || !photo.path || !fs.existsSync(photo.path)) {
      throw new NotFoundException('Photo not found');
    }

    const previewPath = await this.ensurePreviewAsset(photo.path);
    return this.createStreamableFile(previewPath ?? photo.path);
  }

  async findThumbnail(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo || !photo.thumbnailPath || !fs.existsSync(photo.thumbnailPath)) {
      throw new NotFoundException('Thumbnail not found');
    }

    return this.createStreamableFile(photo.thumbnailPath);
  }
}
