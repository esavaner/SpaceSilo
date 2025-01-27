import { IntersectionType, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { PrismaModel } from 'src/_gen/prisma-class';

/* ------------------------- Requests -------------------------- */

export class CreateUserDto extends IntersectionType(
  PickType(PrismaModel.User, ['name', 'email', 'password', 'role']),
  PickType(PrismaModel.Group, ['id'])
) {}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

/* ------------------------- Responses ------------------------- */

export class GetUserDto extends PrismaModel.User {}

export class SearchUserDto extends OmitType(PrismaModel.User, ['password']) {}
