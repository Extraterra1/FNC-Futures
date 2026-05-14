import { type Page } from 'playwright';

export interface AviabilityFlightLookupRequest {
  flightNumber: string;
  searchFlightNumber?: string;
  airportCode: string;
  arrivalDate: string;
}

export interface AviabilityFlightCandidate {
  href: string;
  text: string;
  date?: string;
  dataUrl?: string;
}

interface CalendarFlightDate {
  date: string;
  text: string;
}

type LookupErrorCode = 'not_found' | 'ambiguous_match' | 'blocked_by_aviability';

interface MatchSuccess {
  kind: 'success';
  candidate: AviabilityFlightCandidate;
}

interface LookupError {
  kind: 'error';
  code: LookupErrorCode;
  message: string;
}

interface LookupSuccess {
  kind: 'success';
  sourceUrl: string;
  html: string;
}

interface OpenedFlightCandidate {
  sourceUrl: string;
  html: string;
}

export type FlightCandidateMatchResult = MatchSuccess | LookupError;
export type AviabilityFlightLookupResult = LookupSuccess | LookupError;

const AVIABILITY_FLIGHT_SEARCH_URL = 'https://aviability.com/en/flight';
const AUTOMATED_TRAFFIC_MESSAGE = 'this page is normally shown to automated traffic';
const FLIGHT_NUMBER_SELECTOR = '#flight_number';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatShortDate(date: string): string {
  const [year, month, day] = date.split('-').map((value) => Number.parseInt(value, 10));
  const formatted = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  return normalize(formatted.replace(',', ''));
}

function formatLongDate(date: string): string {
  const [year, month, day] = date.split('-').map((value) => Number.parseInt(value, 10));
  const formatted = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  });

  return normalize(formatted);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function looksBlocked(html: string): boolean {
  return normalize(html).includes(AUTOMATED_TRAFFIC_MESSAGE);
}

function htmlMatchesDate(html: string, date: string): boolean {
  return normalize(html).includes(formatLongDate(date));
}

function matchesAirport(candidate: AviabilityFlightCandidate, airportCode: string): boolean {
  const normalizedAirportCode = normalize(airportCode);
  const normalizedHref = normalize(candidate.href);
  const normalizedText = normalize(candidate.text);
  const routeAirportCodes = extractRouteAirportCodes(candidate.href);

  if (routeAirportCodes) {
    return routeAirportCodes.arrivalAirportCode === normalizedAirportCode;
  }

  return (
    normalizedHref.includes(`-${normalizedAirportCode}`) ||
    normalizedText.includes(normalizedAirportCode)
  );
}

