import { createInterface } from 'node:readline/promises';
import process from 'node:process';

import { loadConfig } from '../src/config.js';
import { launchAviabilityBrowser } from '../src/lib/browser.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig(process.env);
  const context = await launchAviabilityBrowser(config, {
    headed: true,
  });

  const page = await context.newPage();
  await page.goto('https://aviability.com/', {
    timeout: config.scrapeTimeoutMs,
    waitUntil: 'domcontentloaded',
  });

  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Aviability opened in a persistent browser session.');
  console.log('Complete any anti-bot challenge, then press Enter to save the profile and exit.');

  try {
    await readline.question('Press Enter when the profile is ready: ');
  } finally {
    readline.close();
    await context.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
