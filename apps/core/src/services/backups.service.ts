import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BackupDirection,
  type BackupResponse,
  type CreateBackupRequest,
  type Prisma,
  type TokenPayload,
  type UpdateBackupRequest,
} from '@repo/shared';
import { CronExpressionParser } from 'cron-parser';
import { spawn } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '@/common/prisma.service';

type MediaKey = 'photos' | 'files' | 'notes';

type MediaStats = {
  count: number;
  sizeBytes: number;
};

type BackupStatsShape = {
  photos: MediaStats;
  files: MediaStats;
  notes: MediaStats;
  totalCount: number;
  totalSizeBytes: number;
};

type NotesSnapshot = {
  rootPath: string;
  count: number;
  sizeBytes: number;
};

type BackupPlan = {
  key: MediaKey;
  sourcePath: string;
  targetPath: string;
  stats: MediaStats;
  excludePatterns?: string[];
};

const BACKUP_SELECT = {
  id: true,
  pairId: true,
  pairSecret: true,
  direction: true,
  active: true,
  schedule: true,
  copyPhotos: true,
  copyFiles: true,
  copyNotes: true,
  sourceServerLabel: true,
  sourceServerBaseUrl: true,
  sourceServerKey: true,
  destinationServerLabel: true,
  destinationServerBaseUrl: true,
  destinationServerKey: true,
  destinationPath: true,
  remoteConfigId: true,
  runCount: true,
  running: true,
  lastRunAt: true,
  lastStartedAt: true,
  lastFinishedAt: true,
  lastSuccessAt: true,
  lastError: true,
  nextRunAt: true,
  lastStats: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BackupSelect;

type BackupRecord = Prisma.BackupGetPayload<{
  select: typeof BACKUP_SELECT;
}>;

const SCHEDULER_INTERVAL_MS = 30_000;

@Injectable()
export class BackupsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupsService.name);
  private scheduleTimer?: NodeJS.Timeout;
  private scheduleTickRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.scheduleTimer = setInterval(() => {
      void this.runDueBackups();
    }, SCHEDULER_INTERVAL_MS);

    void this.runDueBackups();
  }

  onModuleDestroy() {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
    }
  }

  async findAll(user: TokenPayload): Promise<BackupResponse[]> {
    this.assertAdmin(user);

    const backups = await this.prisma.backup.findMany({
      select: BACKUP_SELECT,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    });

    const hydrated = await Promise.all(
      backups.map((backup) =>
        backup.direction === BackupDirection.incoming ? this.refreshIncomingStats(backup) : Promise.resolve(backup)
      )
    );

    return hydrated
      .sort((left, right) => {
        const directionDelta = this.directionRank(left.direction) - this.directionRank(right.direction);
        if (directionDelta !== 0) {
          return directionDelta;
        }

        return right.updatedAt.getTime() - left.updatedAt.getTime();
      })
      .map((backup) => this.toBackupResponse(backup));
  }

  async createIncoming(dto: CreateBackupRequest, user: TokenPayload): Promise<BackupResponse> {
    this.assertAdmin(user);

    const normalized = this.normalizeCreateRequest(dto);
    await this.assertPairAvailable(
      BackupDirection.incoming,
      normalized.sourceServerKey,
      normalized.destinationServerKey
    );

    const destinationPath = this.ensureIncomingDestinationPath(normalized.sourceServerKey);

    const created = await this.prisma.backup.create({
      data: {
        pairId: normalized.pairId,
        pairSecret: normalized.pairSecret,
        direction: BackupDirection.incoming,
        active: normalized.active,
        schedule: normalized.schedule,
        copyPhotos: normalized.copyPhotos,
        copyFiles: normalized.copyFiles,
        copyNotes: normalized.copyNotes,
        sourceServerLabel: normalized.sourceServerLabel,
        sourceServerBaseUrl: normalized.sourceServerBaseUrl,
        sourceServerKey: normalized.sourceServerKey,
        destinationServerLabel: normalized.destinationServerLabel,
        destinationServerBaseUrl: normalized.destinationServerBaseUrl,
        destinationServerKey: normalized.destinationServerKey,
        destinationPath,
        remoteConfigId: normalized.remoteConfigId,
        nextRunAt: normalized.active ? this.computeNextRun(normalized.schedule) : null,
        createdById: user.sub,
      },
      select: BACKUP_SELECT,
    });

    const refreshed = await this.refreshIncomingStats(created);
    return this.toBackupResponse(refreshed);
  }

  async createOutgoing(dto: CreateBackupRequest, user: TokenPayload): Promise<BackupResponse> {
    this.assertAdmin(user);

    const normalized = this.normalizeCreateRequest(dto);
    if (!normalized.destinationPath) {
      throw new BadRequestException('Destination path is required for outgoing backups');
    }

    await this.assertPairAvailable(
      BackupDirection.outgoing,
      normalized.sourceServerKey,
      normalized.destinationServerKey
    );

    const created = await this.prisma.backup.create({
      data: {
        pairId: normalized.pairId,
        pairSecret: normalized.pairSecret,
        direction: BackupDirection.outgoing,
        active: normalized.active,
        schedule: normalized.schedule,
        copyPhotos: normalized.copyPhotos,
        copyFiles: normalized.copyFiles,
        copyNotes: normalized.copyNotes,
        sourceServerLabel: normalized.sourceServerLabel,
        sourceServerBaseUrl: normalized.sourceServerBaseUrl,
        sourceServerKey: normalized.sourceServerKey,
        destinationServerLabel: normalized.destinationServerLabel,
        destinationServerBaseUrl: normalized.destinationServerBaseUrl,
        destinationServerKey: normalized.destinationServerKey,
        destinationPath: normalized.destinationPath,
        remoteConfigId: normalized.remoteConfigId,
        nextRunAt: normalized.active ? this.computeNextRun(normalized.schedule) : null,
        createdById: user.sub,
      },
      select: BACKUP_SELECT,
    });

    return this.toBackupResponse(created);
  }

  async update(id: string, dto: UpdateBackupRequest, user: TokenPayload): Promise<BackupResponse> {
    this.assertAdmin(user);

    const backup = await this.getBackupOrThrow(id);
    const normalized = this.normalizeUpdateRequest(backup, dto);

    await this.assertPairAvailable(
      backup.direction,
      normalized.sourceServerKey,
      normalized.destinationServerKey,
      backup.id
    );

    const destinationPath =
      backup.direction === BackupDirection.incoming
        ? this.ensureIncomingDestinationPath(normalized.sourceServerKey)
        : normalized.destinationPath;

    if (backup.direction === BackupDirection.outgoing && !destinationPath) {
      throw new BadRequestException('Destination path is required for outgoing backups');
    }

    const updated = await this.prisma.backup.update({
      where: { id },
      data: {
        pairSecret: normalized.pairSecret,
        active: normalized.active,
        schedule: normalized.schedule,
        copyPhotos: normalized.copyPhotos,
        copyFiles: normalized.copyFiles,
        copyNotes: normalized.copyNotes,
        sourceServerLabel: normalized.sourceServerLabel,
        sourceServerBaseUrl: normalized.sourceServerBaseUrl,
        sourceServerKey: normalized.sourceServerKey,
        destinationServerLabel: normalized.destinationServerLabel,
        destinationServerBaseUrl: normalized.destinationServerBaseUrl,
        destinationServerKey: normalized.destinationServerKey,
        destinationPath,
        remoteConfigId: normalized.remoteConfigId,
        nextRunAt: normalized.active ? this.computeNextRun(normalized.schedule) : null,
      },
      select: BACKUP_SELECT,
    });

    if (updated.direction === BackupDirection.incoming) {
      const refreshed = await this.refreshIncomingStats(updated);
      return this.toBackupResponse(refreshed);
    }

    return this.toBackupResponse(updated);
  }

  async remove(id: string, user: TokenPayload): Promise<BackupResponse> {
    this.assertAdmin(user);

    const backup = await this.getBackupOrThrow(id);
    const deleted = await this.prisma.backup.delete({
      where: { id },
      select: BACKUP_SELECT,
    });

    if (backup.direction === BackupDirection.incoming && backup.destinationPath) {
      fs.rmSync(backup.destinationPath, { recursive: true, force: true });
    }

    return this.toBackupResponse(deleted);
  }

  async trigger(id: string, user: TokenPayload): Promise<BackupResponse> {
    this.assertAdmin(user);

    const backup = await this.getBackupOrThrow(id);
    if (backup.direction !== BackupDirection.outgoing) {
      throw new BadRequestException('Only outgoing backups can be triggered manually');
    }

    const updated = await this.executeBackupById(id, true);
    if (!updated) {
      throw new ConflictException('Backup is already running');
    }

    return this.toBackupResponse(updated);
  }

  private assertAdmin(user: TokenPayload) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('You are not allowed to manage backups');
    }
  }

  private directionRank(direction: BackupDirection) {
    return direction === BackupDirection.outgoing ? 0 : 1;
  }

  private async runDueBackups() {
    if (this.scheduleTickRunning) {
      return;
    }

    this.scheduleTickRunning = true;

    try {
      const dueBackups = await this.prisma.backup.findMany({
        where: {
          direction: BackupDirection.outgoing,
          active: true,
          running: false,
          nextRunAt: { lte: new Date() },
        },
        select: { id: true },
        orderBy: [{ nextRunAt: 'asc' }, { updatedAt: 'asc' }],
      });

      for (const backup of dueBackups) {
        try {
          await this.executeBackupById(backup.id, false);
        } catch (error) {
          this.logger.error(`Scheduled backup ${backup.id} failed`, error instanceof Error ? error.stack : undefined);
        }
      }
    } finally {
      this.scheduleTickRunning = false;
    }
  }

  private async executeBackupById(id: string, failIfRunning: boolean): Promise<BackupRecord | null> {
    const startedAt = new Date();
    const claimed = await this.prisma.backup.updateMany({
      where: {
        id,
        direction: BackupDirection.outgoing,
        running: false,
      },
      data: {
        running: true,
        lastRunAt: startedAt,
        lastStartedAt: startedAt,
        lastError: null,
      },
    });

    if (claimed.count === 0) {
      if (failIfRunning) {
        throw new ConflictException('Backup is already running');
      }

      return null;
    }

    const backup = await this.getBackupOrThrow(id);
    if (!backup.destinationPath) {
      await this.failBackupRun(backup, startedAt, 'Destination path is not configured');
      throw new BadRequestException('Destination path is not configured');
    }

    try {
      const plans = await this.buildBackupPlans(backup);

      for (const plan of plans) {
        await this.runRsync(plan.sourcePath, backup.destinationServerBaseUrl, plan.targetPath, plan.excludePatterns);
      }

      const finishedAt = new Date();
      const stats = this.buildStatsSummary(
        plans.find((plan) => plan.key === 'photos')?.stats,
        plans.find((plan) => plan.key === 'files')?.stats,
        plans.find((plan) => plan.key === 'notes')?.stats
      );

      const updated = await this.prisma.backup.update({
        where: { id },
        data: {
          runCount: { increment: 1 },
          running: false,
          lastFinishedAt: finishedAt,
          lastSuccessAt: finishedAt,
          nextRunAt: backup.active ? this.tryComputeNextRun(backup.schedule, finishedAt) : null,
          lastError: null,
          lastStats: this.toStatsJson(stats),
        },
        select: BACKUP_SELECT,
      });

      return updated;
    } catch (error) {
      const message = this.toErrorMessage(error);
      await this.failBackupRun(backup, startedAt, message);
      throw error;
    }
  }

  private async failBackupRun(backup: BackupRecord, startedAt: Date, message: string) {
    const finishedAt = new Date();

    await this.prisma.backup.update({
      where: { id: backup.id },
      data: {
        running: false,
        lastRunAt: startedAt,
        lastStartedAt: startedAt,
        lastFinishedAt: finishedAt,
        nextRunAt: backup.active ? this.tryComputeNextRun(backup.schedule, finishedAt) : null,
        lastError: message,
      },
    });
  }

  private async buildBackupPlans(backup: BackupRecord): Promise<BackupPlan[]> {
    const plans: BackupPlan[] = [];

    if (backup.copyPhotos) {
      const sourcePath = this.ensureDirectory(process.env.STORAGE_PATH!);
      plans.push({
        key: 'photos',
        sourcePath,
        targetPath: path.join(backup.destinationPath!, 'photos'),
        stats: this.collectDirectoryStats(sourcePath, ['backups']),
        excludePatterns: ['backups'],
      });
    }

    if (backup.copyFiles) {
      const sourcePath = this.ensureDirectory(process.env.FILES_PATH!);
      plans.push({
        key: 'files',
        sourcePath,
        targetPath: path.join(backup.destinationPath!, 'files'),
        stats: this.collectDirectoryStats(sourcePath),
      });
    }

    if (backup.copyNotes) {
      const snapshot = await this.prepareNotesSnapshot(backup.pairId);
      plans.push({
        key: 'notes',
        sourcePath: snapshot.rootPath,
        targetPath: path.join(backup.destinationPath!, 'notes'),
        stats: { count: snapshot.count, sizeBytes: snapshot.sizeBytes },
      });
    }

    if (plans.length === 0) {
      throw new BadRequestException('Select at least one media type for a backup');
    }

    return plans;
  }

  private async prepareNotesSnapshot(pairId: string): Promise<NotesSnapshot> {
    const notes = await this.prisma.note.findMany({
      where: { deletedAt: null },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        groupId: true,
        ownerId: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const rootPath = path.join(process.env.APPDATA_PATH!, 'backup-staging', pairId, 'notes');
    const dataPath = path.join(rootPath, 'data');
    fs.rmSync(rootPath, { recursive: true, force: true });
    fs.mkdirSync(dataPath, { recursive: true });

    for (const note of notes) {
      const notePath = path.join(dataPath, `${note.id}.json`);
      fs.writeFileSync(notePath, JSON.stringify(note, null, 2));
    }

    fs.writeFileSync(
      path.join(rootPath, 'manifest.json'),
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          noteCount: notes.length,
        },
        null,
        2
      )
    );

    return {
      rootPath,
      count: notes.length,
      sizeBytes: this.measureDirectorySize(rootPath),
    };
  }

  private async runRsync(
    sourcePath: string,
    destinationBaseUrl: string,
    targetPath: string,
    excludePatterns: string[] = []
  ) {
    const rsyncPath = process.env.RSYNC_BIN?.trim() || 'rsync';
    const args = ['-a', '--delete'];

    for (const pattern of excludePatterns) {
      args.push('--exclude', pattern);
    }

    const sshPort = process.env.BACKUP_RSYNC_SSH_PORT?.trim();
    if (sshPort) {
      args.push('-e', `ssh -p ${sshPort}`);
    }

    args.push(this.toRsyncPath(sourcePath, true));
    args.push(this.buildRemoteTarget(destinationBaseUrl, targetPath));

    await new Promise<void>((resolve, reject) => {
      const child = spawn(rsyncPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') {
          reject(new BadRequestException('rsync is not installed on this server'));
          return;
        }

        reject(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new BadRequestException(stderr.trim() || `rsync exited with code ${code}`));
      });
    });
  }

  private buildRemoteTarget(destinationBaseUrl: string, targetPath: string) {
    const destination = new URL(this.normalizeUrl(destinationBaseUrl));
    const sshUser = process.env.BACKUP_RSYNC_SSH_USER?.trim();
    const host = sshUser ? `${sshUser}@${destination.hostname}` : destination.hostname;
    return `${host}:${this.toRsyncPath(targetPath, true)}`;
  }

  private async refreshIncomingStats(backup: BackupRecord) {
    const stats = this.collectIncomingStats(backup.destinationPath);
    const currentStats = this.parseStats(backup.lastStats);

    if (this.areStatsEqual(currentStats, stats)) {
      return backup;
    }

    return this.prisma.backup.update({
      where: { id: backup.id },
      data: {
        lastStats: this.toStatsJson(stats),
      },
      select: BACKUP_SELECT,
    });
  }

  private collectIncomingStats(destinationPath?: string | null) {
    if (!destinationPath) {
      return this.buildStatsSummary();
    }

    const photos = this.collectDirectoryStats(path.join(destinationPath, 'photos'));
    const files = this.collectDirectoryStats(path.join(destinationPath, 'files'));
    const notes = {
      count: this.collectDirectoryStats(path.join(destinationPath, 'notes', 'data')).count,
      sizeBytes: this.measureDirectorySize(path.join(destinationPath, 'notes')),
    } satisfies MediaStats;

    return this.buildStatsSummary(photos, files, notes);
  }

  private collectDirectoryStats(dirPath: string, excludedTopLevelEntries: string[] = []): MediaStats {
    if (!fs.existsSync(dirPath)) {
      return { count: 0, sizeBytes: 0 };
    }

    let count = 0;
    let sizeBytes = 0;

    const walk = (currentPath: string, depth: number) => {
      for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
        if (depth === 0 && excludedTopLevelEntries.includes(entry.name)) {
          continue;
        }

        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
          continue;
        }

        const stats = fs.statSync(fullPath);
        count += 1;
        sizeBytes += stats.size;
      }
    };

    walk(dirPath, 0);

    return { count, sizeBytes };
  }

  private measureDirectorySize(dirPath: string) {
    return this.collectDirectoryStats(dirPath).sizeBytes;
  }

  private normalizeCreateRequest(dto: CreateBackupRequest) {
    const schedule = this.normalizeSchedule(dto.schedule);
    const media = this.normalizeMediaSelection(dto.copyPhotos, dto.copyFiles, dto.copyNotes);
    const sourceServerBaseUrl = this.normalizeUrl(dto.sourceServerBaseUrl);
    const destinationServerBaseUrl = this.normalizeUrl(dto.destinationServerBaseUrl);
    const sourceServerKey = this.normalizeServerKey(dto.sourceServerKey);
    const destinationServerKey = this.normalizeServerKey(dto.destinationServerKey);
    this.assertDistinctServers(sourceServerBaseUrl, destinationServerBaseUrl, sourceServerKey, destinationServerKey);

    return {
      pairId: dto.pairId?.trim() || crypto.randomUUID(),
      pairSecret: this.requireText(dto.pairSecret, 'Pair secret'),
      schedule,
      active: dto.active ?? true,
      copyPhotos: media.copyPhotos,
      copyFiles: media.copyFiles,
      copyNotes: media.copyNotes,
      sourceServerLabel: this.requireText(dto.sourceServerLabel, 'Source server label'),
      sourceServerBaseUrl,
      sourceServerKey,
      destinationServerLabel: this.requireText(dto.destinationServerLabel, 'Destination server label'),
      destinationServerBaseUrl,
      destinationServerKey,
      destinationPath: dto.destinationPath?.trim() || null,
      remoteConfigId: dto.remoteConfigId?.trim() || null,
    };
  }

  private normalizeUpdateRequest(backup: BackupRecord, dto: UpdateBackupRequest) {
    const schedule = this.normalizeSchedule(dto.schedule ?? backup.schedule);
    const media = this.normalizeMediaSelection(
      dto.copyPhotos ?? backup.copyPhotos,
      dto.copyFiles ?? backup.copyFiles,
      dto.copyNotes ?? backup.copyNotes
    );
    const sourceServerBaseUrl = this.normalizeUrl(dto.sourceServerBaseUrl ?? backup.sourceServerBaseUrl);
    const destinationServerBaseUrl = this.normalizeUrl(dto.destinationServerBaseUrl ?? backup.destinationServerBaseUrl);
    const sourceServerKey = this.normalizeServerKey(dto.sourceServerKey ?? backup.sourceServerKey);
    const destinationServerKey = this.normalizeServerKey(dto.destinationServerKey ?? backup.destinationServerKey);
    this.assertDistinctServers(sourceServerBaseUrl, destinationServerBaseUrl, sourceServerKey, destinationServerKey);

    return {
      pairSecret: dto.pairSecret?.trim() || backup.pairSecret,
      schedule,
      active: dto.active ?? backup.active,
      copyPhotos: media.copyPhotos,
      copyFiles: media.copyFiles,
      copyNotes: media.copyNotes,
      sourceServerLabel: dto.sourceServerLabel?.trim() || backup.sourceServerLabel,
      sourceServerBaseUrl,
      sourceServerKey,
      destinationServerLabel: dto.destinationServerLabel?.trim() || backup.destinationServerLabel,
      destinationServerBaseUrl,
      destinationServerKey,
      destinationPath: dto.destinationPath === undefined ? backup.destinationPath : dto.destinationPath.trim(),
      remoteConfigId: dto.remoteConfigId === undefined ? backup.remoteConfigId : dto.remoteConfigId.trim() || null,
    };
  }

  private normalizeSchedule(schedule: string) {
    const normalized = this.requireText(schedule, 'Schedule');

    try {
      CronExpressionParser.parse(normalized);
    } catch {
      throw new BadRequestException('Schedule must be a valid cron expression');
    }

    return normalized;
  }

  private normalizeMediaSelection(copyPhotos = false, copyFiles = false, copyNotes = false) {
    if (!copyPhotos && !copyFiles && !copyNotes) {
      throw new BadRequestException('Select at least one media type for a backup');
    }

    return { copyPhotos, copyFiles, copyNotes };
  }

  private normalizeUrl(value: string) {
    const normalized = this.requireText(value, 'Server URL');

    try {
      const url = new URL(normalized);
      url.pathname = url.pathname.replace(/\/+$/, '') || '/';
      return url.toString().replace(/\/$/, '');
    } catch {
      throw new BadRequestException(`Invalid server URL: ${normalized}`);
    }
  }

  private normalizeServerKey(value: string) {
    const normalized = this.requireText(value, 'Server key')
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!normalized) {
      throw new BadRequestException('Server key is required');
    }

    return normalized;
  }

  private assertDistinctServers(
    sourceServerBaseUrl: string,
    destinationServerBaseUrl: string,
    sourceServerKey: string,
    destinationServerKey: string
  ) {
    if (sourceServerBaseUrl === destinationServerBaseUrl || sourceServerKey === destinationServerKey) {
      throw new BadRequestException('Source and destination servers must be different');
    }
  }

  private async assertPairAvailable(
    direction: BackupDirection,
    sourceServerKey: string,
    destinationServerKey: string,
    ignoreId?: string
  ) {
    const existing = await this.prisma.backup.findFirst({
      where: {
        direction,
        sourceServerKey,
        destinationServerKey,
        ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A backup for this source and destination already exists');
    }
  }

  private ensureIncomingDestinationPath(sourceServerKey: string) {
    const rootPath = path.join(process.env.STORAGE_PATH!, 'backups', sourceServerKey);
    this.ensureDirectory(path.join(rootPath, 'photos'));
    this.ensureDirectory(path.join(rootPath, 'files'));
    this.ensureDirectory(path.join(rootPath, 'notes', 'data'));
    return rootPath;
  }

  private ensureDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    return dirPath;
  }

  private computeNextRun(schedule: string, currentDate = new Date()) {
    try {
      return CronExpressionParser.parse(schedule, { currentDate }).next().toDate();
    } catch {
      throw new BadRequestException('Schedule must be a valid cron expression');
    }
  }

  private tryComputeNextRun(schedule: string, currentDate = new Date()) {
    try {
      return CronExpressionParser.parse(schedule, { currentDate }).next().toDate();
    } catch {
      this.logger.warn(`Unable to compute next run for schedule "${schedule}"`);
      return null;
    }
  }

  private async getBackupOrThrow(id: string) {
    const backup = await this.prisma.backup.findUnique({
      where: { id },
      select: BACKUP_SELECT,
    });

    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    return backup;
  }

  private buildStatsSummary(
    photos: MediaStats = { count: 0, sizeBytes: 0 },
    files: MediaStats = { count: 0, sizeBytes: 0 },
    notes: MediaStats = { count: 0, sizeBytes: 0 }
  ): BackupStatsShape {
    return {
      photos,
      files,
      notes,
      totalCount: photos.count + files.count + notes.count,
      totalSizeBytes: photos.sizeBytes + files.sizeBytes + notes.sizeBytes,
    };
  }

  private parseStats(value: Prisma.JsonValue | null): BackupStatsShape | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const stats = value as Record<string, unknown>;
    const parseMedia = (mediaKey: MediaKey): MediaStats | null => {
      const media = stats[mediaKey];
      if (!media || typeof media !== 'object' || Array.isArray(media)) {
        return null;
      }

      const { count, sizeBytes } = media as Record<string, unknown>;
      if (typeof count !== 'number' || typeof sizeBytes !== 'number') {
        return null;
      }

      return { count, sizeBytes };
    };

    const photos = parseMedia('photos');
    const files = parseMedia('files');
    const notes = parseMedia('notes');
    const totalCount = stats.totalCount;
    const totalSizeBytes = stats.totalSizeBytes;

    if (!photos || !files || !notes || typeof totalCount !== 'number' || typeof totalSizeBytes !== 'number') {
      return null;
    }

    return { photos, files, notes, totalCount, totalSizeBytes };
  }

  private areStatsEqual(left: BackupStatsShape | null, right: BackupStatsShape) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private toStatsJson(stats: BackupStatsShape): Prisma.InputJsonValue {
    return {
      photos: { count: stats.photos.count, sizeBytes: stats.photos.sizeBytes },
      files: { count: stats.files.count, sizeBytes: stats.files.sizeBytes },
      notes: { count: stats.notes.count, sizeBytes: stats.notes.sizeBytes },
      totalCount: stats.totalCount,
      totalSizeBytes: stats.totalSizeBytes,
    } satisfies Prisma.InputJsonValue;
  }

  private toBackupResponse(backup: BackupRecord): BackupResponse {
    const stats = this.parseStats(backup.lastStats);

    return {
      id: backup.id,
      pairId: backup.pairId,
      direction: backup.direction,
      active: backup.active,
      schedule: backup.schedule,
      copyPhotos: backup.copyPhotos,
      copyFiles: backup.copyFiles,
      copyNotes: backup.copyNotes,
      sourceServerLabel: backup.sourceServerLabel,
      sourceServerBaseUrl: backup.sourceServerBaseUrl,
      sourceServerKey: backup.sourceServerKey,
      destinationServerLabel: backup.destinationServerLabel,
      destinationServerBaseUrl: backup.destinationServerBaseUrl,
      destinationServerKey: backup.destinationServerKey,
      destinationPath: backup.destinationPath,
      remoteConfigId: backup.remoteConfigId,
      runCount: backup.runCount,
      running: backup.running,
      createdAt: backup.createdAt,
      updatedAt: backup.updatedAt,
      lastRunAt: backup.lastRunAt,
      lastStartedAt: backup.lastStartedAt,
      lastFinishedAt: backup.lastFinishedAt,
      lastSuccessAt: backup.lastSuccessAt,
      nextRunAt: backup.nextRunAt,
      lastError: backup.lastError,
      stats: stats
        ? {
            photos: stats.photos,
            files: stats.files,
            notes: stats.notes,
            totalCount: stats.totalCount,
            totalSizeBytes: stats.totalSizeBytes,
          }
        : null,
    };
  }

  private requireText(value: string | undefined | null, label: string) {
    const normalized = value?.trim();
    if (!normalized) {
      throw new BadRequestException(`${label} is required`);
    }

    return normalized;
  }

  private toRsyncPath(targetPath: string, trailingSlash = false) {
    const normalized = targetPath.replace(/\\/g, '/');
    return trailingSlash ? normalized.replace(/\/?$/, '/') : normalized.replace(/\/$/, '');
  }

  private toErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Backup execution failed';
  }
}
