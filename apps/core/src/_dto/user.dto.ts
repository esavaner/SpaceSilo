import { OmitType, PartialType, PickType } from '@nestjs/swagger';
import { PrismaModel } from 'src/_gen/prisma-class';

/* ------------------------- Requests -------------------------- */

export class CreateUserDto extends PickType(PrismaModel.User, ['name', 'email', 'password', 'role']) {}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

/* ------------------------- Responses ------------------------- */

export class GetUserDto extends PrismaModel.User {}

export class SearchUserDto extends OmitType(PrismaModel.User, ['password']) {}
