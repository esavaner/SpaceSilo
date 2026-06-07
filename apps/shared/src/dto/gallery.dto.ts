import { IsArray, IsBoolean, IsDate, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export const galleryItemTypes = ['photo', 'album'] as const;

export type GalleryItemType = (typeof galleryItemTypes)[number];

export const galleryViewModes = [
  'photos-only',
  'photos-and-albums',
  'albums-only',
  'photos-not-in-albums-only',
] as const;

export type GalleryViewMode = (typeof galleryViewModes)[number];

/* ------------------------- Requests -------------------------- */

export class FindGalleryImagesRequest {
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  @IsOptional()
  @IsString()
  parentAlbumId?: string | null;

  @IsOptional()
  @IsIn(galleryViewModes)
  viewMode?: GalleryViewMode;

  @IsOptional()
  @IsBoolean()
  condensed?: boolean;

  @IsOptional()
  @IsBoolean()
  trash?: boolean;
}

/* ------------------------- Responses ------------------------- */

export class GalleryImageResponse {
  @IsString()
  id!: string;

  @IsIn(galleryItemTypes)
  type!: GalleryItemType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsString()
  previewPath?: string;

  @IsOptional()
  @IsString()
  thumbnailPath?: string;

  @IsOptional()
  @IsDate()
  capturedAt?: Date | null;

  @IsDate()
  createdAt!: Date;

  @IsOptional()
  @IsString()
  parentAlbumId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  photoCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  subalbumCount?: number;
}

export class GalleryImagePageResponse {
  @IsArray()
  items!: GalleryImageResponse[];

  @IsBoolean()
  hasMore!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  nextSkip?: number;
}

export class GalleryStatsResponse {
  @IsNumber()
  totalFiles!: number;

  @IsNumber()
  totalImages!: number;

  @IsNumber()
  indexedImages!: number;

  @IsNumber()
  storageSize!: number;
}

export class GalleryScanResponse {
  @IsNumber()
  scannedImages!: number;

  @IsNumber()
  addedImages!: number;
}
