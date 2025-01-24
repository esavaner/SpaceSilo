import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { PrismaModel } from 'src/_gen/prisma-class';

/* ------------------------- Requests -------------------------- */

export class AddMemberDto extends PickType(PrismaModel.GroupMember, ['userId', 'access'] as const) {}

export class AddMembersDto {
  members: AddMemberDto[];
}

export class RemoveMemberDto extends PickType(PrismaModel.GroupMember, ['userId'] as const) {}

export class UpdateMemberDto extends PartialType(AddMemberDto) {}

export class CreateGroupDto extends PickType(IntersectionType(PrismaModel.Group, PrismaModel.GroupRelations), [
  'id',
  'name',
  'members',
] as const) {}

/* ------------------------- Responses ------------------------- */

export class GetGroupDto extends IntersectionType(
  PrismaModel.Group,
  PickType(PrismaModel.GroupRelations, ['members'] as const)
) {}
