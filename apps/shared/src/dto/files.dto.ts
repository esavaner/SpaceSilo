import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

export class FindAllFilesRequest {
  @IsOptional()
  @IsString()
  path?: string;

  @IsString({ each: true })
  groupIds!: string | string[];

  @IsOptional()
  take?: number;

  @IsOptional()
  skip?: number;
}

/* ------------------------- Responses ------------------------- */

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
