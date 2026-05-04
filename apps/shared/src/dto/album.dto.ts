import { IsArray, IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/* ------------------------- Requests -------------------------- */

export class CreateAlbumRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}

export class AddPhotosToAlbumRequest {
  @IsArray()
  @IsString({ each: true })
  photoIds!: string[];
}

export class FindAlbumsRequest {
  @IsOptional()
  @IsString()
  parentId?: string | null;
}

export class UpdateAlbumRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}

/* ------------------------- Responses ------------------------- */

export class AlbumResponse {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsDate()
  capturedAt?: Date | null;

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
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subalbumIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  photoCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  subalbumCount?: number;
}
