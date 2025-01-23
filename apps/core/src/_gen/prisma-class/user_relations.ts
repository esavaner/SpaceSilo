import { Photo } from './photo';
import { Album } from './album';
import { Group } from './group';
import { GroupMember } from './group_member';
import { ApiProperty } from '@nestjs/swagger';

export class UserRelations {
  @ApiProperty({ isArray: true, type: () => Photo })
  photos: Photo[];

  @ApiProperty({ isArray: true, type: () => Album })
  albums: Album[];

  @ApiProperty({ isArray: true, type: () => Group })
  ownerOf: Group[];

  @ApiProperty({ isArray: true, type: () => GroupMember })
  memberOf: GroupMember[];
}
