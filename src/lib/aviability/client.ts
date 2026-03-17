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

function looksBlocked(html: string): boolean {
  return normalize(html).includes(AUTOMATED_TRAFFIC_MESSAGE);
}

function matchesAirport(candidate: AviabilityFlightCandidate, airportCode: string): boolean {
  const normalizedAirportCode = normalize(airportCode);
  const normalizedHref = normalize(candidate.href);
  const normalizedText = normalize(candidate.text);

  return (
    normalizedHref.includes(`-${normalizedAirportCode}`) ||
    normalizedHref.includes(`/${normalizedAirportCode}`) ||
    normalizedText.includes(normalizedAirportCode)
  );
}

function matchesDate(candidate: AviabilityFlightCandidate, arrivalDate: string): boolean {
  const normalizedDate = normalize(arrivalDate);
  const normalizedText = normalize(candidate.text);
  const normalizedHref = normalize(candidate.href);

  return (
    normalizedHref.includes(normalizedDate) ||
    normalizedText.includes(formatShortDate(arrivalDate))
  );
}

async function collectFlightCandidates(page: Page): Promise<AviabilityFlightCandidate[]> {
  return page.locator('a').evaluateAll((anchors) =>
    anchors
      .map((anchor) => ({
        href: anchor instanceof HTMLAnchorElement ? anchor.href : '',
        text: anchor.textContent?.trim() ?? '',
      }))
      .filter((anchor) => anchor.href.includes('/en/flight') && anchor.text.length > 0),
  );
}

export function findMatchingFlightCandidate(
  candidates: AviabilityFlightCandidate[],
  request: AviabilityFlightLookupRequest,
): FlightCandidateMatchResult {
  const matches = candidates.filter(
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

async function ensurePageIsNotBlocked(
  page: Page,
  message: string,
): Promise<{ kind: 'success'; html: string } | LookupError> {
  const html = await page.content();

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

  await page.goto(match.candidate.href, {
    timeout: 30000,
    waitUntil: 'domcontentloaded',
  });

  const blockedOnDetails = await ensurePageIsNotBlocked(
    page,
    'Aviability blocked the browser session while loading flight details',
  );
  if (blockedOnDetails.kind === 'error') {
    return blockedOnDetails;
  }

  return {
    kind: 'success',
    sourceUrl: page.url(),
    html: blockedOnDetails.html,
  };
}
