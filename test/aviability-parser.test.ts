import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
  AviabilityBlockedError,
  AviabilityParseError,
  parseAviabilityArrivalPage,
} from '../src/lib/aviability/parser.js';

async function loadFixture(name: string): Promise<string> {
  return readFile(join(process.cwd(), 'test/fixtures/aviability', name), 'utf8');
}

describe('parseAviabilityArrivalPage', () => {
  test('parses scheduled-only arrival data', async () => {
    const html = await loadFixture('scheduled-only.html');

    expect(parseAviabilityArrivalPage(html)).toEqual({
      status: 'scheduled',
      scheduledArrivalLocal: '06:20',
      estimatedArrivalLocal: undefined,
      actualArrivalLocal: undefined,
    });
  });

  test('parses delayed flights with estimated arrival time', async () => {
    const html = await loadFixture('delayed.html');

    expect(parseAviabilityArrivalPage(html)).toEqual({
      status: 'delayed',
      scheduledArrivalLocal: '06:20',
      estimatedArrivalLocal: '06:55',
      actualArrivalLocal: undefined,
    });
  });

  test('parses arrived flights with actual arrival time', async () => {
    const html = await loadFixture('arrived.html');

    expect(parseAviabilityArrivalPage(html)).toEqual({
      status: 'arrived',
      scheduledArrivalLocal: '06:20',
      estimatedArrivalLocal: undefined,
      actualArrivalLocal: '06:08',
    });
  });

  test('detects aviability anti-bot feedback pages', async () => {
    const html = await loadFixture('feedback.html');

    expect(() => parseAviabilityArrivalPage(html)).toThrow(AviabilityBlockedError);
  });

  test('rejects malformed pages without arrival details', async () => {
    const html = await loadFixture('malformed.html');

    expect(() => parseAviabilityArrivalPage(html)).toThrow(AviabilityParseError);
  });
});
