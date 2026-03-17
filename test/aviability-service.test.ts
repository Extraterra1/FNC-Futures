import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, test, vi } from 'vitest';

import { type AppConfig } from '../src/config.js';
import { type AviabilityFlightLookupResult } from '../src/lib/aviability/client.js';
import { AviabilityParseError } from '../src/lib/aviability/parser.js';
import {
  AviabilityArrivalsService,
  ArrivalsServiceBusyError,
} from '../src/lib/aviability/service.js';

function createConfig(debugArtifactsDir: string): AppConfig {
  return {
    port: 3000,
    aviabilityProfileDir: '/tmp/aviability-profile',
    scrapeTimeoutMs: 30000,
    debugArtifactsDir,
    aviabilityHeaded: true,
  };
}

describe('AviabilityArrivalsService', () => {
  test('closes the browser context after each completed request', async () => {
    const page = {
      close: vi.fn(async () => undefined),
    };
    const context = {
      newPage: vi.fn(async () => page),
      close: vi.fn(async () => undefined),
    };

    const service = new AviabilityArrivalsService(createConfig(join(tmpdir(), 'unused')), {
      launchBrowser: vi.fn(async () => context as never),
      lookupFlightPage: vi.fn(
        async (): Promise<AviabilityFlightLookupResult> => ({
          kind: 'error',
          code: 'not_found',
          message: 'No Aviability match found for AA100 on 2026-03-17 at LHR',
        }),
      ),
    });

    await service.getArrivals({
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
      flightNumbers: ['AA100'],
    });

    expect(context.close).toHaveBeenCalledTimes(1);
  });

  test('uses normalized lookup flight numbers while preserving the original response code', async () => {
    const page = {
      close: vi.fn(async () => undefined),
    };
    const context = {
      newPage: vi.fn(async () => page),
      close: vi.fn(async () => undefined),
    };
    const lookupFlightPage = vi.fn(
      async (): Promise<AviabilityFlightLookupResult> => ({
        kind: 'error',
        code: 'not_found',
        message: 'No Aviability match found for EJU7631 on 2026-03-17 at LHR',
      }),
    );

    const service = new AviabilityArrivalsService(createConfig(join(tmpdir(), 'unused')), {
      launchBrowser: vi.fn(async () => context as never),
      lookupFlightPage,
    });

    const response = await service.getArrivals({
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
      flightNumbers: ['EJU7631'],
    });

    expect(lookupFlightPage).toHaveBeenCalledTimes(1);

    const lookupCall = lookupFlightPage.mock.calls[0];
    if (!lookupCall) {
      throw new Error('Expected lookupFlightPage to be called');
    }

    const lookupRequest = (lookupCall as unknown[])[1] as Record<string, string>;

    expect(lookupRequest.flightNumber).toBe('EJU7631');
    expect(lookupRequest.searchFlightNumber).toBe('U27631');
    expect(response.results).toEqual([
      {
        flightNumber: 'EJU7631',
        error: {
          code: 'not_found',
          message: 'No Aviability match found for EJU7631 on 2026-03-17 at LHR',
        },
      },
    ]);
  });

  test('writes a debug artifact and returns parse_failed when the detail page cannot be parsed', async () => {
    const artifactsDir = await mkdtemp(join(tmpdir(), 'aviability-artifacts-'));
    const page = {
      close: vi.fn(async () => undefined),
    };
    const context = {
      newPage: vi.fn(async () => page),
      close: vi.fn(async () => undefined),
    };

    const service = new AviabilityArrivalsService(createConfig(artifactsDir), {
      launchBrowser: vi.fn(async () => context as never),
      lookupFlightPage: vi.fn(
        async (): Promise<AviabilityFlightLookupResult> => ({
          kind: 'success',
          sourceUrl:
            'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
          html: '<html><body>broken page</body></html>',
        }),
      ),
      parseArrivalPage: vi.fn(() => {
        throw new AviabilityParseError();
      }),
    });

    const response = await service.getArrivals({
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
      flightNumbers: ['AA100'],
    });

    await service.close();

    expect(response.summary).toEqual({
      requested: 1,
      resolved: 0,
      failed: 1,
    });
    expect(response.results).toEqual([
      {
        flightNumber: 'AA100',
        error: {
          code: 'parse_failed',
          message: 'Unable to parse Aviability arrival data for AA100',
        },
      },
    ]);

    const artifactFiles = await readFile(
      join(artifactsDir, '2026-03-17-LHR-AA100.html'),
      'utf8',
    );
    expect(artifactFiles).toContain('broken page');
  });

  test('rejects overlapping batches with a busy error', async () => {
    let releaseLookup: (() => void) | undefined;
    const page = {
      close: vi.fn(async () => undefined),
    };
    const context = {
      newPage: vi.fn(async () => page),
      close: vi.fn(async () => undefined),
    };
    const service = new AviabilityArrivalsService(createConfig(join(tmpdir(), 'unused')), {
      launchBrowser: vi.fn(async () => context as never),
      lookupFlightPage: vi.fn(
        (): Promise<AviabilityFlightLookupResult> =>
          new Promise((resolve) => {
            releaseLookup = () =>
              resolve({
                kind: 'error',
                code: 'not_found',
                message: 'No Aviability match found for AA100 on 2026-03-17 at LHR',
              });
          }),
      ),
    });

    const firstRequest = service.getArrivals({
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
      flightNumbers: ['AA100'],
    });

    await expect(
      service.getArrivals({
        airportCode: 'LHR',
        arrivalDate: '2026-03-17',
        flightNumbers: ['BA283'],
      }),
    ).rejects.toThrow(ArrivalsServiceBusyError);

    releaseLookup?.();
    await firstRequest;
    await service.close();
  });
});
