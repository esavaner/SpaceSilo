import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/* ------------------------- Requests -------------------------- */

export class CreateFileRequest {
  @IsString()
  @IsNotEmpty()
  newPath!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;
}

export class CreateFolderRequest extends CreateFileRequest {}

export class MoveFileRequest extends CreateFileRequest {
  @IsString()
  @IsNotEmpty()
  fileUri!: string;
}

export class CopyFileRequest extends MoveFileRequest {}

export class DownloadFileRequest {
  @IsString()
  @IsNotEmpty()
  fileUri!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;
}

export class RemoveFileRequest extends DownloadFileRequest {}

export class FindFileRequest extends DownloadFileRequest {}

export class FindAllFilesItemRequest {
  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  skip?: number;
}

export class FindAllFilesRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FindAllFilesItemRequest)
  items!: FindAllFilesItemRequest[];
}

export class SearchFilesRequest {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/* ------------------------- Responses ------------------------- */

export class FileSearchResponse {
  @IsString()
  name!: string;

  @IsString()
  uri!: string;

  @IsBoolean()
  isDirectory!: boolean;

  @IsString()
  groupId!: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class FileResponse {
  @IsString()
  name!: string;

  @IsString()
  uri!: string;

  @IsOptional()
  size?: number;

  @IsDate()
  modificationTime!: Date;

  @IsBoolean()
  isDirectory!: boolean;

  @IsString()
  md5!: string;

  @IsString()
  groupId!: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class FileInfoOwnerResponse {
  @IsString()
  id!: string;

  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string | null;
}

export class FileInfoGroupResponse {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  personal?: boolean | null;

  @ValidateNested()
  @Type(() => FileInfoOwnerResponse)
  owner!: FileInfoOwnerResponse;

  @IsOptional()
  @IsString()
  access?: string;
}

export class FileInfoResponse extends FileResponse {
  @IsDate()
  createdAt!: Date;

  @ValidateNested()
  @Type(() => FileInfoGroupResponse)
  group!: FileInfoGroupResponse;
}

export class FileActionResponse {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsString()
  folderDir?: string;
}
