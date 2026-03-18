import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { chromium, type BrowserContext } from 'playwright';

import type { AppConfig } from '../config.js';

const HEADLESS_STEALTH_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';
const HEADLESS_LANGUAGE_HEADER = 'en-US,en;q=0.9';
const HEADLESS_STEALTH_ARGS = ['--disable-blink-features=AutomationControlled'];

const applyHeadlessStealth = () => {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
  });

  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en'],
  });

  Object.defineProperty(navigator, 'plugins', {
    get: () => [
      { name: 'Chrome PDF Plugin' },
      { name: 'Chrome PDF Viewer' },
      { name: 'Native Client' },
      { name: 'Chromium PDF Plugin' },
      { name: 'Microsoft Edge PDF Viewer' },
    ],
  });

  const windowWithChrome = window as Window & {
    chrome?: {
      runtime?: object;
    };
  };

  windowWithChrome.chrome = windowWithChrome.chrome || {};
  windowWithChrome.chrome.runtime = windowWithChrome.chrome.runtime || {};
};

type LaunchPersistentContext = typeof chromium.launchPersistentContext;
type CreateTempProfileDir = () => Promise<string>;
type RemoveTempProfileDir = (profileDir: string) => Promise<void>;

async function createTempProfileDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'aviability-profile-'));
}

async function removeTempProfileDir(profileDir: string): Promise<void> {
  await rm(profileDir, {
    recursive: true,
    force: true,
  });
}

function attachTempProfileCleanup(
  browserContext: BrowserContext,
  tempProfileDir: string,
  removeTempProfileDir: RemoveTempProfileDir,
): BrowserContext {
  const originalClose = browserContext.close.bind(browserContext);
  let cleanupPromise: Promise<void> | undefined;

  browserContext.close = async () => {
    cleanupPromise ??= (async () => {
      try {
        await originalClose();
      } finally {
        await removeTempProfileDir(tempProfileDir);
      }
    })();

    await cleanupPromise;
  };

  return browserContext;
}

export interface BrowserLaunchOptions {
  headed?: boolean;
  launchPersistentContext?: LaunchPersistentContext;
  createTempProfileDir?: CreateTempProfileDir;
  removeTempProfileDir?: RemoveTempProfileDir;
}

export async function launchAviabilityBrowser(
  config: AppConfig,
  options: BrowserLaunchOptions = {},
): Promise<BrowserContext> {
  const launchPersistentContext =
    options.launchPersistentContext ?? chromium.launchPersistentContext.bind(chromium);
  const createTemporaryProfileDir = options.createTempProfileDir ?? createTempProfileDir;
  const removeTemporaryProfileDir = options.removeTempProfileDir ?? removeTempProfileDir;
  const headed = options.headed ?? config.aviabilityHeaded;
  const tempProfileDir =
    config.aviabilityProfileDir === undefined ? await createTemporaryProfileDir() : undefined;
  const profileDir = config.aviabilityProfileDir ?? tempProfileDir;

  if (!profileDir) {
    throw new Error('Browser profile directory could not be resolved');
  }

  try {
    const browserContext = await launchPersistentContext(profileDir, {
      headless: !headed,
      viewport: {
        width: 1440,
        height: 960,
      },
      ...(headed
        ? {}
        : {
            userAgent: HEADLESS_STEALTH_USER_AGENT,
            locale: 'en-US',
            extraHTTPHeaders: {
              'accept-language': HEADLESS_LANGUAGE_HEADER,
            },
            args: HEADLESS_STEALTH_ARGS,
          }),
    });

    if (!headed) {
      await browserContext.addInitScript(applyHeadlessStealth);
    }

    return tempProfileDir
      ? attachTempProfileCleanup(browserContext, tempProfileDir, removeTemporaryProfileDir)
      : browserContext;
  } catch (error) {
    if (tempProfileDir) {
      await removeTemporaryProfileDir(tempProfileDir);
    }

    throw error;
  }
}
