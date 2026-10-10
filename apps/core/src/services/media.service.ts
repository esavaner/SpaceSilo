import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AlbumService } from '@/services/album.service';
import { API_PREFIX_PATH } from '@repo/shared/constants/api';
import {
  type GalleryImageResponse,
  type MediaBulkActionResponse,
  type MediaFileInfoResponse,
  type MediaInfoResponse,
  type Prisma,
  type TokenPayload,
} from '@repo/shared';
import exifr from 'exifr';
import sharp from 'sharp';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Err } from '@/common/api-message';
import { extractCapturedAt, metadataCapturedAt, resolveCapturedAt, withCapturedAt } from '@/common/captured-at';
import {
  MIME_TYPES,
  createThumbnail,
  ensurePreviewAsset,
  getMimeType,
  getNormalizedDimensions,
  getStemKey,
  getStoragePaths,
  getThumbnailOutputPath,
  isSupportedImage,
} from '@/common/media-assets';
import { uniqueIds } from '@/common/utils';

const MEDIA_SUMMARY_SELECT = {
  id: true,
  createdAt: true,
  capturedAt: true,
  metadata: true,
  path: true,
  thumbnailPath: true,
  _count: { select: { files: true } },
} satisfies Prisma.MediaSelect;

type UploadedImageFile = {
  buffer?: Buffer;
  originalname: string;
};

export type MediaSummary = Prisma.MediaGetPayload<{ select: typeof MEDIA_SUMMARY_SELECT }>;

type AttachFileInput = {
  ownerId: string;
  buffer: Buffer;
  filePath: string;
  originalName: string;
  stemKey: string;
};

type AttachFileResult = { duplicate: boolean; media: MediaSummary };

