import { describe, expect, test } from 'vitest';

import { buildApp } from '../src/build-app.js';
import {
  ArrivalsServiceBusyError,
  type ArrivalsResponse,
  type FlightViewArrivalsService,
} from '../src/lib/flightview/service.js';

function createResponse(results: ArrivalsResponse['results']): ArrivalsResponse {
  const resolved = results.filter((result) => 'status' in result).length;

  return {
    source: 'flightview',
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
              sourceUrl: 'https://www.flightview.com/flight-tracker/AA/100?date=2026-03-16',
            },
            {
              flightNumber: 'BA283',
              status: 'scheduled',
              scheduledArrivalLocal: '08:55',
              sourceUrl: 'https://www.flightview.com/flight-tracker/BA/283?date=2026-03-17',
            },
          ]),
        close: async () => undefined,
      } satisfies Pick<FlightViewArrivalsService, 'getArrivals' | 'close'>,
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
          sourceUrl: 'https://www.flightview.com/flight-tracker/AA/100?date=2026-03-16',
        },
        {
          flightNumber: 'BA283',
          status: 'scheduled',
          scheduledArrivalLocal: '08:55',
          sourceUrl: 'https://www.flightview.com/flight-tracker/BA/283?date=2026-03-17',
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
              sourceUrl: 'https://www.flightview.com/flight-tracker/AA/100?date=2026-03-16',
            },
            {
              flightNumber: 'BA283',
              error: {
                code: 'not_found',
                message: 'No FlightView match found for BA283 arriving at LHR on 2026-03-17',
              },
            },
          ]),
        close: async () => undefined,
      } satisfies Pick<FlightViewArrivalsService, 'getArrivals' | 'close'>,
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
          sourceUrl: 'https://www.flightview.com/flight-tracker/AA/100?date=2026-03-16',
        },
        {
          flightNumber: 'BA283',
          error: {
            code: 'not_found',
            message: 'No FlightView match found for BA283 arriving at LHR on 2026-03-17',
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
      } satisfies Pick<FlightViewArrivalsService, 'getArrivals' | 'close'>,
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

});
