import { IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryDto {
  @IsPositive()
  @IsOptional()
  take?: number;

  @IsPositive()
  @IsOptional()
  skip?: number;
}