function matchesDate(candidate: AviabilityFlightCandidate, arrivalDate: string): boolean {
  const normalizedDate = normalize(arrivalDate);
  const normalizedCandidateDate = normalize(candidate.date ?? '');
  const normalizedText = normalize(candidate.text);
  const normalizedHref = normalize(candidate.href);
  const shortDatePattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(formatShortDate(arrivalDate))}($|[^0-9])`,
  );

  if (normalizedCandidateDate) {
    return normalizedCandidateDate === normalizedDate;
  }

  return (
    normalizedHref.includes(normalizedDate) ||
    shortDatePattern.test(normalizedText)
  );
}

function extractRouteAirportCodes(
  href: string,
): { departureAirportCode: string; arrivalAirportCode: string } | undefined {
  try {
    const { pathname } = new URL(href);
    const routeSegment = pathname
      .split('/')
      .find((segment) => /^[a-z]{3}-[a-z]{3}$/i.test(segment));

    if (!routeSegment) {
      return undefined;
    }

    const [departureAirportCode, arrivalAirportCode] = routeSegment.split('-').map(normalize);

    return {
      departureAirportCode,
      arrivalAirportCode,
    };
  } catch {
    return undefined;
  }
}

function deduplicateCandidates(
  candidates: AviabilityFlightCandidate[],
): AviabilityFlightCandidate[] {
  const seenHrefs = new Set<string>();

  return candidates.filter((candidate) => {
    const normalizedHref = [normalize(candidate.href), normalize(candidate.date ?? '')].join('|');

    if (seenHrefs.has(normalizedHref)) {
      return false;
    }

    seenHrefs.add(normalizedHref);
    return true;
  });
}

async function collectFlightCandidates(page: Page): Promise<AviabilityFlightCandidate[]> {
  const datedResultCandidates = await page.locator('[data-url][data-date]').evaluateAll((elements) =>
    elements
      .map((element) => {
        const dataUrl = element.getAttribute('data-url') ?? '';
        const date = element.getAttribute('data-date') ?? '';
        const title = element.getAttribute('title')?.trim() ?? '';
        const text = element.textContent?.trim() ?? '';

        return {
          href: dataUrl ? new URL(dataUrl, window.location.href).href : '',
          text: [title, text].filter(Boolean).join(' '),
          date,
          dataUrl,
        };
      })
      .filter(
        (candidate) =>
          candidate.href.includes('/en/flight') &&
          candidate.date.length > 0 &&
          candidate.text.length > 0,
      ),
  );
  const anchorCandidates = await page.locator('a').evaluateAll((anchors) =>
    anchors
      .map((anchor) => ({
        href: anchor instanceof HTMLAnchorElement ? anchor.href : '',
        text: anchor.textContent?.trim() ?? '',
      }))
      .filter((anchor) => anchor.href.includes('/en/flight') && anchor.text.length > 0),
  );
  const calendarDates = await page.locator('time[datetime]').evaluateAll((elements) =>
    elements
      .map((element) => ({
        date: element.getAttribute('datetime') ?? '',
        text: element.textContent?.trim() ?? '',
      }))
      .filter(
        (calendarDate): calendarDate is CalendarFlightDate =>
          /^\d{4}-\d{2}-\d{2}$/.test(calendarDate.date) &&
          /^\d{1,2}$/.test(calendarDate.text),
      ),
  );
  const routeCandidates = anchorCandidates.filter((candidate) =>
    extractRouteAirportCodes(candidate.href),
  );
  const calendarDateCandidates = routeCandidates.flatMap((candidate) => {
    const { pathname } = new URL(candidate.href);

    return calendarDates.map((calendarDate) => ({
      href: candidate.href,
      text: `${calendarDate.date} ${candidate.text}`,
      date: calendarDate.date,
      dataUrl: pathname,
    }));
  });

  return [...datedResultCandidates, ...calendarDateCandidates, ...anchorCandidates];
}

export function findMatchingFlightCandidate(
  candidates: AviabilityFlightCandidate[],
  request: AviabilityFlightLookupRequest,
): FlightCandidateMatchResult {
  const matches = deduplicateCandidates(candidates).filter(
    (candidate) =>
      matchesAirport(candidate, request.airportCode) &&
      matchesDate(candidate, request.arrivalDate),
  );

  if (matches.length === 0) {
    return {
      kind: 'error',
      code: 'not_found',
      message: `No Aviability match found for ${request.flightNumber} on ${request.arrivalDate} at ${request.airportCode}`,
    };
  }

  if (matches.length > 1) {
    return {
      kind: 'error',
      code: 'ambiguous_match',
      message: `Multiple Aviability matches found for ${request.flightNumber} on ${request.arrivalDate} at ${request.airportCode}`,
    };
  }

  return {
    kind: 'success',
    candidate: matches[0],
  };
}

function ensureHtmlIsNotBlocked(
  html: string,
  message: string,
): { kind: 'success'; html: string } | LookupError {
  if (looksBlocked(html)) {
    return {
      kind: 'error',
      code: 'blocked_by_aviability',
      message,
    };
  }

  return {
    kind: 'success',
    html,
  };
}

async function ensurePageIsNotBlocked(
  page: Page,
  message: string,
): Promise<{ kind: 'success'; html: string } | LookupError> {
  return ensureHtmlIsNotBlocked(await page.content(), message);
}

async function openMatchedFlightCandidate(
  page: Page,
  candidate: AviabilityFlightCandidate,
): Promise<OpenedFlightCandidate> {
  if (candidate.date) {
    await Promise.all([
      page.waitForNavigation({
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      }),
      page.evaluate(
        ({ date, href }) => {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = href;

          const dateInput = document.createElement('input');
          dateInput.type = 'hidden';
          dateInput.name = 'date';
          dateInput.value = date;

          form.append(dateInput);
          document.body.append(form);
          form.submit();
        },
        {
          date: candidate.date,
          href: candidate.href,
        },
      ),
    ]);

    return {
      sourceUrl: page.url(),
      html: await page.content(),
    };
  }

  await page.goto(candidate.href, {
    timeout: 30000,
    waitUntil: 'domcontentloaded',
  });

  return {
    sourceUrl: page.url(),
    html: await page.content(),
  };
}

export async function lookupAviabilityFlightPage(
  page: Page,
  request: AviabilityFlightLookupRequest,
): Promise<AviabilityFlightLookupResult> {
  await page.goto(AVIABILITY_FLIGHT_SEARCH_URL, {
    timeout: 30000,
    waitUntil: 'domcontentloaded',
  });

  const blockedOnSearch = await ensurePageIsNotBlocked(
    page,
    'Aviability blocked the browser session while loading flight search',
  );
  if (blockedOnSearch.kind === 'error') {
    return blockedOnSearch;
  }

  await page
    .locator(FLIGHT_NUMBER_SELECTOR)
    .fill(request.searchFlightNumber ?? request.flightNumber);
  await page.getByRole('button', { name: /track/i }).click();
  await page.waitForLoadState('domcontentloaded');

  const blockedOnResults = await ensurePageIsNotBlocked(
    page,
    'Aviability blocked the browser session while loading flight search results',
  );
  if (blockedOnResults.kind === 'error') {
    return blockedOnResults;
  }

  const candidates = await collectFlightCandidates(page);
  const match = findMatchingFlightCandidate(candidates, request);

  if (match.kind === 'error') {
    return match;
  }

  const openedCandidate = await openMatchedFlightCandidate(page, match.candidate);

  const blockedOnDetails = ensureHtmlIsNotBlocked(
    openedCandidate.html,
    'Aviability blocked the browser session while loading flight details',
  );
  if (blockedOnDetails.kind === 'error') {
    return blockedOnDetails;
  }

  if (match.candidate.date && !htmlMatchesDate(blockedOnDetails.html, request.arrivalDate)) {
    return {
      kind: 'error',
      code: 'not_found',
      message: `Aviability returned details for ${request.flightNumber} on a different date than ${request.arrivalDate}`,
    };
  }

  return {
    kind: 'success',
    sourceUrl: openedCandidate.sourceUrl,
    html: blockedOnDetails.html,
  };
}
