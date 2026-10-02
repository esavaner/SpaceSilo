import { IsArray, IsDate, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';

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
