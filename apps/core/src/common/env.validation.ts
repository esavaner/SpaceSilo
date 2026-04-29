const REQUIRED_ENV_VARS = ['FILES_PATH', 'STORAGE_PATH', 'APPDATA_PATH'] as const;

export function validateEnvironment(env: Record<string, unknown>) {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return env;
}
