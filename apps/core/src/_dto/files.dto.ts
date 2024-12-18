import { PaginationQueryDto } from 'src/common/pagination.dto';

export class CreateFileDto {
  newPath: string;
  name: string;
}

export class CreateFolderDto extends CreateFileDto {}

export class MoveFileDto extends CreateFileDto {
  fileUri: string;
}

export class CopyFileDto extends MoveFileDto {}

export class DownloadFileDto {
  fileUri: string;
}

export class RemoveFileDto extends DownloadFileDto {}

export class FindAllFilesDto extends PaginationQueryDto {
  path: string;
}
