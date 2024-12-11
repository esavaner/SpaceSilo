import { PaginationQueryDto } from 'src/common/pagination.dto';

export class CreateFileDto {
  path: string;
}

export class CreateFolderDto extends CreateFileDto {
  name: string;
}

export class MoveFileDto extends CreateFileDto {
  newPath: string;
  name: string;
}

export class CopyFileDto extends MoveFileDto {}

export class DownloadFileDto extends CreateFileDto {}

export class RemoveFileDto extends CreateFileDto {}

export class FindAllFilesDto extends PaginationQueryDto {
  path: string;
}
