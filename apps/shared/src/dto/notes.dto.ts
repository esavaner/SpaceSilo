import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/* ------------------------- Requests -------------------------- */

export class CreateNoteRequest {
  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class UpdateNoteRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  groupId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}

/* ------------------------- Responses ------------------------- */

export class NoteResponse {
  @IsString()
  id!: string;

  @IsString()
  groupId!: string;

  @IsString()
  ownerId!: string;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsString()
  content!: string;

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;

  @IsOptional()
  @IsDate()
  deletedAt?: Date | null;
}
