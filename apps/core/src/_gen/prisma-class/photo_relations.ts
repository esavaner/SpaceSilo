import { User } from './user';
import { Album } from './album';
import { Group } from './group';
import { ApiProperty } from '@nestjs/swagger';

export class PhotoRelations {
  @ApiProperty({ type: () => User })
  owner: User;

  @ApiProperty({ isArray: true, type: () => Album })
  albums: Album[];

  @ApiProperty({ isArray: true, type: () => Group })
  group: Group[];
}
