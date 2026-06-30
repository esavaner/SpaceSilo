import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  type BackupResponse,
  type CreateBackupRequest,
  type TokenPayload,
  type UpdateBackupRequest,
} from '@repo/shared';
import { User } from '@/decorators/user.decorator';
import { BackupsService } from '@/services/backups.service';

@Controller('backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get()
  findAll(@User() user: TokenPayload): Promise<BackupResponse[]> {
    return this.backupsService.findAll(user);
  }

  @Post('incoming')
  createIncoming(@Body() dto: CreateBackupRequest, @User() user: TokenPayload): Promise<BackupResponse> {
    return this.backupsService.createIncoming(dto, user);
  }

  @Post('outgoing')
  createOutgoing(@Body() dto: CreateBackupRequest, @User() user: TokenPayload): Promise<BackupResponse> {
    return this.backupsService.createOutgoing(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBackupRequest,
    @User() user: TokenPayload
  ): Promise<BackupResponse> {
    return this.backupsService.update(id, dto, user);
  }

  @Post(':id/trigger')
  trigger(@Param('id') id: string, @User() user: TokenPayload): Promise<BackupResponse> {
    return this.backupsService.trigger(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: TokenPayload): Promise<BackupResponse> {
    return this.backupsService.remove(id, user);
  }
}
