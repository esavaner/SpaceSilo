import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AlbumService } from '@/services/album.service';
import { MediaService } from '@/services/media.service';
import * as fs from 'fs';
import * as path from 'path';
import {
  type FindGalleryImagesRequest,
  type GalleryImagePageResponse,
  type GalleryScanResponse,
  type GalleryStatsResponse,
  type GalleryViewMode,
  type Prisma,
  type TokenPayload,
} from '@repo/shared';
import { resolveCapturedAt } from '@/common/captured-at';
import {
  getStemKeyForStoredFile,
  getStoragePaths,
  isIgnoredFile,
  isSupportedImage,
  listFilesRecursive,
} from '@/common/media-assets';
import { compareNewest, uniqueIds } from '@/common/utils';

const DEFAULT_GALLERY_PAGE_SIZE = 50;
const MAX_GALLERY_PAGE_SIZE = 200;
// Incoming backups are copies of other servers' data, so only their images are indexed.
const BACKUPS_DIRECTORY_NAME = 'backups';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly albumService: AlbumService
  ) {}

  private resolvePageSize(take?: number) {
    return Math.min(Math.max(take ?? DEFAULT_GALLERY_PAGE_SIZE, 1), MAX_GALLERY_PAGE_SIZE);
  }

  private resolveGalleryViewMode(query: FindGalleryImagesRequest): GalleryViewMode {
    return query.viewMode ?? (query.condensed ? 'photos-and-albums' : 'photos-only');
  }

  async getStats(user: TokenPayload): Promise<GalleryStatsResponse> {
    const allFiles = listFilesRecursive(getStoragePaths().storagePath);
    const indexedImages = await this.prisma.media.count({
      where: { ownerId: user.sub },
    });

    return {
      totalFiles: allFiles.length,
      totalImages: allFiles.filter(isSupportedImage).length,
      indexedImages,
      storageSize: allFiles.reduce((total, filePath) => total + fs.statSync(filePath).size, 0),
    };
  }

  private isIndexableFile(storagePath: string, filePath: string) {
    if (isSupportedImage(filePath)) {
      return true;
    }

    const [topLevelEntry] = path.relative(storagePath, filePath).split(path.sep);
    return topLevelEntry !== BACKUPS_DIRECTORY_NAME && !isIgnoredFile(filePath);
  }

  async scan(user: TokenPayload): Promise<GalleryScanResponse> {
    const { storagePath } = getStoragePaths();
    const files = listFilesRecursive(storagePath).filter((filePath) => this.isIndexableFile(storagePath, filePath));

    let addedFiles = 0;

    for (const filePath of files) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await this.mediaService.attachFile({
          ownerId: user.sub,
          buffer: fileBuffer,
          filePath,
          originalName: path.basename(filePath),
          stemKey: getStemKeyForStoredFile(filePath),
        });

        if (result.duplicate) {
          await this.mediaService.repairIndexedMedia(result.media, filePath, fileBuffer);
        } else {
          addedFiles += 1;
        }
      } catch (error) {
        console.log(error);
      }
    }

    return {
      scannedImages: files.length,
      addedImages: addedFiles,
    };
  }

  async resetAndScan(user: TokenPayload): Promise<GalleryScanResponse> {
    await this.prisma.$transaction([this.prisma.album.deleteMany(), this.prisma.media.deleteMany()]);
    return this.scan(user);
  }

  async findAll(query: FindGalleryImagesRequest, user: TokenPayload): Promise<GalleryImagePageResponse> {
    const skip = Math.max(query.skip ?? 0, 0);
    const take = this.resolvePageSize(query.take);
    const fetchLimit = skip + take + 1;
    const isTrashView = query.trash === true;
    const viewMode = isTrashView ? 'photos-only' : this.resolveGalleryViewMode(query);
    const excludedGroupIds = uniqueIds(query.excludedGroupIds);

    if (skip === 0) {
      await this.mediaService.repairCapturedAtFromMetadata(user.sub);
    }

    if (query.parentAlbumId && !isTrashView) {
      await this.albumService.findOne(query.parentAlbumId, user);
    }

    const descendantAlbumIds =
      query.parentAlbumId && !isTrashView
        ? await this.albumService.findDescendantIds(query.parentAlbumId, user.sub)
        : [];
    const currentAlbumTreeIds = query.parentAlbumId && !isTrashView ? [query.parentAlbumId, ...descendantAlbumIds] : [];

    const deletedFilter: Prisma.MediaWhereInput = isTrashView ? { deletedAt: { not: null } } : { deletedAt: null };
    const excludedGroupsFilter: Prisma.MediaWhereInput =
      excludedGroupIds.length > 0 ? { group: { none: { id: { in: excludedGroupIds } } } } : {};
    const shouldFetchAlbums = !isTrashView && (viewMode === 'photos-and-albums' || viewMode === 'albums-only');

    let albumScope: Prisma.MediaWhereInput | null;

    switch (viewMode) {
      case 'photos-only':
        albumScope = query.parentAlbumId ? { albums: { some: { id: { in: currentAlbumTreeIds } } } } : {};
        break;
      case 'photos-and-albums':
        albumScope = query.parentAlbumId
          ? {
              AND: [
                { albums: { some: { id: query.parentAlbumId } } },
                ...(descendantAlbumIds.length > 0 ? [{ albums: { none: { id: { in: descendantAlbumIds } } } }] : []),
              ],
            }
          : { albums: { none: {} } };
        break;
      case 'photos-not-in-albums-only':
        albumScope = query.parentAlbumId ? { id: { in: [] } } : { albums: { none: {} } };
        break;
      case 'albums-only':
        albumScope = null;
        break;
    }

    const photoWhere = albumScope && { ownerId: user.sub, ...deletedFilter, ...excludedGroupsFilter, ...albumScope };

    const [photos, albums] = await Promise.all([
      photoWhere
        ? this.prisma.media.findMany({
            where: photoWhere,
            orderBy: [{ capturedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
            take: fetchLimit,
            select: {
              id: true,
              createdAt: true,
              capturedAt: true,
              metadata: true,
              thumbnailPath: true,
              _count: { select: { files: true } },
            },
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

    await this.mediaService.repairCapturedAtForPhotos(photos);

    const photoItems = photos.map((photo) =>
      this.mediaService.toGalleryImageResponse({ ...photo, capturedAt: resolveCapturedAt(photo) })
    );

    const albumItems = albums.map((album) => this.albumService.toGalleryItemResponse(album));
    const pagedItems = photoItems
      .concat(albumItems)
      .sort(compareNewest)
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
