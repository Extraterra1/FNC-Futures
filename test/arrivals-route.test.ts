import { describe, expect, test } from 'vitest';

import { buildApp } from '../src/build-app.js';
import {
  ArrivalsServiceBootstrapError,
  ArrivalsServiceBusyError,
  type ArrivalsResponse,
  type AviabilityArrivalsService,
} from '../src/lib/aviability/service.js';

function createResponse(results: ArrivalsResponse['results']): ArrivalsResponse {
  const resolved = results.filter((result) => 'status' in result).length;

  return {
    source: 'aviability',
    airportCode: 'LHR',
    arrivalDate: '2026-03-17',
    summary: {
      requested: results.length,
      resolved,
      failed: results.length - resolved,
    },
    results,
  };
}

describe('POST /arrivals', () => {
  test('returns formatted arrival data for successful lookups', async () => {
    const app = buildApp({
      arrivalsService: {
        getArrivals: async () =>
          createResponse([
            {
              flightNumber: 'AA100',
              status: 'arrived',
              scheduledArrivalLocal: '06:20',
              actualArrivalLocal: '06:08',
              sourceUrl: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
            },
            {
              flightNumber: 'BA283',
              status: 'scheduled',
              scheduledArrivalLocal: '08:55',
              sourceUrl: 'https://aviability.com/en/flight/ba283-british-airways/lax-lhr/2026-03-17',
            },
          ]),
        close: async () => undefined,
      } satisfies Pick<AviabilityArrivalsService, 'getArrivals' | 'close'>,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/arrivals',
      payload: {
        airportCode: 'lhr',
        arrivalDate: '2026-03-17',
        flightNumbers: [' aa100 ', 'ba283'],
      },
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      createResponse([
        {
          flightNumber: 'AA100',
          status: 'arrived',
          scheduledArrivalLocal: '06:20',
          actualArrivalLocal: '06:08',
          sourceUrl: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
        },
        {
          flightNumber: 'BA283',
          status: 'scheduled',
          scheduledArrivalLocal: '08:55',
          sourceUrl: 'https://aviability.com/en/flight/ba283-british-airways/lax-lhr/2026-03-17',
        },
      ]),
    );
  });

  test('returns partial success when some flights cannot be resolved', async () => {
    const app = buildApp({
      arrivalsService: {
        getArrivals: async () =>
          createResponse([
            {
              flightNumber: 'AA100',
              status: 'arrived',
              scheduledArrivalLocal: '06:20',
              actualArrivalLocal: '06:08',
              sourceUrl: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
            },
            {
              flightNumber: 'BA283',
              error: {
                code: 'not_found',
                message: 'No Aviability match found for BA283 on 2026-03-17 at LHR',
              },
            },
          ]),
        close: async () => undefined,
      } satisfies Pick<AviabilityArrivalsService, 'getArrivals' | 'close'>,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/arrivals',
      payload: {
        airportCode: 'LHR',
        arrivalDate: '2026-03-17',
        flightNumbers: ['AA100', 'BA283'],
      },
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      createResponse([
        {
          flightNumber: 'AA100',
          status: 'arrived',
          scheduledArrivalLocal: '06:20',
          actualArrivalLocal: '06:08',
          sourceUrl: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
        },
        {
          flightNumber: 'BA283',
          error: {
            code: 'not_found',
            message: 'No Aviability match found for BA283 on 2026-03-17 at LHR',
          },
        },
      ]),
    );
  });

  test('rejects invalid arrival request payloads', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/arrivals',
      payload: {
        airportCode: 'london',
        arrivalDate: '17-03-2026',
        flightNumbers: [],
      },
    });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'Bad Request',
      message: 'Invalid arrivals request',
      statusCode: 400,
    });
  });

  test('returns 429 when another batch is already running', async () => {
    const app = buildApp({
      arrivalsService: {
        getArrivals: async () => {
          throw new ArrivalsServiceBusyError();
        },
        close: async () => undefined,
      } satisfies Pick<AviabilityArrivalsService, 'getArrivals' | 'close'>,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/arrivals',
      payload: {
        airportCode: 'LHR',
        arrivalDate: '2026-03-17',
        flightNumbers: ['AA100'],
      },
    });

    await app.close();

    expect(response.statusCode).toBe(429);
    expect(response.json()).toEqual({
      error: 'Too Many Requests',
      message: 'Another arrivals batch is already running',
      statusCode: 429,
    });
  });

  test('returns 503 when the browser session cannot be prepared', async () => {
    const app = buildApp({
      arrivalsService: {
        getArrivals: async () => {
          throw new ArrivalsServiceBootstrapError();
        },
        close: async () => undefined,
      } satisfies Pick<AviabilityArrivalsService, 'getArrivals' | 'close'>,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/arrivals',
      payload: {
        airportCode: 'LHR',
        arrivalDate: '2026-03-17',
        flightNumbers: ['AA100'],
      },
    });

    await app.close();

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: 'Service Unavailable',
      message: 'Aviability browser session could not be prepared',
      statusCode: 503,
    });
  });
});
