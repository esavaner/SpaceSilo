import { ApiProperty } from '@nestjs/swagger';

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
}
