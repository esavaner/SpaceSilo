import { IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { PrismaModel } from 'src/_gen/prisma-class';
import { SearchUserDto } from './user.dto';

/* ------------------------- Requests -------------------------- */

export class AddMemberDto extends PickType(PrismaModel.GroupMember, ['userId', 'access']) {}

export class AddMembersDto {
  members: AddMemberDto[];
}

export class RemoveMemberDto extends PickType(PrismaModel.GroupMember, ['userId']) {}

export class UpdateMemberDto extends PartialType(AddMemberDto) {}

export class CreateGroupDto extends PickType(IntersectionType(PrismaModel.Group, PrismaModel.GroupRelations), [
  'id',
  'name',
  'members',
  'personal',
]) {}

/* ------------------------- Responses ------------------------- */

class GroupMemberWithUser extends PrismaModel.GroupMember {
  user: SearchUserDto;
}

export class GetGroupDto extends PrismaModel.Group {
  members: GroupMemberWithUser[];
}
