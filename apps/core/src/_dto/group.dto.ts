import { PartialType } from '@nestjs/swagger';

export class AddMemberDto {
  userId: string;
  admin?: boolean;
  write?: boolean;
  delete?: boolean;
}

export class AddMembersDto {
  members: AddMemberDto[];
}

export class RemoveMemberDto {
  userId: string;
}

export class UpdateMemberDto extends PartialType(AddMemberDto) {}

export class CreateGroupDto {
  groupId: string;
  groupName: string;
  members?: AddMemberDto[];
}
