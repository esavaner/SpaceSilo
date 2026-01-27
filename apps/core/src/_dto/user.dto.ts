// import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from '@nestjs/swagger';
// import { type JsonValue } from '@prisma/client/runtime/library';
// import { PrismaModel } from 'src/_gen/prisma-class';

// class FixUserSettings extends OmitType(PrismaModel.User, ['settings']) {
//   @ApiPropertyOptional({ type: Object })
//   settings?: JsonValue | null;
// }

// /* ------------------------- Requests -------------------------- */

// export class CreateUserDto extends PickType(FixUserSettings, ['name', 'email', 'password', 'role']) {
//   @ApiProperty({ type: String })
//   groupId: string;
// }

// export class UpdateUserDto extends PartialType(CreateUserDto) {}

// /* ------------------------- Responses ------------------------- */

// export class GetUserDto extends FixUserSettings {}

// export class SearchUserDto extends OmitType(FixUserSettings, ['password']) {}

import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from '@nestjs/swagger';

class FixUserSettings {}

/* ------------------------- Requests -------------------------- */

export class CreateUserDto extends FixUserSettings {
  @ApiProperty({ type: String })
  groupId: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

/* ------------------------- Responses ------------------------- */

export class GetUserDto extends FixUserSettings {}

export class SearchUserDto extends FixUserSettings {}
