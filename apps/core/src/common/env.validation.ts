const REQUIRED_ENV_VARS = ['DATABASE_URL', 'FILES_PATH', 'STORAGE_PATH', 'APPDATA_PATH'] as const;

export type Environment = Readonly<{
  databaseUrl: string;
  filesPath: string;
  storagePath: string;
  appDataPath: string;
  rsyncBin: string;
  backupRsyncSshPort?: string;
  backupRsyncSshUser?: string;
}>;

export let environment: Environment;

export function validateEnvironment(env: Record<string, unknown>) {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  environment = Object.freeze({
    databaseUrl: env.DATABASE_URL as string,
    filesPath: env.FILES_PATH as string,
    storagePath: env.STORAGE_PATH as string,
    appDataPath: env.APPDATA_PATH as string,
    rsyncBin: typeof env.RSYNC_BIN === 'string' && env.RSYNC_BIN.trim() ? env.RSYNC_BIN.trim() : 'rsync',
    backupRsyncSshPort:
      typeof env.BACKUP_RSYNC_SSH_PORT === 'string' && env.BACKUP_RSYNC_SSH_PORT.trim()
        ? env.BACKUP_RSYNC_SSH_PORT.trim()
        : undefined,
    backupRsyncSshUser:
      typeof env.BACKUP_RSYNC_SSH_USER === 'string' && env.BACKUP_RSYNC_SSH_USER.trim()
        ? env.BACKUP_RSYNC_SSH_USER.trim()
        : undefined,
  });

  return env;
}
