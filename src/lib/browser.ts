import { chromium, type BrowserContext } from 'playwright';

import type { AppConfig } from '../config.js';

export const AVIABILITY_PROFILE_DIR_ERROR = 'AVIABILITY_PROFILE_DIR is required';

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

export interface BrowserLaunchOptions {
  headed?: boolean;
  launchPersistentContext?: LaunchPersistentContext;
}

export async function launchAviabilityBrowser(
  config: AppConfig,
  options: BrowserLaunchOptions = {},
): Promise<BrowserContext> {
  if (!config.aviabilityProfileDir) {
    throw new Error(AVIABILITY_PROFILE_DIR_ERROR);
  }

  const launchPersistentContext =
    options.launchPersistentContext ?? chromium.launchPersistentContext.bind(chromium);
  const headed = options.headed ?? config.aviabilityHeaded;
  const browserContext = await launchPersistentContext(config.aviabilityProfileDir, {
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

  return browserContext;
}
