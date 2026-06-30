import { describe, expect, test, vi } from 'vitest';

import {
  lookupFlightViewArrival,
  type FlightViewFetch,
} from '../src/lib/flightview/client.js';

function createFetch(payloads: unknown[], ok = true): FlightViewFetch {
  return vi.fn(async () => ({
    ok,
    status: ok ? 200 : 503,
    json: async () => {
      const payload = payloads.shift();

      if (payload instanceof Error) {
        throw payload;
      }

      return payload;
    },
  })) as unknown as FlightViewFetch;
}

const tp1702Payload = {
  flights: [],
  flight: {
    arrival: {
      arrivalDateTime: '2026-06-15T10:35:00-00:00',
      airportCode: 'OPO',
      scheduledTime: '10:35, Jun 15',
      estimatedTime: null,
      inGateTime: null,
      onGroundTime: null,
    },
    departure: {
      airportCode: 'FNC',
    },
    flightStatus: 'Scheduled',
  },
  emptyResults: false,
};

const u27631Payload = {
  flights: [],
  flight: {
    arrival: {
      arrivalDateTime: '2026-03-22T08:55:00-00:00',
      airportCode: 'FNC',
      scheduledTime: '08:55, Mar 22',
      estimatedTime: null,
      inGateTime: null,
      onGroundTime: null,
    },
    departure: {
      airportCode: 'LIS',
    },
    flightStatus: 'Scheduled',
  },
  emptyResults: false,
};

