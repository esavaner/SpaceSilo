import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { GroupAccessLevel } from '../prisma/generated/client';

/* ------------------------- Requests -------------------------- */

export class CreateGroupMemberRequest {
  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsEnum(GroupAccessLevel)
  access?: GroupAccessLevel;
}

export class UpdateGroupMemberAccessRequest {
  @IsOptional()
  @IsEnum(GroupAccessLevel)
  access?: GroupAccessLevel;
}

/* ------------------------- Responses ------------------------- */

export class GroupMemberResponse {
  @IsString()
  groupId!: string;

  @IsString()
  userId!: string;

  @IsEnum(GroupAccessLevel)
  access!: GroupAccessLevel;

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;
}
