import { AccessLevel } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class GroupMember {
  @ApiProperty({ type: String })
  groupId: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ enum: AccessLevel, enumName: 'AccessLevel' })
  access: AccessLevel = AccessLevel.read;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
