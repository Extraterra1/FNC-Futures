import { describe, expect, test } from 'vitest';

import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  test('uses defaults when optional environment variables are omitted', () => {
    const config = loadConfig({});

    expect(config).toEqual({
      port: 3000,
      aviabilityProfileDir: undefined,
      scrapeTimeoutMs: 30000,
      debugArtifactsDir: 'debug-artifacts',
    });
  });

  test('parses explicit environment variables', () => {
    const config = loadConfig({
      PORT: '4321',
      AVIABILITY_PROFILE_DIR: '/tmp/aviability-profile',
      SCRAPE_TIMEOUT_MS: '45000',
      DEBUG_ARTIFACTS_DIR: '/tmp/debug-artifacts',
    });

    expect(config).toEqual({
      port: 4321,
      aviabilityProfileDir: '/tmp/aviability-profile',
      scrapeTimeoutMs: 45000,
      debugArtifactsDir: '/tmp/debug-artifacts',
    });
  });
});
