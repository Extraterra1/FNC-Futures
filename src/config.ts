export interface AppConfig {
  port: number;
}

const DEFAULT_PORT = 3000;

function parseNumber(input: string | undefined, fallback: number): number {
  if (input === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): AppConfig {
  return {
    port: parseNumber(env.PORT, DEFAULT_PORT),
  };
}
