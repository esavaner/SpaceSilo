import { PartialType } from '@nestjs/swagger';

export class CreateGroupDto {}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
