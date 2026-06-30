import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';

import { BackupDirection } from '../prisma/generated/client';

export class CreateBackupRequest {
  @IsOptional()
  @IsString()
  pairId?: string;

  @IsString()
  @IsNotEmpty()
  pairSecret!: string;

  @IsString()
  @IsNotEmpty()
  schedule!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  copyPhotos?: boolean;

  @IsOptional()
  @IsBoolean()
  copyFiles?: boolean;

  @IsOptional()
  @IsBoolean()
  copyNotes?: boolean;

  @IsString()
  @IsNotEmpty()
  sourceServerLabel!: string;

  @IsUrl({ require_tld: false })
  sourceServerBaseUrl!: string;

  @IsString()
  @IsNotEmpty()
  sourceServerKey!: string;

  @IsString()
  @IsNotEmpty()
  destinationServerLabel!: string;

  @IsUrl({ require_tld: false })
  destinationServerBaseUrl!: string;

  @IsString()
  @IsNotEmpty()
  destinationServerKey!: string;

  @IsOptional()
  @IsString()
  destinationPath?: string;

  @IsOptional()
  @IsString()
  remoteConfigId?: string;
}

export class UpdateBackupRequest {
  @IsOptional()
  @IsString()
  pairSecret?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  copyPhotos?: boolean;

  @IsOptional()
  @IsBoolean()
  copyFiles?: boolean;

  @IsOptional()
  @IsBoolean()
  copyNotes?: boolean;

  @IsOptional()
  @IsString()
  sourceServerLabel?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  sourceServerBaseUrl?: string;

  @IsOptional()
  @IsString()
  sourceServerKey?: string;

  @IsOptional()
  @IsString()
  destinationServerLabel?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  destinationServerBaseUrl?: string;

  @IsOptional()
  @IsString()
  destinationServerKey?: string;

  @IsOptional()
  @IsString()
  destinationPath?: string;

  @IsOptional()
  @IsString()
  remoteConfigId?: string;
}

export class BackupMediaStatsResponse {
  @IsInt()
  @Min(0)
  count!: number;

  @IsInt()
  @Min(0)
  sizeBytes!: number;
}

export class BackupStatsResponse {
  @ValidateNested()
  @Type(() => BackupMediaStatsResponse)
  photos!: BackupMediaStatsResponse;

  @ValidateNested()
  @Type(() => BackupMediaStatsResponse)
  files!: BackupMediaStatsResponse;

  @ValidateNested()
  @Type(() => BackupMediaStatsResponse)
  notes!: BackupMediaStatsResponse;

  @IsInt()
  @Min(0)
  totalCount!: number;

  @IsInt()
  @Min(0)
  totalSizeBytes!: number;
}

export class BackupResponse {
  @IsString()
  id!: string;

  @IsString()
  pairId!: string;

  @IsEnum(BackupDirection)
  direction!: BackupDirection;

  @IsBoolean()
  active!: boolean;

  @IsString()
  schedule!: string;

  @IsBoolean()
  copyPhotos!: boolean;

  @IsBoolean()
  copyFiles!: boolean;

  @IsBoolean()
  copyNotes!: boolean;

  @IsString()
  sourceServerLabel!: string;

  @IsUrl({ require_tld: false })
  sourceServerBaseUrl!: string;

  @IsString()
  sourceServerKey!: string;

  @IsString()
  destinationServerLabel!: string;

  @IsUrl({ require_tld: false })
  destinationServerBaseUrl!: string;

  @IsString()
  destinationServerKey!: string;

  @IsOptional()
  @IsString()
  destinationPath?: string | null;

  @IsOptional()
  @IsString()
  remoteConfigId?: string | null;

  @IsInt()
  @Min(0)
  runCount!: number;

  @IsBoolean()
  running!: boolean;

  @IsOptional()
  @IsDate()
  createdAt!: Date;

  @IsOptional()
  @IsDate()
  updatedAt!: Date;

  @IsOptional()
  @IsDate()
  lastRunAt?: Date | null;

  @IsOptional()
  @IsDate()
  lastStartedAt?: Date | null;

  @IsOptional()
  @IsDate()
  lastFinishedAt?: Date | null;

  @IsOptional()
  @IsDate()
  lastSuccessAt?: Date | null;

  @IsOptional()
  @IsDate()
  nextRunAt?: Date | null;

  @IsOptional()
  @IsString()
  lastError?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => BackupStatsResponse)
  stats?: BackupStatsResponse | null;
}
