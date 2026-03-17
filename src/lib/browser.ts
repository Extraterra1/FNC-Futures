import { chromium, type BrowserContext } from 'playwright';

import type { AppConfig } from '../config.js';

export const AVIABILITY_PROFILE_DIR_ERROR = 'AVIABILITY_PROFILE_DIR is required';

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

  return launchPersistentContext(config.aviabilityProfileDir, {
    headless: !headed,
    viewport: {
      width: 1440,
      height: 960,
    },
  });
}
