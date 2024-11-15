import { PaginationQueryDto } from 'src/common/pagination.dto';

export class CreateFileDto {
  path: string;
}

export class MoveFileDto extends CreateFileDto {
  newPath: string;
}

export class DownloadFileDto extends CreateFileDto {}

export class RemoveFileDto extends CreateFileDto {}

export class FindAllFilesDto extends PaginationQueryDto {
  path: string;
}
