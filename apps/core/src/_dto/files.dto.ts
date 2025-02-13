import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/pagination.dto';

/* ------------------------- Requests -------------------------- */

export class CreateFileDto {
  newPath: string;
  name: string;
  groupId: string;
}

export class CreateFolderDto extends CreateFileDto {}

export class MoveFileDto extends CreateFileDto {
  fileUri: string;
}

export class CopyFileDto extends MoveFileDto {}

export class DownloadFileDto {
  fileUri: string;
  groupId: string;
}

export class RemoveFileDto extends DownloadFileDto {}

export class FindFileDto extends DownloadFileDto {}

export class FindAllFilesDto extends PaginationQueryDto {
  path: string;

  @ApiProperty({ type: [String] })
  groupIds: string | string[];
}

/* ------------------------- Responses ------------------------- */

export class FileEntity {
  @ApiProperty()
  name: string;

  @ApiProperty()
  uri: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  modificationTime: Date;

  @ApiProperty()
  isDirectory: boolean;

  @ApiProperty()
  md5: string;

  @ApiProperty()
  groupId: string;

  @ApiPropertyOptional()
  type?: string;
}
