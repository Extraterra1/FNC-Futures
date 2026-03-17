import { describe, expect, test } from 'vitest';

import { buildApp } from '../src/app.js';

describe('POST /arrivals', () => {
  test('normalizes a valid request and returns a stubbed response', async () => {
    const app = buildApp();
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
    expect(response.json()).toEqual({
      source: 'aviability',
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
      summary: {
        requested: 2,
        resolved: 0,
        failed: 0,
      },
      results: [
        {
          flightNumber: 'AA100',
          status: 'pending_lookup',
        },
        {
          flightNumber: 'BA283',
          status: 'pending_lookup',
        },
      ],
    });
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
});
