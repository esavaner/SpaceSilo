import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Group {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ type: String })
  ownerId: string;

  @ApiPropertyOptional({ type: Boolean })
  personal?: boolean;

  @ApiPropertyOptional({ type: String })
  color?: string;
}
