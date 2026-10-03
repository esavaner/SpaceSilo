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
import { environment } from '@/common/env.validation';

const THUMBNAIL_HEIGHT = 300;
const THUMBNAIL_JPEG_QUALITY = 82;
const PREVIEW_MAX_WIDTH = 1920;
const PREVIEW_MAX_HEIGHT = 1080;
const PREVIEW_JPEG_QUALITY = 90;
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff', '.avif']);
// Extensions that may appear before a sidecar extension, as in IMG_1.jpg.xmp.
const KNOWN_MEDIA_EXTENSIONS = new Set([
  ...SUPPORTED_IMAGE_EXTENSIONS,
  '.heic',
  '.heif',
  '.cr2',
  '.cr3',
  '.nef',
  '.arw',
  '.dng',
  '.raf',
  '.orf',
  '.rw2',
  '.mov',
  '.mp4',
]);
const IGNORED_FILE_NAMES = new Set(['thumbs.db', 'desktop.ini']);
const MEDIA_SUMMARY_SELECT = {
  id: true,
  createdAt: true,
  capturedAt: true,
  metadata: true,
  path: true,
  thumbnailPath: true,
  _count: { select: { files: true } },
} satisfies Prisma.MediaSelect;
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.avif': 'image/avif',
};

type StoredPhotoMetadata = Prisma.InputJsonObject & {
  capturedAt?: string | null;
};

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

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly albumService: AlbumService
  ) {}

  private asStoredPhotoMetadata(metadata: unknown): StoredPhotoMetadata | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    return { ...(metadata as Prisma.InputJsonObject) };
  }

  private normalizeIds(ids?: string[]) {
    return Array.from(new Set((ids ?? []).filter(Boolean)));
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
        await this.prisma.media.update({
          where: { id: photo.id },
          data: {
            capturedAt: metadataCapturedAt,
            metadata: this.mergePhotoMetadata(photo.metadata, metadataCapturedAt.toISOString()),
          },
        });

        await this.albumService.refreshCapturedAtForMedia([photo.id]);
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

    await this.prisma.media.update({
      where: { id: photo.id },
      data: {
        capturedAt: resolvedCapturedAt,
        metadata: this.mergePhotoMetadata(photo.metadata, capturedAt),
      },
    });

    await this.albumService.refreshCapturedAtForMedia([photo.id]);

    return resolvedCapturedAt;
  }

  resolveCapturedAt(photo: { createdAt: Date; capturedAt?: Date | null; metadata?: unknown }) {
    return this.getCapturedAtFromMetadata(photo.metadata) ?? photo.capturedAt ?? photo.createdAt;
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
        this.prisma.media.update({
          where: { id: photo.id },
          data: { capturedAt: photo.resolvedCapturedAt },
        })
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

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  getStoragePaths() {
    return {
      storagePath: environment.storagePath,
      thumbnailsPath: path.join(environment.appDataPath, 'thumbnails'),
      previewsPath: path.join(environment.appDataPath, 'previews'),
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

  isIgnoredFile(filePath: string) {
    const name = path.basename(filePath).toLowerCase();
    return name.startsWith('.') || IGNORED_FILE_NAMES.has(name);
  }

  // Files in the same directory with the same stem (any extension) belong to one media item.
  getStemKey(relativeDir: string, fileName: string) {
    let stem = path.parse(fileName).name;
    const innerExtension = path.extname(stem).toLowerCase();

    if (KNOWN_MEDIA_EXTENSIONS.has(innerExtension)) {
      stem = stem.slice(0, -innerExtension.length);
    }

    return path.posix.join(relativeDir.split(path.sep).join('/'), stem).toLowerCase();
  }

  getStemKeyForStoredFile(filePath: string) {
    const { storagePath } = this.getStoragePaths();
    const relativePath = path.relative(storagePath, filePath);
    return this.getStemKey(
      path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath),
      path.basename(filePath)
    );
  }

  getThumbnailOutputPath(imagePath: string) {
    const { storagePath, thumbnailsPath } = this.ensureStoragePaths();
    const relativePath = path.relative(storagePath, imagePath);
    const parsed = path.parse(relativePath);
    // Keep the source extension so IMG_1.jpg and IMG_1.png don't share one thumbnail.
    return path.join(thumbnailsPath, parsed.dir, `${parsed.base}.jpg`);
  }

  private getPreviewOutputPath(imagePath: string) {
    const { storagePath, previewsPath } = this.ensureStoragePaths();
    const relativePath = path.relative(storagePath, imagePath);
    const parsed = path.parse(relativePath);
    return path.join(previewsPath, parsed.dir, `${parsed.base}.jpg`);
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
    return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  }

  private async findOwnedPhoto(id: string, user: TokenPayload) {
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

  private async ensureOwnedPhotoIds(
    photoIds: string[],
    ownerId: string,
    options?: { requireDeleted?: boolean; requireActive?: boolean }
  ) {
    const normalizedIds = this.normalizeIds(photoIds);

    if (!normalizedIds.length) {
      return normalizedIds;
    }

    const photos = await this.prisma.media.findMany({
      where: {
        id: { in: normalizedIds },
        ownerId,
        ...(options?.requireDeleted ? { deletedAt: { not: null } } : {}),
        ...(options?.requireActive ? { deletedAt: null } : {}),
      },
      select: { id: true },
    });

    if (photos.length !== normalizedIds.length) {
      throw Err.BadRequest('api.photos.photosMissing');
    }

    return normalizedIds;
  }

  private async getAlbumIdsForPhotos(photoIds: string[]) {
    if (!photoIds.length) {
      return [];
    }

    const albums = await this.prisma.album.findMany({
      where: {
        media: {
          some: { id: { in: photoIds } },
        },
      },
      select: { id: true },
    });

    return albums.map((album) => album.id);
  }

  private async refreshAlbums(albumIds: string[]) {
    const normalizedAlbumIds = this.normalizeIds(albumIds);

    await Promise.all(normalizedAlbumIds.map((albumId) => this.albumService.refreshAlbumCapturedAtCascade(albumId)));
  }

  private async getTrashedPhotoIds(ownerId: string) {
    const photos = await this.prisma.media.findMany({
      where: { ownerId, deletedAt: { not: null } },
      select: { id: true },
    });

    return photos.map((photo) => photo.id);
  }

  private createBulkActionResponse(
    action: MediaBulkActionResponse['action'],
    photoIds: string[],
    scope: MediaBulkActionResponse['scope'],
    count: number
  ): MediaBulkActionResponse {
    return {
      action,
      photoIds,
      scope,
      status: 'success',
      count,
    };
  }

  private createStreamableFile(filePath: string) {
    const file = fs.createReadStream(filePath);
    return new StreamableFile(file, { type: this.getMimeType(filePath) });
  }

  async create(file: UploadedImageFile, user: TokenPayload) {
    const originalName = path.basename(file?.originalname ?? '');
    if (!file?.buffer || !originalName) {
      throw Err.BadRequest('api.photos.fileRequired');
    }

    const { storagePath } = this.ensureStoragePaths();
    const filePath = this.writeUniqueFile(storagePath, originalName, file.buffer);

    let result: AttachFileResult;
    try {
      result = await this.attachFile({
        ownerId: user.sub,
        buffer: file.buffer,
        filePath,
        originalName,
        stemKey: this.getStemKey('', originalName),
      });
    } catch (error) {
      fs.rmSync(filePath, { force: true });
      throw error;
    }

    if (result.duplicate) {
      fs.rmSync(filePath, { force: true });
      throw Err.Conflict('api.photos.duplicate');
    }

    return this.toGalleryImageResponse({
      ...result.media,
      capturedAt: this.resolveCapturedAt(result.media),
    });
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
    const thumbnailPath = this.getThumbnailOutputPath(filePath);

    try {
      await this.createThumbnail(buffer, thumbnailPath);
      await this.ensurePreviewAsset(filePath, buffer);
    } catch {
      return null;
    }

    return { thumbnailPath, capturedAt: await this.extractCapturedAt(buffer) };
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

    const assets = this.isSupportedImage(originalName) ? await this.prepareDisplayableAssets(filePath, buffer) : null;
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
                  capturedAt: assets.capturedAt ? new Date(assets.capturedAt) : existing.createdAt,
                  metadata: this.mergePhotoMetadata(existing.metadata, assets.capturedAt),
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
            capturedAt: assets?.capturedAt ? new Date(assets.capturedAt) : createdAt,
            createdAt,
            metadata: this.mergePhotoMetadata(null, assets?.capturedAt ?? null),
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
    if (media.path !== filePath || !this.isSupportedImage(filePath)) {
      return;
    }

    const thumbnailPath = this.getThumbnailOutputPath(filePath);
    await this.ensurePreviewAsset(filePath, fileBuffer);

    const capturedAt = await this.extractCapturedAt(fileBuffer);
    const updateData: Prisma.MediaUpdateInput = {};
    const resolvedCapturedAt = capturedAt ? new Date(capturedAt) : this.resolveCapturedAt(media);

    if (capturedAt && !this.getCapturedAtFromMetadata(media.metadata)) {
      updateData.metadata = this.mergePhotoMetadata(media.metadata, capturedAt);
    }

    if (media.capturedAt.getTime() !== resolvedCapturedAt.getTime()) {
      updateData.capturedAt = resolvedCapturedAt;
    }

    if (!media.thumbnailPath || media.thumbnailPath !== thumbnailPath || !fs.existsSync(media.thumbnailPath)) {
      await this.createThumbnail(fileBuffer, thumbnailPath);
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
    const capturedAt = await this.ensureCapturedAt(photo);

    return this.toGalleryImageResponse({
      ...photo,
      capturedAt,
    });
  }

  private async readImageDetails(filePath: string): Promise<Partial<MediaFileInfoResponse>> {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const details: Partial<MediaFileInfoResponse> = {};

    try {
      const { width, height } = this.getNormalizedDimensions(await sharp(filePath).metadata());
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
    const { storagePath } = this.getStoragePaths();
    const files = await this.prisma.mediaFile.findMany({
      where: { mediaId: media.id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const fileInfos = await Promise.all(
      files.map(async (file): Promise<MediaFileInfoResponse> => {
        const extension = path.extname(file.originalName).toLowerCase();
        const mimeType = MIME_TYPES[extension];

        return {
          id: file.id,
          originalName: file.originalName,
          extension,
          mimeType,
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
      capturedAt: this.resolveCapturedAt(media),
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

  // Provisional: trash, restore and permanent delete act on the whole media item, sidecar files included.
  async trashMany(photoIds: string[], user: TokenPayload) {
    const normalizedIds = await this.ensureOwnedPhotoIds(photoIds, user.sub, { requireActive: true });

    if (!normalizedIds.length) {
      return this.createBulkActionResponse('trash', [], 'selected', 0);
    }

    const albumIds = await this.getAlbumIdsForPhotos(normalizedIds);
    const result = await this.prisma.media.updateMany({
      where: {
        id: { in: normalizedIds },
        ownerId: user.sub,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    await this.refreshAlbums(albumIds);

    return this.createBulkActionResponse('trash', normalizedIds, 'selected', result.count);
  }

  async restoreMany(photoIds: string[], user: TokenPayload) {
    const normalizedIds = await this.ensureOwnedPhotoIds(photoIds, user.sub, { requireDeleted: true });

    if (!normalizedIds.length) {
      return this.createBulkActionResponse('restore', [], 'selected', 0);
    }

    const result = await this.prisma.media.updateMany({
      where: {
        id: { in: normalizedIds },
        ownerId: user.sub,
        deletedAt: { not: null },
      },
      data: { deletedAt: null },
    });

    await this.albumService.refreshCapturedAtForMedia(normalizedIds);

    return this.createBulkActionResponse('restore', normalizedIds, 'selected', result.count);
  }

  async restoreAll(user: TokenPayload) {
    const photoIds = await this.getTrashedPhotoIds(user.sub);

    if (!photoIds.length) {
      return this.createBulkActionResponse('restore', [], 'all', 0);
    }

    const result = await this.prisma.media.updateMany({
      where: { ownerId: user.sub, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    await this.albumService.refreshCapturedAtForMedia(photoIds);

    return this.createBulkActionResponse('restore', photoIds, 'all', result.count);
  }

  async removeManyPermanently(photoIds: string[], user: TokenPayload) {
    const normalizedIds = await this.ensureOwnedPhotoIds(photoIds, user.sub, { requireDeleted: true });

    if (!normalizedIds.length) {
      return this.createBulkActionResponse('delete-permanently', [], 'selected', 0);
    }

    const albumIds = await this.getAlbumIdsForPhotos(normalizedIds);
    const result = await this.prisma.media.deleteMany({
      where: {
        id: { in: normalizedIds },
        ownerId: user.sub,
        deletedAt: { not: null },
      },
    });

    await this.refreshAlbums(albumIds);

    return this.createBulkActionResponse('delete-permanently', normalizedIds, 'selected', result.count);
  }

  async removeAllTrashed(user: TokenPayload) {
    const photoIds = await this.getTrashedPhotoIds(user.sub);

    if (!photoIds.length) {
      return this.createBulkActionResponse('delete-permanently', [], 'all', 0);
    }

    const albumIds = await this.getAlbumIdsForPhotos(photoIds);
    const result = await this.prisma.media.deleteMany({
      where: { ownerId: user.sub, deletedAt: { not: null } },
    });

    await this.refreshAlbums(albumIds);

    return this.createBulkActionResponse('delete-permanently', photoIds, 'all', result.count);
  }

  async findImage(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo || !photo.path || !fs.existsSync(photo.path)) {
      throw Err.NotFound('api.photos.Err.NotFound');
    }

    return this.createStreamableFile(photo.path);
  }

  async findPreview(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo || !photo.path || !photo.thumbnailPath || !fs.existsSync(photo.path)) {
      throw Err.NotFound('api.photos.Err.NotFound');
    }

    const previewPath = await this.ensurePreviewAsset(photo.path);
    return this.createStreamableFile(previewPath ?? photo.path);
  }

  async findThumbnail(id: string, user: TokenPayload) {
    const photo = await this.findOwnedPhoto(id, user);
    if (!photo || !photo.thumbnailPath || !fs.existsSync(photo.thumbnailPath)) {
      throw Err.NotFound('api.photos.thumbnailErr.NotFound');
    }

    return this.createStreamableFile(photo.thumbnailPath);
  }
}
