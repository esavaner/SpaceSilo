import { IsArray, IsDate, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/* ------------------------- Requests -------------------------- */

export class CreatePhotoRequest {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsString()
  @IsNotEmpty()
  thumbnailPath!: string;

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

export class UpdatePhotoRequest {
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

/* ------------------------- Responses ------------------------- */

export class PhotoResponse {
  @IsString()
  id!: string;

  @IsString()
  url!: string;

  @IsString()
  path!: string;

  @IsString()
  thumbnailPath!: string;

  @IsString()
  hash!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

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
