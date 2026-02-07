// import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from '@nestjs/swagger';
// import { type JsonValue } from '@prisma/client/runtime/library';
// import { PrismaModel } from '@/_gen/prisma-class';

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

export {};
