import { PartialType } from '@nestjs/swagger';

export class CreateAlbumDto {}

export class UpdateAlbumDto extends PartialType(CreateAlbumDto) {}
