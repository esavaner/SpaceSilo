import { User } from './user';
import { GroupMember } from './group_member';
import { Album } from './album';
import { Photo } from './photo';
import { ApiProperty } from '@nestjs/swagger';

export class GroupRelations {
  @ApiProperty({ type: () => User })
  owner: User;

  @ApiProperty({ isArray: true, type: () => GroupMember })
  members: GroupMember[];

  @ApiProperty({ isArray: true, type: () => Album })
  albums: Album[];

  @ApiProperty({ isArray: true, type: () => Photo })
  photos: Photo[];
}
