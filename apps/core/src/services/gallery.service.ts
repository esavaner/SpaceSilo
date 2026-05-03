import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { PhotoService } from '@/services/photo.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import {
  type FindGalleryImagesRequest,
  type GalleryImagePageResponse,
  type GalleryScanResponse,
  type GalleryStatsResponse,
  type Prisma,
  type TokenPayload,
} from '@repo/shared';
const DEFAULT_GALLERY_PAGE_SIZE = 50;
const MAX_GALLERY_PAGE_SIZE = 200;

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly photoService: PhotoService
  ) {}

  private resolvePageSize(take?: number) {
    return Math.min(Math.max(take ?? DEFAULT_GALLERY_PAGE_SIZE, 1), MAX_GALLERY_PAGE_SIZE);
  }

  async getStats(user: TokenPayload): Promise<GalleryStatsResponse> {
    const { storagePath } = this.photoService.getStoragePaths();
    const allFiles = this.photoService.listFilesRecursive(storagePath);
    const totalImages = allFiles.filter((filePath) => this.photoService.isSupportedImage(filePath)).length;
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
    const { storagePath } = this.photoService.getStoragePaths();
    const imageFiles = this.photoService
      .listFilesRecursive(storagePath)
      .filter((filePath) => this.photoService.isSupportedImage(filePath));

    let addedImages = 0;

    for (const filePath of imageFiles) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const capturedAt = await this.photoService.extractCapturedAt(fileBuffer);
        const existingPhoto = await this.prisma.photo.findFirst({
          where: { hash },
          select: { id: true, metadata: true, thumbnailPath: true, createdAt: true, capturedAt: true },
        });

        const thumbnailPath = this.photoService.getThumbnailOutputPath(filePath);
        await this.photoService.ensurePreviewAsset(filePath, fileBuffer);

        if (existingPhoto) {
          const updateData: Prisma.PhotoUpdateInput = {};
          const resolvedCapturedAt = capturedAt
            ? new Date(capturedAt)
            : this.photoService.resolveCapturedAt(existingPhoto);

          if (capturedAt && !this.photoService.getCapturedAtFromMetadata(existingPhoto.metadata)) {
            updateData.metadata = this.photoService.mergePhotoMetadata(existingPhoto.metadata, capturedAt);
          }

          if (!existingPhoto.capturedAt || existingPhoto.capturedAt.getTime() !== resolvedCapturedAt.getTime()) {
            updateData.capturedAt = resolvedCapturedAt;
          }

          if (
            !existingPhoto.thumbnailPath ||
            existingPhoto.thumbnailPath !== thumbnailPath ||
            !fs.existsSync(existingPhoto.thumbnailPath)
          ) {
            await this.photoService.createThumbnail(fileBuffer, thumbnailPath);
            updateData.thumbnailPath = thumbnailPath;
          }

          if (Object.keys(updateData).length > 0) {
            await this.prisma.photo.update({
              where: { id: existingPhoto.id },
              data: updateData,
            });
          }
          continue;
        }

        await this.photoService.createThumbnail(fileBuffer, thumbnailPath);
        const createdAt = new Date();

        await this.prisma.photo.create({
          data: {
            url: '',
            thumbnailPath,
            path: filePath,
            capturedAt: capturedAt ? new Date(capturedAt) : createdAt,
            createdAt,
            metadata: this.photoService.mergePhotoMetadata(null, capturedAt),
            ownerId: user.sub,
            hash,
          },
        });

        addedImages += 1;
      } catch (error) {
        console.log(error);
        continue;
      }
    }

    return {
      scannedImages: imageFiles.length,
      addedImages,
    };
  }

  async findAll(query: FindGalleryImagesRequest, user: TokenPayload): Promise<GalleryImagePageResponse> {
    const skip = Math.max(query.skip ?? 0, 0);
    const take = this.resolvePageSize(query.take);

    if (skip === 0) {
      await this.photoService.repairCapturedAtFromMetadata(user.sub);
    }

    const photos = await this.prisma.photo.findMany({
      where: { ownerId: user.sub },
      orderBy: [{ capturedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take: take + 1,
      select: { id: true, createdAt: true, capturedAt: true, metadata: true },
    });

    const hasMore = photos.length > take;
    const pagedPhotos = photos.slice(0, take);
    await this.photoService.repairCapturedAtForPhotos(pagedPhotos);
    const items = pagedPhotos.map((photo) =>
      this.photoService.toGalleryImageResponse({
        id: photo.id,
        createdAt: photo.createdAt,
        capturedAt: this.photoService.resolveCapturedAt(photo),
      })
    );

    return {
      items,
      hasMore,
      nextSkip: hasMore ? skip + items.length : undefined,
    };
  }
}
