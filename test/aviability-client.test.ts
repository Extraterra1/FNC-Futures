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

  test('does not match routes where the requested airport is the departure airport', () => {
    const candidates: AviabilityFlightCandidate[] = [
      {
        href: 'https://aviability.com/en/flight/u27628-easyjet/fnc-lis',
        text: 'Apr 27 Funchal Lisbon Planned',
      },
    ];

    expect(
      findMatchingFlightCandidate(candidates, {
        flightNumber: 'U27628',
        airportCode: 'FNC',
        arrivalDate: '2026-04-27',
      }),
    ).toEqual({
      kind: 'error',
      code: 'not_found',
      message: 'No Aviability match found for U27628 on 2026-04-27 at FNC',
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

  test('opens current Aviability dated result blocks for the requested date', async () => {
    const fill = vi.fn(async () => undefined);
    const clickTrack = vi.fn(async () => undefined);
    const waitForResponse = vi.fn(async () => {
      throw new Error('response timed out');
    });
    const anchorEvaluateAll = vi.fn(async () => []);
    const datedResultEvaluateAll = vi.fn(async () => [
      {
        href: 'https://aviability.com/en/flight/tp1685-tap-air-portugal/lis-fnc',
        text: '27 April 2026: Status and tracking information for flight TP 1685 from Lisbon to Funchal (LIS-FNC)',
        date: '2026-04-27',
        dataUrl: '/en/flight/tp1685-tap-air-portugal/lis-fnc',
      },
    ]);
    const dateLocator = {
      count: vi.fn(async () => 1),
    };
    const content = vi
      .fn()
      .mockResolvedValueOnce('<html><body>Flight Status and Schedule</body></html>')
      .mockResolvedValueOnce('<html><body>search results</body></html>')
      .mockResolvedValueOnce('<html><body>Flight Status Planned Arrival Scheduled arrival time Apr 27, 08:20</body></html>');

    const page = {
      goto: vi.fn(async () => undefined),
      content,
      locator: vi.fn((selector: string) => {
        if (selector === '#flight_number') {
          return { fill };
        }

        if (selector === 'a') {
          return { evaluateAll: anchorEvaluateAll };
        }

        if (selector === '[data-url][data-date]') {
          return { evaluateAll: datedResultEvaluateAll };
        }

        if (
          selector ===
          '[data-url="/en/flight/tp1685-tap-air-portugal/lis-fnc"][data-date="2026-04-27"]'
        ) {
          return dateLocator;
        }

        return { evaluateAll: vi.fn(async () => []) };
      }),
      getByRole: vi.fn(() => ({ click: clickTrack })),
      waitForLoadState: vi.fn(async () => undefined),
      waitForResponse,
      url: vi.fn(() => 'https://aviability.com/en/flight/tp1685-tap-air-portugal/lis-fnc/2026-04-27'),
    };

    const result = await lookupAviabilityFlightPage(page as never, {
      flightNumber: 'TP1685',
      airportCode: 'FNC',
      arrivalDate: '2026-04-27',
    });

    expect(datedResultEvaluateAll).toHaveBeenCalledTimes(1);
    expect(dateLocator.count).not.toHaveBeenCalled();
    expect(waitForResponse).not.toHaveBeenCalled();
    expect(page.goto).toHaveBeenLastCalledWith(
      'https://aviability.com/en/flight/tp1685-tap-air-portugal/lis-fnc/2026-04-27',
      {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      },
    );
    expect(result).toEqual({
      kind: 'success',
      sourceUrl: 'https://aviability.com/en/flight/tp1685-tap-air-portugal/lis-fnc/2026-04-27',
      html: '<html><body>Flight Status Planned Arrival Scheduled arrival time Apr 27, 08:20</body></html>',
    });
  });

  test('does not append the date twice when a dated Aviability URL is already selected', async () => {
    const fill = vi.fn(async () => undefined);
    const clickTrack = vi.fn(async () => undefined);
    const anchorEvaluateAll = vi.fn(async () => [
      {
        href: 'https://aviability.com/en/flight/tp1685-tap-air-portugal/lis-fnc/2026-04-27',
        text: 'Apr 27 Lisbon Funchal Planned',
      },
    ]);
    const content = vi
      .fn()
      .mockResolvedValueOnce('<html><body>Flight Status and Schedule</body></html>')
      .mockResolvedValueOnce('<html><body>search results</body></html>')
      .mockResolvedValueOnce('<html><body>Flight Status Planned Arrival Scheduled arrival time Apr 27, 08:20</body></html>');

    const page = {
      goto: vi.fn(async () => undefined),
      content,
      locator: vi.fn((selector: string) => {
        if (selector === '#flight_number') {
          return { fill };
        }

        if (selector === 'a') {
          return { evaluateAll: anchorEvaluateAll };
        }

        return { evaluateAll: vi.fn(async () => []) };
      }),
      getByRole: vi.fn(() => ({ click: clickTrack })),
      waitForLoadState: vi.fn(async () => undefined),
      url: vi.fn(() => 'https://aviability.com/en/flight/tp1685-tap-air-portugal/lis-fnc/2026-04-27'),
    };

    const result = await lookupAviabilityFlightPage(page as never, {
      flightNumber: 'TP1685',
      airportCode: 'FNC',
      arrivalDate: '2026-04-27',
    });

    expect(page.goto).toHaveBeenLastCalledWith(
      'https://aviability.com/en/flight/tp1685-tap-air-portugal/lis-fnc/2026-04-27',
      {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      },
    );
    expect(result).toEqual({
      kind: 'success',
      sourceUrl: 'https://aviability.com/en/flight/tp1685-tap-air-portugal/lis-fnc/2026-04-27',
      html: '<html><body>Flight Status Planned Arrival Scheduled arrival time Apr 27, 08:20</body></html>',
    });
  });

  test('opens calendar-only Aviability dates by direct dated URL', async () => {
    const fill = vi.fn(async () => undefined);
    const clickTrack = vi.fn(async () => undefined);
    const waitForResponse = vi.fn(async () => {
      throw new Error('response timed out');
    });
    const datedResultEvaluateAll = vi.fn(async () => []);
    const anchorEvaluateAll = vi.fn(async () => [
      {
        href: 'https://aviability.com/en/flight/ib559-iberia/mad-fnc',
        text: 'latest status of flight IB559 from Madrid to Funchal',
      },
    ]);
    const calendarEvaluateAll = vi.fn(async () => [
      {
        date: '2026-04-29',
        text: '29',
      },
    ]);
    const calendarClickable = {
      count: vi.fn(async () => 1),
      first: vi.fn(() => ({
        click: vi.fn(async () => undefined),
      })),
    };
    const missingDatedResult = {
      count: vi.fn(async () => 0),
    };
    const calendarLocator = {
      filter: vi.fn(() => calendarClickable),
    };
    const content = vi
      .fn()
      .mockResolvedValueOnce('<html><body>Flight Status and Schedule</body></html>')
      .mockResolvedValueOnce('<html><body>search results with departure calendar</body></html>')
      .mockResolvedValueOnce('<html><body>Flight Status Planned Arrival Scheduled time Apr 29, 12:55</body></html>');

    const page = {
      goto: vi.fn(async () => undefined),
      content,
      locator: vi.fn((selector: string) => {
        if (selector === '#flight_number') {
          return { fill };
        }

        if (selector === '[data-url][data-date]') {
          return { evaluateAll: datedResultEvaluateAll };
        }

        if (selector === 'a') {
          return { evaluateAll: anchorEvaluateAll };
        }

        if (selector === 'time[datetime]') {
          return { evaluateAll: calendarEvaluateAll };
        }

        if (
          selector ===
          '[data-url="/en/flight/ib559-iberia/mad-fnc"][data-date="2026-04-29"]'
        ) {
          return missingDatedResult;
        }

        if (selector === 'time[datetime="2026-04-29"]') {
          return calendarLocator;
        }

        return { evaluateAll: vi.fn(async () => []) };
      }),
      getByRole: vi.fn(() => ({ click: clickTrack })),
      waitForLoadState: vi.fn(async () => undefined),
      waitForResponse,
      url: vi.fn(() => 'https://aviability.com/en/flight/ib559-iberia/mad-fnc/2026-04-29'),
    };

    const result = await lookupAviabilityFlightPage(page as never, {
      flightNumber: 'IB559',
      airportCode: 'FNC',
      arrivalDate: '2026-04-29',
    });

    expect(calendarEvaluateAll).toHaveBeenCalledTimes(1);
    expect(missingDatedResult.count).not.toHaveBeenCalled();
    expect(calendarLocator.filter).not.toHaveBeenCalled();
    expect(calendarClickable.count).not.toHaveBeenCalled();
    expect(waitForResponse).not.toHaveBeenCalled();
    expect(page.goto).toHaveBeenLastCalledWith(
      'https://aviability.com/en/flight/ib559-iberia/mad-fnc/2026-04-29',
      {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      },
    );
    expect(result).toEqual({
      kind: 'success',
      sourceUrl: 'https://aviability.com/en/flight/ib559-iberia/mad-fnc/2026-04-29',
      html: '<html><body>Flight Status Planned Arrival Scheduled time Apr 29, 12:55</body></html>',
    });
  });

});
