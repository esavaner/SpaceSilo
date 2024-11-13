import { PartialType } from '@nestjs/swagger';

export class CreateNoteDto {}

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
