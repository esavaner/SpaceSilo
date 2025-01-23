import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Photo {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  url: string;

  @ApiProperty({ type: String })
  path: string;

  @ApiProperty({ type: String })
  thumbnailPath: string;

  @ApiProperty({ type: String })
  hash: string;

  @ApiPropertyOptional({ type: Object })
  metadata?: object;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ type: String })
  ownerId: string;
}
