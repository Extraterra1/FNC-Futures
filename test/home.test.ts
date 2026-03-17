import { describe, expect, test } from 'vitest';

import { buildApp } from '../src/app.js';

describe('GET /', () => {
  test('returns the non-technical arrivals frontend shell', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('Check flight arrivals without touching the API');
    expect(response.body).not.toContain('name="airportCode"');
    expect(response.body).toContain('name="arrivalDate"');
    expect(response.body).not.toContain('Madeira');
    expect(response.body).not.toContain('FNC');
    expect(response.body).toContain('id="flightNumberEntry"');
    expect(response.body).toContain('id="flightNumberList"');
    expect(response.body).toContain('addFlightNumber');
    expect(response.body).toContain('scrollIntoView({');
    expect(response.body).toContain('#fe3a4d');
    expect(response.body).toContain("fetch('/arrivals'");
  });
});