describe('lookupFlightViewArrival', () => {
  test('matches future scheduled arrivals when FlightView omits arrivalDateTime', async () => {
    const fetch = createFetch([
      {
        flights: [],
        flight: null,
        emptyResults: true,
      },
      {
        flights: [],
        flight: {
          arrival: {
            arrivalDateTime: null,
            airportCode: 'FNC',
            scheduledTime: '18:05, Jul 01',
            estimatedTime: null,
            inGateTime: null,
            onGroundTime: null,
          },
          departure: {
            airportCode: 'CDG',
          },
          flightStatus: 'Scheduled',
          scheduleInstanceKey: 'future-u24601',
        },
        emptyResults: false,
      },
    ]);

    await expect(
      lookupFlightViewArrival(
        {
          flightNumber: 'U24601',
          airportCode: 'FNC',
          arrivalDate: '2026-07-01',
        },
        { fetch },
      ),
    ).resolves.toEqual({
      kind: 'success',
      status: 'scheduled',
      scheduledArrivalLocal: '18:05',
      estimatedArrivalLocal: undefined,
      actualArrivalLocal: undefined,
      sourceUrl: 'https://www.flightview.com/flight-tracker/U2/4601?date=2026-07-01',
    });
  });

  test('returns arrival data for a direct FlightView match', async () => {
    const fetch = createFetch([
      {
        flights: [],
        flight: null,
        emptyResults: true,
      },
      tp1702Payload,
    ]);

    await expect(
      lookupFlightViewArrival(
        {
          flightNumber: 'TP1702',
          searchFlightNumber: 'TP1702',
          airportCode: 'OPO',
          arrivalDate: '2026-06-15',
        },
        { fetch },
      ),
    ).resolves.toEqual({
      kind: 'success',
      status: 'scheduled',
      scheduledArrivalLocal: '10:35',
      estimatedArrivalLocal: undefined,
      actualArrivalLocal: undefined,
      sourceUrl: 'https://www.flightview.com/flight-tracker/TP/1702?date=2026-06-15',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://app-api.flightview.com/api/v2/flight/TP/1702?departureDate=2026-06-15',
      expect.objectContaining({
        headers: expect.objectContaining({
          origin: 'https://www.flightview.com',
        }),
      }),
    );
  });

  test('preserves arrival-date semantics for overnight flights', async () => {
    const fetch = createFetch([
      {
        flights: [],
        flight: {
          arrival: {
            arrivalDateTime: '2026-03-18T06:16:00+00:00',
            airportCode: 'LHR',
            scheduledTime: '06:20, Mar 18',
            estimatedTime: null,
            inGateTime: '06:16, Mar 18',
            onGroundTime: null,
          },
          departure: {
            airportCode: 'JFK',
          },
          flightStatus: 'Arrived',
        },
        emptyResults: false,
      },
      {
        flights: [],
        flight: {
          arrival: {
            arrivalDateTime: '2026-03-19T06:25:00+00:00',
            airportCode: 'LHR',
            scheduledTime: '06:20, Mar 19',
            estimatedTime: null,
            inGateTime: '06:25, Mar 19',
            onGroundTime: null,
          },
          departure: {
            airportCode: 'JFK',
          },
          flightStatus: 'Arrived',
        },
        emptyResults: false,
      },
    ]);

    const result = await lookupFlightViewArrival(
      {
        flightNumber: 'AA100',
        searchFlightNumber: 'AA100',
        airportCode: 'LHR',
        arrivalDate: '2026-03-18',
      },
      { fetch },
    );

    expect(result).toEqual({
      kind: 'success',
      status: 'arrived',
      scheduledArrivalLocal: '06:16',
      estimatedArrivalLocal: undefined,
      actualArrivalLocal: '06:16',
      sourceUrl: 'https://www.flightview.com/flight-tracker/AA/100?date=2026-03-17',
    });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://app-api.flightview.com/api/v2/flight/AA/100?departureDate=2026-03-17',
      expect.any(Object),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://app-api.flightview.com/api/v2/flight/AA/100?departureDate=2026-03-18',
      expect.any(Object),
    );
  });

  test('normalizes ICAO flight numbers before querying FlightView', async () => {
    const fetch = createFetch([
      {
        flights: [],
        flight: null,
        emptyResults: true,
      },
      u27631Payload,
    ]);

    await lookupFlightViewArrival(
      {
        flightNumber: 'EJU7631',
        searchFlightNumber: 'U27631',
        airportCode: 'FNC',
        arrivalDate: '2026-03-22',
      },
      { fetch },
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://app-api.flightview.com/api/v2/flight/U2/7631?departureDate=2026-03-22',
      expect.any(Object),
    );
  });

  test('returns not_found when the arrival airport does not match', async () => {
    const fetch = createFetch([
      {
        flights: [],
        flight: null,
        emptyResults: true,
      },
      tp1702Payload,
    ]);

    await expect(
      lookupFlightViewArrival(
        {
          flightNumber: 'TP1702',
          searchFlightNumber: 'TP1702',
          airportCode: 'LHR',
          arrivalDate: '2026-06-15',
        },
        { fetch },
      ),
    ).resolves.toEqual({
      kind: 'error',
      code: 'not_found',
      message: 'No FlightView match found for TP1702 arriving at LHR on 2026-06-15',
    });
  });

  test('returns ambiguous_match when multiple candidates match the same arrival', async () => {
    const fetch = createFetch([
      {
        flights: [],
        flight: null,
        emptyResults: true,
      },
      {
        flights: [
          {
            departureAirportCode: 'FNC',
          },
          {
            departureAirportCode: 'LIS',
          },
        ],
        flight: null,
        emptyResults: false,
      },
      tp1702Payload,
      {
        ...tp1702Payload,
        flight: {
          ...tp1702Payload.flight,
          departure: {
            airportCode: 'LIS',
          },
        },
      },
    ]);

    await expect(
      lookupFlightViewArrival(
        {
          flightNumber: 'TP1702',
          searchFlightNumber: 'TP1702',
          airportCode: 'OPO',
          arrivalDate: '2026-06-15',
        },
        { fetch },
      ),
    ).resolves.toEqual({
      kind: 'error',
      code: 'ambiguous_match',
      message: 'Multiple FlightView matches found for TP1702 arriving at OPO on 2026-06-15',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://app-api.flightview.com/api/v2/flight/TP/1702?departureDate=2026-06-15&departureAirport=FNC',
      expect.any(Object),
    );
  });

  test('returns flightview_unavailable when FlightView rejects the request', async () => {
    const fetch = createFetch([], false);

    await expect(
      lookupFlightViewArrival(
        {
          flightNumber: 'TP1702',
          searchFlightNumber: 'TP1702',
          airportCode: 'OPO',
          arrivalDate: '2026-06-15',
        },
        { fetch },
      ),
    ).resolves.toEqual({
      kind: 'error',
      code: 'flightview_unavailable',
      message: 'FlightView lookup failed for TP1702',
    });
  });

  test('returns flightview_unavailable when the FlightView request fails', async () => {
    const fetch = vi.fn(async () => {
      throw new Error('network failed');
    }) as unknown as FlightViewFetch;

    await expect(
      lookupFlightViewArrival(
        {
          flightNumber: 'TP1702',
          searchFlightNumber: 'TP1702',
          airportCode: 'OPO',
          arrivalDate: '2026-06-15',
        },
        { fetch },
      ),
    ).resolves.toEqual({
      kind: 'error',
      code: 'flightview_unavailable',
      message: 'FlightView lookup failed for TP1702',
    });
  });

  test('returns parse_failed when FlightView returns invalid JSON', async () => {
    const fetch = createFetch([new Error('invalid json')]);

    await expect(
      lookupFlightViewArrival(
        {
          flightNumber: 'TP1702',
          searchFlightNumber: 'TP1702',
          airportCode: 'OPO',
          arrivalDate: '2026-06-15',
        },
        { fetch },
      ),
    ).resolves.toEqual({
      kind: 'error',
      code: 'parse_failed',
      message: 'Unable to parse FlightView data for TP1702',
    });
  });
});