type BulkAction = MediaBulkActionResponse['action'];

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly albumService: AlbumService
  ) {}

  private async ensureCapturedAt(photo: {
    id: string;
    path: string;
    createdAt: Date;
    capturedAt?: Date | null;
    metadata?: unknown;
  }) {
    const fromMetadata = metadataCapturedAt(photo.metadata);
    if (fromMetadata) {
      if (photo.capturedAt?.getTime() !== fromMetadata.getTime()) {
        await this.saveCapturedAt(photo, fromMetadata, fromMetadata);
      }

      return fromMetadata;
    }

    if (photo.capturedAt) {
      return photo.capturedAt;
    }

    const source = fs.existsSync(photo.path) ? fs.readFileSync(photo.path) : null;
    if (!source) {
      return photo.createdAt;
    }

    const extracted = await extractCapturedAt(source);
    const resolved = extracted ?? photo.createdAt;
    await this.saveCapturedAt(photo, resolved, extracted);

    return resolved;
  }

  private async saveCapturedAt(photo: { id: string; metadata?: unknown }, capturedAt: Date, storedAt: Date | null) {
    await this.prisma.media.update({
      where: { id: photo.id },
      data: { capturedAt, metadata: withCapturedAt(photo.metadata, storedAt) },
    });

    await this.albumService.refreshCapturedAtForMedia([photo.id]);
  }

  async repairCapturedAtFromMetadata(ownerId: string) {
    const updatedPhotos = await this.prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "Media"
      SET "capturedAt" = NULLIF("metadata"->>'capturedAt', '')::timestamptz
      WHERE "ownerId" = ${ownerId}
        AND NULLIF("metadata"->>'capturedAt', '') IS NOT NULL
        AND "capturedAt" IS DISTINCT FROM NULLIF("metadata"->>'capturedAt', '')::timestamptz
      RETURNING "id"
    `;

    await this.albumService.refreshCapturedAtForMedia(updatedPhotos.map((photo) => photo.id));
  }

  async repairCapturedAtForPhotos(
    photos: Array<{ id: string; createdAt: Date; capturedAt?: Date | null; metadata?: unknown }>
  ) {
    const stalePhotos = photos
      .map((photo) => ({ id: photo.id, capturedAt: photo.capturedAt, resolved: resolveCapturedAt(photo) }))
      .filter((photo) => photo.capturedAt?.getTime() !== photo.resolved.getTime());

    if (!stalePhotos.length) {
      return;
    }

    await Promise.all(
      stalePhotos.map((photo) =>
        this.prisma.media.update({ where: { id: photo.id }, data: { capturedAt: photo.resolved } })
      )
    );

    await this.albumService.refreshCapturedAtForMedia(stalePhotos.map((photo) => photo.id));
  }

  toGalleryImageResponse(media: {
    id: string;
    createdAt: Date;
    capturedAt: Date;
    thumbnailPath?: string | null;
    _count: { files: number };
  }): GalleryImageResponse {
    return {
      id: media.id,
      type: 'photo',
      imagePath: `${API_PREFIX_PATH}/gallery/photo/${media.id}/file`,
      previewPath: `${API_PREFIX_PATH}/gallery/photo/${media.id}/preview`,
      thumbnailPath: `${API_PREFIX_PATH}/gallery/photo/${media.id}/thumbnail`,
      displayable: Boolean(media.thumbnailPath),
      sidecarCount: Math.max(media._count.files - 1, 0),
      capturedAt: media.capturedAt,
      createdAt: media.createdAt,
    };
  }

  private findOwnedPhoto(id: string, user: TokenPayload) {
    return this.prisma.media.findFirst({
      where: { id, ownerId: user.sub },
      include: { _count: { select: { files: true } } },
    });
  }

  private async getOwnedPhotoOrThrow(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo) {
      throw Err.NotFound('api.photos.Err.NotFound');
    }

    return photo;
  }

  private async ensureOwnedPhotoIds(photoIds: string[], ownerId: string, state: Prisma.MediaWhereInput) {
    const ids = uniqueIds(photoIds);
    if (!ids.length) {
      return ids;
    }

    const count = await this.prisma.media.count({ where: { id: { in: ids }, ownerId, ...state } });
    if (count !== ids.length) {
      throw Err.BadRequest('api.photos.photosMissing');
    }

    return ids;
  }

  // Trash, restore and permanent delete act on the whole media item, sidecar files included.
  // Without `ids` the action applies to everything currently in the trash.
  private async bulkAction(action: BulkAction, user: TokenPayload, ids?: string[]): Promise<MediaBulkActionResponse> {
    const scope = ids ? 'selected' : 'all';
    const state: Prisma.MediaWhereInput = { deletedAt: action === 'trash' ? null : { not: null } };
    const photoIds = ids
      ? await this.ensureOwnedPhotoIds(ids, user.sub, state)
      : (await this.prisma.media.findMany({ where: { ownerId: user.sub, ...state }, select: { id: true } })).map(
          (photo) => photo.id
        );

    if (!photoIds.length) {
      return { action, photoIds: [], scope, status: 'success', count: 0 };
    }

    // Albums must be read before a permanent delete drops the links.
    const albumIds = await this.albumService.findIdsForMedia(photoIds);
    const where: Prisma.MediaWhereInput = { ownerId: user.sub, ...state, ...(ids ? { id: { in: photoIds } } : {}) };
    const { count } =
      action === 'delete-permanently'
        ? await this.prisma.media.deleteMany({ where })
        : await this.prisma.media.updateMany({ where, data: { deletedAt: action === 'trash' ? new Date() : null } });

    await this.albumService.refreshAlbums(albumIds);

    return { action, photoIds, scope, status: 'success', count };
  }

  private createStreamableFile(filePath: string) {
    return new StreamableFile(fs.createReadStream(filePath), { type: getMimeType(filePath) });
  }

  async create(file: UploadedImageFile, user: TokenPayload) {
    const originalName = path.basename(file?.originalname ?? '');
    if (!file?.buffer || !originalName) {
      throw Err.BadRequest('api.photos.fileRequired');
    }

    const { storagePath } = getStoragePaths();
    fs.mkdirSync(storagePath, { recursive: true });
    const filePath = this.writeUniqueFile(storagePath, originalName, file.buffer);

    let result: AttachFileResult;
    try {
      result = await this.attachFile({
        ownerId: user.sub,
        buffer: file.buffer,
        filePath,
        originalName,
        stemKey: getStemKey('', originalName),
      });
    } catch (error) {
      fs.rmSync(filePath, { force: true });
      throw error;
    }

    if (result.duplicate) {
      fs.rmSync(filePath, { force: true });
      throw Err.Conflict('api.photos.duplicate');
    }

    return this.toGalleryImageResponse({ ...result.media, capturedAt: resolveCapturedAt(result.media) });
  }

  private writeUniqueFile(dirPath: string, fileName: string, buffer: Buffer) {
    const { name, ext } = path.parse(fileName);

    for (let index = 0; ; index += 1) {
      const candidate = path.join(dirPath, index === 0 ? fileName : `${name} (${index})${ext}`);

      try {
        fs.writeFileSync(candidate, buffer, { flag: 'wx' });
        return candidate;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }

  private async prepareDisplayableAssets(filePath: string, buffer: Buffer) {
    const thumbnailPath = getThumbnailOutputPath(filePath);

    try {
      await createThumbnail(buffer, thumbnailPath);
      await ensurePreviewAsset(filePath, buffer);
    } catch {
      return null;
    }

    return { thumbnailPath, capturedAt: await extractCapturedAt(buffer) };
  }

  // Registers an on-disk file and attaches it to the media item sharing its stem, creating one if needed.
  async attachFile({ ownerId, buffer, filePath, originalName, stemKey }: AttachFileInput): Promise<AttachFileResult> {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const duplicate = await this.prisma.mediaFile.findFirst({
      where: { hash },
      select: { media: { select: MEDIA_SUMMARY_SELECT } },
    });
    if (duplicate) {
      return { duplicate: true, media: duplicate.media };
    }

    const assets = isSupportedImage(originalName) ? await this.prepareDisplayableAssets(filePath, buffer) : null;
    const fileData = {
      originalName,
      path: filePath,
      hash,
      size: buffer.length,
      displayable: assets !== null,
    };

    for (let attempt = 0; ; attempt += 1) {
      const existing = await this.prisma.media.findUnique({
        where: { ownerId_stemKey: { ownerId, stemKey } },
        select: { id: true, createdAt: true, metadata: true, thumbnailPath: true },
      });

      if (existing) {
        // The main file is the first displayable one; a later displayable file only takes over from a non-displayable main.
        const promote = assets !== null && !existing.thumbnailPath;
        const media = await this.prisma.media.update({
          where: { id: existing.id },
          data: {
            files: { create: fileData },
            ...(promote
              ? {
                  path: filePath,
                  hash,
                  thumbnailPath: assets.thumbnailPath,
                  capturedAt: assets.capturedAt ?? existing.createdAt,
                  metadata: withCapturedAt(existing.metadata, assets.capturedAt),
                }
              : {}),
          },
          select: MEDIA_SUMMARY_SELECT,
        });

        if (promote) {
          await this.albumService.refreshCapturedAtForMedia([media.id]);
        }

        return { duplicate: false, media };
      }

      const createdAt = new Date();

      try {
        const media = await this.prisma.media.create({
          data: {
            url: '',
            path: filePath,
            hash,
            stemKey,
            thumbnailPath: assets?.thumbnailPath ?? null,
            capturedAt: assets?.capturedAt ?? createdAt,
            createdAt,
            metadata: withCapturedAt(null, assets?.capturedAt ?? null),
            ownerId,
            files: { create: fileData },
          },
          select: MEDIA_SUMMARY_SELECT,
        });

        return { duplicate: false, media };
      } catch (error) {
        // A concurrent upload with the same stem created the media first; retry as an attach.
        if (attempt === 0 && (error as { code?: string }).code === 'P2002') {
          continue;
        }

        throw error;
      }
    }
  }

  async repairIndexedMedia(media: MediaSummary, filePath: string, fileBuffer: Buffer) {
    if (media.path !== filePath || !isSupportedImage(filePath)) {
      return;
    }

    const thumbnailPath = getThumbnailOutputPath(filePath);
    await ensurePreviewAsset(filePath, fileBuffer);

    const extracted = await extractCapturedAt(fileBuffer);
    const updateData: Prisma.MediaUpdateInput = {};
    const resolved = extracted ?? resolveCapturedAt(media);

    if (extracted && !metadataCapturedAt(media.metadata)) {
      updateData.metadata = withCapturedAt(media.metadata, extracted);
    }

    if (media.capturedAt.getTime() !== resolved.getTime()) {
      updateData.capturedAt = resolved;
    }

    if (media.thumbnailPath !== thumbnailPath || !fs.existsSync(thumbnailPath)) {
      await createThumbnail(fileBuffer, thumbnailPath);
      updateData.thumbnailPath = thumbnailPath;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.media.update({ where: { id: media.id }, data: updateData });

      if (updateData.capturedAt) {
        await this.albumService.refreshCapturedAtForMedia([media.id]);
      }
    }
  }

  async findOne(id: string, user: TokenPayload): Promise<GalleryImageResponse> {
    const photo = await this.getOwnedPhotoOrThrow(id, user);
    return this.toGalleryImageResponse({ ...photo, capturedAt: await this.ensureCapturedAt(photo) });
  }

  private async readImageDetails(filePath: string): Promise<Partial<MediaFileInfoResponse>> {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const details: Partial<MediaFileInfoResponse> = {};

    try {
      const { width, height } = getNormalizedDimensions(await sharp(filePath).metadata());
      if (width && height) {
        details.width = width;
        details.height = height;
      }
    } catch {
      // Unreadable images just have no dimensions.
    }

    try {
      const exif = await exifr.parse(filePath, [
        'Make',
        'Model',
        'LensModel',
        'ISO',
        'FNumber',
        'ExposureTime',
        'FocalLength',
      ]);
      const camera = [exif?.Make, exif?.Model].filter((part) => typeof part === 'string' && part.trim()).join(' ');
      const numberOrUndefined = (value: unknown) => (typeof value === 'number' ? value : undefined);

      details.camera = camera || undefined;
      details.lens = typeof exif?.LensModel === 'string' ? exif.LensModel : undefined;
      details.iso = numberOrUndefined(exif?.ISO);
      details.aperture = numberOrUndefined(exif?.FNumber);
      details.exposureTime = numberOrUndefined(exif?.ExposureTime);
      details.focalLength = numberOrUndefined(exif?.FocalLength);

      const gps = await exifr.gps(filePath);
      details.latitude = numberOrUndefined(gps?.latitude);
      details.longitude = numberOrUndefined(gps?.longitude);
    } catch {
      // Files without EXIF just have no camera details.
    }

    return details;
  }

  async findInfo(id: string, user: TokenPayload): Promise<MediaInfoResponse> {
    const media = await this.getOwnedPhotoOrThrow(id, user);
    const { storagePath } = getStoragePaths();
    const files = await this.prisma.mediaFile.findMany({
      where: { mediaId: media.id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const fileInfos = await Promise.all(
      files.map(async (file): Promise<MediaFileInfoResponse> => {
        const extension = path.extname(file.originalName).toLowerCase();

        return {
          id: file.id,
          originalName: file.originalName,
          extension,
          mimeType: MIME_TYPES[extension],
          size: file.size,
          hash: file.hash,
          path: path.relative(storagePath, file.path),
          displayable: file.displayable,
          isMain: file.path === media.path,
          createdAt: file.createdAt,
          ...(file.displayable ? await this.readImageDetails(file.path) : {}),
        };
      })
    );

    return {
      id: media.id,
      capturedAt: resolveCapturedAt(media),
      createdAt: media.createdAt,
      deletedAt: media.deletedAt,
      files: fileInfos.sort((left, right) => Number(right.isMain) - Number(left.isMain)),
    };
  }

  // update(id: number, updatePhotoDto: UpdatePhotoDto) {
  //   return `This action updates a #${id} photo`;
  // }

  async remove(id: string, user: TokenPayload) {
    const photo = await this.getOwnedPhotoOrThrow(id, user);

    if (!photo.deletedAt) {
      await this.trashMany([photo.id], user);
      return this.findOne(photo.id, user);
    }

    return this.removeManyPermanently([photo.id], user);
  }

  trashMany(photoIds: string[], user: TokenPayload) {
    return this.bulkAction('trash', user, photoIds);
  }

  restoreMany(photoIds: string[], user: TokenPayload) {
    return this.bulkAction('restore', user, photoIds);
  }

  restoreAll(user: TokenPayload) {
    return this.bulkAction('restore', user);
  }

  removeManyPermanently(photoIds: string[], user: TokenPayload) {
    return this.bulkAction('delete-permanently', user, photoIds);
  }

  removeAllTrashed(user: TokenPayload) {
    return this.bulkAction('delete-permanently', user);
  }

  async findImage(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo?.path || !fs.existsSync(photo.path)) {
      throw Err.NotFound('api.photos.Err.NotFound');
    }

    return this.createStreamableFile(photo.path);
  }

  async findPreview(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo?.path || !photo.thumbnailPath || !fs.existsSync(photo.path)) {
      throw Err.NotFound('api.photos.Err.NotFound');
    }

    const previewPath = await ensurePreviewAsset(photo.path);
    return this.createStreamableFile(previewPath ?? photo.path);
  }

  async findThumbnail(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo?.thumbnailPath || !fs.existsSync(photo.thumbnailPath)) {
      throw Err.NotFound('api.photos.thumbnailErr.NotFound');
    }

    return this.createStreamableFile(photo.thumbnailPath);
  }
}
