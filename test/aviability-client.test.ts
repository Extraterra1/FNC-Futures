import { describe, expect, test, vi } from 'vitest';

import {
  findMatchingFlightCandidate,
  lookupAviabilityFlightPage,
  type AviabilityFlightCandidate,
} from '../src/lib/aviability/client.js';

describe('findMatchingFlightCandidate', () => {
  test('selects the candidate that matches the requested arrival airport and date', () => {
    const candidates: AviabilityFlightCandidate[] = [
      {
        href: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr',
        text: 'Mar 16 New York City London Planned',
      },
      {
        href: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
        text: 'Mar 17 New York City London Planned',
      },
      {
        href: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-cdg/2026-03-17',
        text: 'Mar 17 New York City Paris Planned',
      },
    ];

    expect(
      findMatchingFlightCandidate(candidates, {
        flightNumber: 'AA100',
        airportCode: 'LHR',
        arrivalDate: '2026-03-17',
      }),
    ).toEqual({
      kind: 'success',
      candidate: candidates[1],
    });
  });

  test('returns ambiguous_match when multiple candidates satisfy the same airport and date', () => {
    const candidates: AviabilityFlightCandidate[] = [
      {
        href: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
        text: 'Mar 17 New York City London Planned',
      },
      {
        href: 'https://aviability.com/en/flight/ba1511-british-airways/jfk-lhr/2026-03-17',
        text: 'Mar 17 New York City London Planned',
      },
    ];

    expect(
      findMatchingFlightCandidate(candidates, {
        flightNumber: 'AA100',
        airportCode: 'LHR',
        arrivalDate: '2026-03-17',
      }),
    ).toEqual({
      kind: 'error',
      code: 'ambiguous_match',
      message: 'Multiple Aviability matches found for AA100 on 2026-03-17 at LHR',
    });
  });

  test('deduplicates repeated anchors that point to the same flight detail page', () => {
    const candidates: AviabilityFlightCandidate[] = [
      {
        href: 'https://aviability.com/en/flight/u27631-easyjet/lis-fnc/2026-03-19',
        text: 'Mar 19 Lisbon Funchal Planned',
      },
      {
        href: 'https://aviability.com/en/flight/u27631-easyjet/lis-fnc/2026-03-19',
        text: '19',
      },
    ];

    expect(
      findMatchingFlightCandidate(candidates, {
        flightNumber: 'U27631',
        airportCode: 'FNC',
        arrivalDate: '2026-03-19',
      }),
    ).toEqual({
      kind: 'success',
      candidate: candidates[0],
    });
  });
});

describe('lookupAviabilityFlightPage', () => {
  test('fills the visible flight number field', async () => {
    const fill = vi.fn(async () => undefined);
    const click = vi.fn(async () => undefined);
    const evaluateAll = vi.fn(async () => [
      {
        href: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
        text: 'Mar 17 New York City London Planned',
      },
    ]);
    const content = vi
      .fn()
      .mockResolvedValueOnce('<html><body>Flight Status and Schedule</body></html>')
      .mockResolvedValueOnce('<html><body>search results</body></html>')
      .mockResolvedValueOnce('<html><body>Flight Status Planned Arrival Scheduled arrival time 06:20</body></html>');

    const page = {
      goto: vi.fn(async () => undefined),
      content,
      locator: vi.fn((selector: string) => {
        if (selector === '#flight_number') {
          return { fill };
        }

        if (selector === 'a') {
          return { evaluateAll };
        }

        return { evaluateAll };
      }),
      getByRole: vi.fn(() => ({ click })),
      waitForLoadState: vi.fn(async () => undefined),
      url: vi.fn(() => 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17'),
    };

    const result = await lookupAviabilityFlightPage(page as never, {
      flightNumber: 'AA100',
      airportCode: 'LHR',
      arrivalDate: '2026-03-17',
    });

    expect(page.locator).toHaveBeenCalledWith('#flight_number');
    expect(fill).toHaveBeenCalledWith('AA100');
    expect(click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      kind: 'success',
      sourceUrl: 'https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17',
      html: '<html><body>Flight Status Planned Arrival Scheduled arrival time 06:20</body></html>',
    });
  });

  test('returns blocked_by_aviability when the flight search page is challenged', async () => {
    const inputLocator = {
      fill: vi.fn(async () => undefined),
    };
    const anchorLocator = {
      evaluateAll: vi.fn(async () => []),
    };
    const buttonLocator = {
      click: vi.fn(async () => undefined),
    };

    const page = {
      goto: vi.fn(async () => undefined),
      content: vi
        .fn()
        .mockResolvedValueOnce(`
          <html>
            <body>
              <h1>Feedback</h1>
              <p>This page is normally shown to automated traffic.</p>
            </body>
          </html>
        `),
      locator: vi.fn((selector: string) => {
        if (selector === '#flight_number') {
          return inputLocator;
        }

        if (selector === 'a') {
          return anchorLocator;
        }

        return anchorLocator;
      }),
      getByRole: vi.fn(() => buttonLocator),
      waitForLoadState: vi.fn(async () => undefined),
      url: vi.fn(() => 'https://aviability.com/en/flight'),
    };

    await expect(
      lookupAviabilityFlightPage(page as never, {
        flightNumber: 'AA100',
        airportCode: 'LHR',
        arrivalDate: '2026-03-17',
      }),
    ).resolves.toEqual({
      kind: 'error',
      code: 'blocked_by_aviability',
      message: 'Aviability blocked the browser session while loading flight search',
    });
  });
});
