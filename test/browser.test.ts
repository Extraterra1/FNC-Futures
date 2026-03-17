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
        aviabilityHeaded: false,
      }),
    ).rejects.toThrow('AVIABILITY_PROFILE_DIR is required');
  });

  test('launches a persistent browser context headless by default', async () => {
    const close = vi.fn(async () => undefined);
    const addInitScript = vi.fn(async () => undefined);
    const launchPersistentContext = vi.fn(async () => ({
      close,
      addInitScript,
    })) as unknown as BrowserLaunchOptions['launchPersistentContext'];

    const context = await launchAviabilityBrowser(
      {
        port: 3000,
        aviabilityProfileDir: '/tmp/aviability-profile',
        scrapeTimeoutMs: 30000,
        debugArtifactsDir: 'debug-artifacts',
        aviabilityHeaded: false,
      },
      { launchPersistentContext },
    );

    expect(launchPersistentContext).toHaveBeenCalledWith(
      '/tmp/aviability-profile',
      expect.objectContaining({
        headless: true,
        locale: 'en-US',
        userAgent: expect.not.stringContaining('HeadlessChrome'),
        extraHTTPHeaders: {
          'accept-language': 'en-US,en;q=0.9',
        },
        args: expect.arrayContaining(['--disable-blink-features=AutomationControlled']),
      }),
    );
    expect(addInitScript).toHaveBeenCalledTimes(1);
    await context.close();
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('can still override the config and launch headed explicitly', async () => {
    const close = vi.fn(async () => undefined);
    const addInitScript = vi.fn(async () => undefined);
    const launchPersistentContext = vi.fn(async () => ({
      close,
      addInitScript,
    })) as unknown as BrowserLaunchOptions['launchPersistentContext'];

    const context = await launchAviabilityBrowser(
      {
        port: 3000,
        aviabilityProfileDir: '/tmp/aviability-profile',
        scrapeTimeoutMs: 30000,
        debugArtifactsDir: 'debug-artifacts',
        aviabilityHeaded: false,
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
    expect(addInitScript).not.toHaveBeenCalled();
    await context.close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
