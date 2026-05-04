import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AlbumService } from '@/services/album.service';
import { PhotoService } from '@/services/photo.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import {
  type FindGalleryImagesRequest,
  type GalleryImageResponse,
  type GalleryImagePageResponse,
  type GalleryScanResponse,
  type GalleryStatsResponse,
  type GalleryViewMode,
  type Prisma,
  type TokenPayload,
} from '@repo/shared';

const DEFAULT_GALLERY_PAGE_SIZE = 50;
const MAX_GALLERY_PAGE_SIZE = 200;

const compareGalleryItems = (
  left: Pick<GalleryImageResponse, 'id' | 'capturedAt' | 'createdAt'>,
  right: Pick<GalleryImageResponse, 'id' | 'capturedAt' | 'createdAt'>
) => {
  const dateDifference = +(right.capturedAt ?? right.createdAt) - +(left.capturedAt ?? left.createdAt);

  if (dateDifference !== 0) {
    return dateDifference;
  }

  return right.id.localeCompare(left.id);
};

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly photoService: PhotoService,
    private readonly albumService: AlbumService
  ) {}

  private resolvePageSize(take?: number) {
    return Math.min(Math.max(take ?? DEFAULT_GALLERY_PAGE_SIZE, 1), MAX_GALLERY_PAGE_SIZE);
  }

  private resolveGalleryViewMode(query: FindGalleryImagesRequest): GalleryViewMode {
    if (query.viewMode) {
      return query.viewMode;
    }

    if (query.condensed) {
      return 'photos-and-albums';
    }

    return 'photos-only';
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
    const albumPhotosToRefresh = new Set<string>();

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

            if (updateData.capturedAt) {
              albumPhotosToRefresh.add(existingPhoto.id);
            }
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

    await this.albumService.refreshCapturedAtForPhotos(Array.from(albumPhotosToRefresh));

    return {
      scannedImages: imageFiles.length,
      addedImages,
    };
  }

  async findAll(query: FindGalleryImagesRequest, user: TokenPayload): Promise<GalleryImagePageResponse> {
    const skip = Math.max(query.skip ?? 0, 0);
    const take = this.resolvePageSize(query.take);
    const fetchLimit = skip + take + 1;
    const viewMode = this.resolveGalleryViewMode(query);

    if (skip === 0) {
      await this.photoService.repairCapturedAtFromMetadata(user.sub);
    }

    if (query.parentAlbumId) {
      await this.albumService.findOne(query.parentAlbumId, user);
    }

    const descendantAlbumIds = query.parentAlbumId
      ? await this.albumService.findDescendantIds(query.parentAlbumId, user.sub)
      : [];
    const currentAlbumTreeIds = query.parentAlbumId ? [query.parentAlbumId, ...descendantAlbumIds] : [];

    const shouldFetchAlbums = viewMode === 'photos-and-albums' || viewMode === 'albums-only';
    const shouldFetchPhotos = viewMode !== 'albums-only';

    let photoWhere: Prisma.PhotoWhereInput | undefined;

    switch (viewMode) {
      case 'photos-only':
        photoWhere = query.parentAlbumId
          ? {
              ownerId: user.sub,
              albums: {
                some: {
                  id: { in: currentAlbumTreeIds },
                },
              },
            }
          : { ownerId: user.sub };
        break;
      case 'photos-and-albums':
        photoWhere = query.parentAlbumId
          ? {
              ownerId: user.sub,
              AND: [
                { albums: { some: { id: query.parentAlbumId } } },
                ...(descendantAlbumIds.length > 0 ? [{ albums: { none: { id: { in: descendantAlbumIds } } } }] : []),
              ],
            }
          : {
              ownerId: user.sub,
              albums: { none: {} },
            };
        break;
      case 'albums-only':
        photoWhere = undefined;
        break;
      case 'photos-not-in-albums-only':
        photoWhere = query.parentAlbumId
          ? {
              ownerId: user.sub,
              id: { in: [] },
            }
          : {
              ownerId: user.sub,
              albums: { none: {} },
            };
        break;
    }

    const [photos, albums] = await Promise.all([
      shouldFetchPhotos && photoWhere
        ? this.prisma.photo.findMany({
            where: photoWhere,
            orderBy: [{ capturedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
            take: fetchLimit,
            select: { id: true, createdAt: true, capturedAt: true, metadata: true },
          })
        : Promise.resolve([]),
      shouldFetchAlbums
        ? this.albumService.findGalleryAlbums({
            ownerId: user.sub,
            parentId: query.parentAlbumId ?? null,
            take: fetchLimit,
          })
        : Promise.resolve([]),
    ]);

    await this.photoService.repairCapturedAtForPhotos(photos);

    const photoItems = photos.map((photo) =>
      this.photoService.toGalleryImageResponse({
        id: photo.id,
        createdAt: photo.createdAt,
        capturedAt: this.photoService.resolveCapturedAt(photo),
      })
    );

    const albumItems = albums.map((album) => this.albumService.toGalleryItemResponse(album));
    const pagedItems = photoItems
      .concat(albumItems)
      .sort(compareGalleryItems)
      .slice(skip, skip + take + 1);
    const hasMore = pagedItems.length > take;
    const items = pagedItems.slice(0, take);

    return {
      items,
      hasMore,
      nextSkip: hasMore ? skip + items.length : undefined,
    };
  }
}
