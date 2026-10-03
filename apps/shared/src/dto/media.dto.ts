import {
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/* ------------------------- Requests -------------------------- */

export class CreateMediaRequest {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsOptional()
  @IsString()
  thumbnailPath?: string | null;

  @IsString()
  @IsNotEmpty()
  hash!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @IsString()
  @IsNotEmpty()
  ownerId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  albumIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}

export class UpdateMediaRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  url?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  path?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  thumbnailPath?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hash?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  albumIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}

export class MediaBulkActionRequest {
  @IsArray()
  @IsString({ each: true })
  photoIds!: string[];
}

/* ------------------------- Responses ------------------------- */

export class MediaBulkActionResponse {
  @IsString()
  action!: 'trash' | 'restore' | 'delete-permanently';

  @IsArray()
  @IsString({ each: true })
  photoIds!: string[];

  @IsString()
  scope!: 'selected' | 'all';

  @IsString()
  status!: 'success';

  @IsInt()
  @Min(0)
  count!: number;
}

export class MediaResponse {
  @IsString()
  id!: string;

  @IsString()
  url!: string;

  @IsString()
  path!: string;

  @IsOptional()
  @IsString()
  thumbnailPath?: string | null;

  @IsString()
  hash!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @IsOptional()
  @IsDate()
  capturedAt?: Date;

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;

  @IsOptional()
  @IsDate()
  deletedAt?: Date | null;

  @IsString()
  ownerId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  albumIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}

export class MediaFileInfoResponse {
  @IsString()
  id!: string;

  @IsString()
  originalName!: string;

  @IsString()
  extension!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsInt()
  @Min(0)
  size!: number;

  @IsString()
  hash!: string;

  // Relative to the storage root.
  @IsString()
  path!: string;

  @IsBoolean()
  displayable!: boolean;

  @IsBoolean()
  isMain!: boolean;

  @IsDate()
  createdAt!: Date;

  @IsOptional()
  @IsInt()
  width?: number;

  @IsOptional()
  @IsInt()
  height?: number;

  @IsOptional()
  @IsString()
  camera?: string;

  @IsOptional()
  @IsString()
  lens?: string;

  @IsOptional()
  @IsNumber()
  iso?: number;

  @IsOptional()
  @IsNumber()
  aperture?: number;

  @IsOptional()
  @IsNumber()
  exposureTime?: number;

  @IsOptional()
  @IsNumber()
  focalLength?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class MediaInfoResponse {
  @IsString()
  id!: string;

  @IsOptional()
  @IsDate()
  capturedAt?: Date | null;

  @IsDate()
  createdAt!: Date;

  @IsOptional()
  @IsDate()
  deletedAt?: Date | null;

  // The main file comes first, then sidecars in the order they were added.
  @IsArray()
  files!: MediaFileInfoResponse[];
}
