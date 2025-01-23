import { User } from './user';
import { Album } from './album';
import { Photo } from './photo';
import { Group } from './group';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AlbumRelations {
  @ApiProperty({ type: () => User })
  owner: User;

  @ApiPropertyOptional({ type: () => Album })
  parent?: Album;

  @ApiProperty({ isArray: true, type: () => Album })
  subalbums: Album[];

  @ApiProperty({ isArray: true, type: () => Photo })
  photos: Photo[];

  @ApiProperty({ isArray: true, type: () => Group })
  group: Group[];
}
