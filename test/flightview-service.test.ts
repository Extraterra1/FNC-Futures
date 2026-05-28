import { describe, expect, test, vi } from 'vitest';

import { type FlightViewFlightLookupResult } from '../src/lib/flightview/client.js';
import {
  ArrivalsServiceBusyError,
  FlightViewArrivalsService,
} from '../src/lib/flightview/service.js';

describe('FlightViewArrivalsService', () => {
  test('uses normalized lookup flight numbers while preserving the original response code', async () => {
    const lookupArrival = vi.fn(
      async (): Promise<FlightViewFlightLookupResult> => ({
        kind: 'error',
        code: 'not_found',
        message: 'No FlightView match found for U27631 arriving at LHR on 2026-03-17',
      }),
    );
    const service = new FlightViewArrivalsService({ lookupArrival });

    const response = await service.getArrivals({
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
      flightNumbers: ['EJU7631'],
    });

    expect(lookupArrival).toHaveBeenCalledWith({
      flightNumber: 'EJU7631',
      searchFlightNumber: 'U27631',
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
    });
    expect(response).toEqual({
      source: 'flightview',
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
      summary: {
        requested: 1,
        resolved: 0,
        failed: 1,
      },
      results: [
        {
          flightNumber: 'EJU7631',
          error: {
            code: 'not_found',
            message: 'No FlightView match found for EJU7631 arriving at LHR on 2026-03-17',
          },
        },
      ],
    });
  });

  test('reuses lookup data for duplicate normalized flight numbers within one request', async () => {
    const lookupArrival = vi.fn(
      async (): Promise<FlightViewFlightLookupResult> => ({
        kind: 'success',
        status: 'scheduled',
        scheduledArrivalLocal: '08:55',
        estimatedArrivalLocal: undefined,
        actualArrivalLocal: undefined,
        sourceUrl: 'https://www.flightview.com/flight-tracker/U2/7631?date=2026-03-22',
      }),
    );
    const service = new FlightViewArrivalsService({
      lookupArrival,
      normalizeFlightNumber: (flightNumber: string) =>
        flightNumber === 'EJU7631' ? 'U27631' : flightNumber,
    });

    const response = await service.getArrivals({
      airportCode: 'FNC',
      arrivalDate: '2026-03-22',
      flightNumbers: ['EJU7631', 'U27631', 'U27631'],
    });

    expect(lookupArrival).toHaveBeenCalledTimes(1);
    expect(response.summary).toEqual({
      requested: 3,
      resolved: 3,
      failed: 0,
    });
    expect(response.results).toEqual([
      {
        flightNumber: 'EJU7631',
        status: 'scheduled',
        scheduledArrivalLocal: '08:55',
        estimatedArrivalLocal: undefined,
        actualArrivalLocal: undefined,
        sourceUrl: 'https://www.flightview.com/flight-tracker/U2/7631?date=2026-03-22',
      },
      {
        flightNumber: 'U27631',
        status: 'scheduled',
        scheduledArrivalLocal: '08:55',
        estimatedArrivalLocal: undefined,
        actualArrivalLocal: undefined,
        sourceUrl: 'https://www.flightview.com/flight-tracker/U2/7631?date=2026-03-22',
      },
      {
        flightNumber: 'U27631',
        status: 'scheduled',
        scheduledArrivalLocal: '08:55',
        estimatedArrivalLocal: undefined,
        actualArrivalLocal: undefined,
        sourceUrl: 'https://www.flightview.com/flight-tracker/U2/7631?date=2026-03-22',
      },
    ]);
  });

  test('rewrites provider errors for the response flight number', async () => {
    const service = new FlightViewArrivalsService({
      lookupArrival: vi.fn(
        async (): Promise<FlightViewFlightLookupResult> => ({
          kind: 'error',
          code: 'flightview_unavailable',
          message: 'FlightView lookup failed for U27631',
        }),
      ),
      normalizeFlightNumber: () => 'U27631',
    });

    const response = await service.getArrivals({
      airportCode: 'FNC',
      arrivalDate: '2026-03-22',
      flightNumbers: ['EJU7631'],
    });

    expect(response.results).toEqual([
      {
        flightNumber: 'EJU7631',
        error: {
          code: 'flightview_unavailable',
          message: 'FlightView lookup failed for EJU7631',
        },
      },
    ]);
  });

  test('rejects overlapping batches with a busy error', async () => {
    let releaseLookup: (() => void) | undefined;
    const service = new FlightViewArrivalsService({
      lookupArrival: vi.fn(
        (): Promise<FlightViewFlightLookupResult> =>
          new Promise((resolve) => {
            releaseLookup = () =>
              resolve({
                kind: 'error',
                code: 'not_found',
                message: 'No FlightView match found for AA100 arriving at LHR on 2026-03-17',
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
