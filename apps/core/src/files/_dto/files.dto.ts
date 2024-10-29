import { PartialType } from '@nestjs/swagger';

export class CreateFileDto {}

export class UpdateFileDto extends PartialType(CreateFileDto) {}
