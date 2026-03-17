export interface AppConfig {
  port: number;
  aviabilityProfileDir?: string;
  scrapeTimeoutMs: number;
  debugArtifactsDir: string;
  aviabilityHeaded: boolean;
}

const DEFAULT_PORT = 3000;
const DEFAULT_SCRAPE_TIMEOUT_MS = 30000;
const DEFAULT_DEBUG_ARTIFACTS_DIR = 'debug-artifacts';
const DEFAULT_AVIABILITY_HEADED = false;

function parseNumber(input: string | undefined, fallback: number): number {
  if (input === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalString(input: string | undefined): string | undefined {
  const value = input?.trim();
  return value ? value : undefined;
}

function parseBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined) {
    return fallback;
  }

  const value = input.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(value)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(value)) {
    return false;
  }

  return fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): AppConfig {
  return {
    port: parseNumber(env.PORT, DEFAULT_PORT),
    aviabilityProfileDir: parseOptionalString(env.AVIABILITY_PROFILE_DIR),
    scrapeTimeoutMs: parseNumber(env.SCRAPE_TIMEOUT_MS, DEFAULT_SCRAPE_TIMEOUT_MS),
    debugArtifactsDir:
      parseOptionalString(env.DEBUG_ARTIFACTS_DIR) ?? DEFAULT_DEBUG_ARTIFACTS_DIR,
    aviabilityHeaded: parseBoolean(env.AVIABILITY_HEADED, DEFAULT_AVIABILITY_HEADED),
  };
}
