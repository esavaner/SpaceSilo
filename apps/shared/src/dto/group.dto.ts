import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { GroupAccessLevel } from '../prisma/generated/client';
import { GroupMemberResponse } from './group-member.dto';

/* ------------------------- Requests -------------------------- */

export class CreateGroupRequest {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsBoolean()
  personal?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddGroupMemberRequest)
  members?: AddGroupMemberRequest[];
}

export class UpdateGroupRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  personal?: boolean;

  @IsOptional()
  @IsString()
  color?: string;
}

export class AddGroupMemberRequest {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsEnum(GroupAccessLevel)
  access?: GroupAccessLevel;
}

export class AddGroupMembersRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddGroupMemberRequest)
  members!: AddGroupMemberRequest[];
}

export class UpdateGroupMemberRequest {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsEnum(GroupAccessLevel)
  access?: GroupAccessLevel;
}

export class RemoveGroupMemberRequest {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

/* ------------------------- Responses ------------------------- */

export class GroupResponse {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;

  @IsOptional()
  @IsDate()
  deletedAt?: Date | null;

  @IsString()
  ownerId!: string;

  @IsOptional()
  @IsBoolean()
  personal?: boolean | null;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupMemberResponse)
  members?: GroupMemberResponse[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  albumIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoIds?: string[];
}
