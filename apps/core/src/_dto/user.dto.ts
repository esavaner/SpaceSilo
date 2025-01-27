import { ApiPropertyOptional, IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';
import { PrismaModel } from 'src/_gen/prisma-class';

class FixUserSettings extends OmitType(PrismaModel.User, ['settings']) {
  @ApiPropertyOptional({ type: Object })
  settings?: JsonValue | null;
}

/* ------------------------- Requests -------------------------- */

export class CreateUserDto extends IntersectionType(
  PickType(FixUserSettings, ['name', 'email', 'password', 'role']),
  PickType(PrismaModel.Group, ['id'])
) {}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

/* ------------------------- Responses ------------------------- */

export class GetUserDto extends FixUserSettings {}

export class SearchUserDto extends OmitType(FixUserSettings, ['password']) {}
