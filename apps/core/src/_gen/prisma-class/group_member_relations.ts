import { Group } from './group';
import { User } from './user';
import { ApiProperty } from '@nestjs/swagger';

export class GroupMemberRelations {
  @ApiProperty({ type: () => Group })
  group: Group;

  @ApiProperty({ type: () => User })
  user: User;
}
