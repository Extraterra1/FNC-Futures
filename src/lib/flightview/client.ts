export interface FlightViewFlightLookupRequest {
  flightNumber: string;
  searchFlightNumber?: string;
  airportCode: string;
  arrivalDate: string;
}

type FlightViewLookupErrorCode =
  | 'not_found'
  | 'ambiguous_match'
  | 'flightview_unavailable'
  | 'parse_failed';

interface LookupError {
  kind: 'error';
  code: FlightViewLookupErrorCode;
  message: string;
}

interface LookupSuccess {
  kind: 'success';
  status: string;
  scheduledArrivalLocal?: string;
  estimatedArrivalLocal?: string;
  actualArrivalLocal?: string;
  sourceUrl: string;
}

interface FlightViewEndpointArrival {
  arrivalDateTime?: string | null;
  airportCode?: string | null;
  scheduledTime?: string | null;
  estimatedTime?: string | null;
  inGateTime?: string | null;
  onGroundTime?: string | null;
}

interface FlightViewEndpointDeparture {
  airportCode?: string | null;
}

interface FlightViewEndpointFlight {
  arrival?: FlightViewEndpointArrival | null;
  departure?: FlightViewEndpointDeparture | null;
  flightStatus?: string | null;
  scheduleInstanceKey?: string | null;
}

interface FlightViewEndpointFlightSummary {
  departureAirportCode?: string | null;
}

interface FlightViewEndpointResponse {
  flights?: FlightViewEndpointFlightSummary[];
  flight?: FlightViewEndpointFlight | null;
  emptyResults?: boolean;
}

interface FlightViewCandidate {
  departureDate: string;
  departureAirportCode?: string;
  flight: FlightViewEndpointFlight;
}

