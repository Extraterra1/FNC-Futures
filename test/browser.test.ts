import { describe, expect, test, vi } from 'vitest';

import {
  launchAviabilityBrowser,
  type BrowserLaunchOptions,
} from '../src/lib/browser.js';

describe('launchAviabilityBrowser', () => {
  test('fails fast when the persistent profile directory is missing', async () => {
    await expect(
      launchAviabilityBrowser({
        port: 3000,
        aviabilityProfileDir: undefined,
        scrapeTimeoutMs: 30000,
        debugArtifactsDir: 'debug-artifacts',
      }),
    ).rejects.toThrow('AVIABILITY_PROFILE_DIR is required');
  });

  test('launches a persistent browser context with the configured profile directory', async () => {
    const close = vi.fn(async () => undefined);
    const launchPersistentContext = vi.fn(async () => ({
      close,
    })) as unknown as BrowserLaunchOptions['launchPersistentContext'];

    const context = await launchAviabilityBrowser(
      {
        port: 3000,
        aviabilityProfileDir: '/tmp/aviability-profile',
        scrapeTimeoutMs: 30000,
        debugArtifactsDir: 'debug-artifacts',
      },
      {
        headed: true,
        launchPersistentContext,
      },
    );

    expect(launchPersistentContext).toHaveBeenCalledWith(
      '/tmp/aviability-profile',
      expect.objectContaining({
        headless: false,
      }),
    );
    await context.close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
