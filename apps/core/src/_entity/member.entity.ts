import { ApiProperty } from '@nestjs/swagger';

export class MemberEntity {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  admin: boolean;

  @ApiProperty()
  write: boolean;

  @ApiProperty()
  delete: boolean;
}