export type FlightViewFlightLookupResult = LookupSuccess | LookupError;
export type FlightViewFetch = (
  input: string,
  init?: {
    headers?: Record<string, string>;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

interface FlightViewClientOptions {
  fetch?: FlightViewFetch;
}

const FLIGHTVIEW_API_BASE_URL = 'https://app-api.flightview.com/api/v2/flight';
const FLIGHTVIEW_PAGE_BASE_URL = 'https://www.flightview.com/flight-tracker';
const FLIGHTVIEW_ORIGIN = 'https://www.flightview.com';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeStatus(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function parseFlightNumber(
  flightNumber: string,
): { airlineCode: string; flightNumber: string } | undefined {
  const normalized = flightNumber.trim().toUpperCase().replace(/\s+/g, '');

  if (normalized.length < 3) {
    return undefined;
  }

  return {
    airlineCode: normalized.slice(0, 2),
    flightNumber: normalized.slice(2),
  };
}

function subtractOneDay(date: string): string {
  const [year, month, day] = date.split('-').map((part) => Number.parseInt(part, 10));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().slice(0, 10);
}

function buildDepartureDates(arrivalDate: string): string[] {
  return [subtractOneDay(arrivalDate), arrivalDate];
}

function buildApiUrl(
  airlineCode: string,
  flightNumber: string,
  departureDate: string,
  departureAirportCode?: string,
): string {
  const url = new URL(
    `${FLIGHTVIEW_API_BASE_URL}/${encodeURIComponent(airlineCode)}/${encodeURIComponent(
      flightNumber,
    )}`,
  );

  url.searchParams.set('departureDate', departureDate);

  if (departureAirportCode) {
    url.searchParams.set('departureAirport', departureAirportCode);
  }

  return url.href;
}

function buildSourceUrl(
  airlineCode: string,
  flightNumber: string,
  departureDate: string,
  departureAirportCode?: string,
): string {
  const url = new URL(
    `${FLIGHTVIEW_PAGE_BASE_URL}/${encodeURIComponent(airlineCode)}/${encodeURIComponent(
      flightNumber,
    )}`,
  );

  url.searchParams.set('date', departureDate);

  if (departureAirportCode) {
    url.searchParams.set('depapt', departureAirportCode);
  }

  return url.href;
}

function extractDate(value: string | null | undefined): string | undefined {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1];
}

function extractTime(value: string | null | undefined): string | undefined {
  const isoMatch = value?.match(/T(\d{2}:\d{2})/);

  if (isoMatch?.[1]) {
    return isoMatch[1];
  }

  const match = value?.match(/\b(\d{1,2}:\d{2})\b/);
  return match?.[1];
}

function toEndpointResponse(payload: unknown): FlightViewEndpointResponse | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  return payload as FlightViewEndpointResponse;
}

async function fetchFlightViewResponse(
  fetchImpl: FlightViewFetch,
  airlineCode: string,
  flightNumber: string,
  departureDate: string,
  departureAirportCode?: string,
): Promise<FlightViewEndpointResponse | LookupError> {
  let response: Awaited<ReturnType<FlightViewFetch>>;

  try {
    response = await fetchImpl(
      buildApiUrl(airlineCode, flightNumber, departureDate, departureAirportCode),
      {
        headers: {
          accept: 'application/json',
          origin: FLIGHTVIEW_ORIGIN,
          referer: `${FLIGHTVIEW_PAGE_BASE_URL}/${airlineCode}/${flightNumber}?date=${departureDate}`,
        },
      },
    );
  } catch {
    return {
      kind: 'error',
      code: 'flightview_unavailable',
      message: `FlightView lookup failed for ${airlineCode}${flightNumber}`,
    };
  }

  if (!response.ok) {
    return {
      kind: 'error',
      code: 'flightview_unavailable',
      message: `FlightView lookup failed for ${airlineCode}${flightNumber}`,
    };
  }

  try {
    const payload = toEndpointResponse(await response.json());

    if (!payload) {
      throw new Error('FlightView response is not an object');
    }

    return payload;
  } catch {
    return {
      kind: 'error',
      code: 'parse_failed',
      message: `Unable to parse FlightView data for ${airlineCode}${flightNumber}`,
    };
  }
}

function toCandidate(
  flight: FlightViewEndpointFlight | null | undefined,
  departureDate: string,
  departureAirportCode?: string,
): FlightViewCandidate | undefined {
  if (!flight) {
    return undefined;
  }

  return {
    departureDate,
    departureAirportCode,
    flight,
  };
}

async function collectCandidates(
  fetchImpl: FlightViewFetch,
  airlineCode: string,
  flightNumber: string,
  departureDate: string,
): Promise<FlightViewCandidate[] | LookupError> {
  const response = await fetchFlightViewResponse(
    fetchImpl,
    airlineCode,
    flightNumber,
    departureDate,
  );

  if ('kind' in response) {
    return response;
  }

  const candidates = [
    toCandidate(response.flight, departureDate),
  ].filter((candidate): candidate is FlightViewCandidate => Boolean(candidate));

  for (const summary of response.flights ?? []) {
    const departureAirportCode = summary.departureAirportCode?.trim().toUpperCase();

    if (!departureAirportCode) {
      continue;
    }

    const detailResponse = await fetchFlightViewResponse(
      fetchImpl,
      airlineCode,
      flightNumber,
      departureDate,
      departureAirportCode,
    );

    if ('kind' in detailResponse) {
      return detailResponse;
    }

    const candidate = toCandidate(
      detailResponse.flight,
      departureDate,
      departureAirportCode,
    );

    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function deduplicateCandidates(candidates: FlightViewCandidate[]): FlightViewCandidate[] {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = [
      candidate.flight.scheduleInstanceKey,
      candidate.departureDate,
      candidate.departureAirportCode,
      candidate.flight.arrival?.airportCode,
      candidate.flight.arrival?.arrivalDateTime,
    ]
      .filter(Boolean)
      .join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function matchesArrival(
  candidate: FlightViewCandidate,
  airportCode: string,
  arrivalDate: string,
): boolean {
  return (
    normalize(candidate.flight.arrival?.airportCode ?? '') === normalize(airportCode) &&
    extractDate(candidate.flight.arrival?.arrivalDateTime) === arrivalDate
  );
}

function toSuccessResult(
  candidate: FlightViewCandidate,
  airlineCode: string,
  flightNumber: string,
): LookupSuccess {
  const arrival = candidate.flight.arrival;

  return {
    kind: 'success',
    status: normalizeStatus(candidate.flight.flightStatus ?? 'unknown'),
    scheduledArrivalLocal: extractTime(arrival?.arrivalDateTime),
    estimatedArrivalLocal: extractTime(arrival?.estimatedTime),
    actualArrivalLocal: extractTime(arrival?.inGateTime ?? arrival?.onGroundTime),
    sourceUrl: buildSourceUrl(
      airlineCode,
      flightNumber,
      candidate.departureDate,
      candidate.departureAirportCode,
    ),
  };
}

export async function lookupFlightViewArrival(
  request: FlightViewFlightLookupRequest,
  options: FlightViewClientOptions = {},
): Promise<FlightViewFlightLookupResult> {
  const parsedFlightNumber = parseFlightNumber(request.searchFlightNumber ?? request.flightNumber);

  if (!parsedFlightNumber) {
    return {
      kind: 'error',
      code: 'not_found',
      message: `No FlightView match found for ${request.flightNumber} arriving at ${request.airportCode} on ${request.arrivalDate}`,
    };
  }

  const fetchImpl = options.fetch ?? (globalThis.fetch as unknown as FlightViewFetch);
  const allCandidates: FlightViewCandidate[] = [];

  for (const departureDate of buildDepartureDates(request.arrivalDate)) {
    const candidates = await collectCandidates(
      fetchImpl,
      parsedFlightNumber.airlineCode,
      parsedFlightNumber.flightNumber,
      departureDate,
    );

    if ('kind' in candidates) {
      return candidates;
    }

    allCandidates.push(...candidates);
  }

  const matches = deduplicateCandidates(allCandidates).filter((candidate) =>
    matchesArrival(candidate, request.airportCode, request.arrivalDate),
  );

  if (matches.length === 0) {
    return {
      kind: 'error',
      code: 'not_found',
      message: `No FlightView match found for ${request.flightNumber} arriving at ${request.airportCode} on ${request.arrivalDate}`,
    };
  }

  if (matches.length > 1) {
    return {
      kind: 'error',
      code: 'ambiguous_match',
      message: `Multiple FlightView matches found for ${request.flightNumber} arriving at ${request.airportCode} on ${request.arrivalDate}`,
    };
  }

  return toSuccessResult(
    matches[0],
    parsedFlightNumber.airlineCode,
    parsedFlightNumber.flightNumber,
  );
}
