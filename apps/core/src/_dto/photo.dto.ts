import { PartialType } from '@nestjs/swagger';

export class CreatePhotoDto {}

export class UpdatePhotoDto extends PartialType(CreatePhotoDto) {}
