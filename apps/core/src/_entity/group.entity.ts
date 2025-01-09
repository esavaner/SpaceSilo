import { ApiProperty } from '@nestjs/swagger';
import { MemberEntity } from './member.entity';

export class GroupEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  members: MemberEntity[];

  @ApiProperty()
  ownerId: string;
}
