import {
  lookupFlightViewArrival,
  type FlightViewFlightLookupRequest,
  type FlightViewFlightLookupResult,
} from './client.js';
import {
  loadIcaoToIataMap,
  normalizeFlightNumberForLookup,
} from '../flight-number-normalizer.js';
import { type ArrivalsRequest } from '../../schemas/arrivals.js';

type ArrivalsErrorCode =
  | 'not_found'
  | 'ambiguous_match'
  | 'flightview_unavailable'
  | 'parse_failed';

interface ArrivalsFlightSuccess {
  flightNumber: string;
  status: string;
  scheduledArrivalLocal?: string;
  estimatedArrivalLocal?: string;
  actualArrivalLocal?: string;
  sourceUrl: string;
}

interface ArrivalsFlightError {
  flightNumber: string;
  error: {
    code: ArrivalsErrorCode;
    message: string;
  };
}

export type ArrivalsFlightResult = ArrivalsFlightSuccess | ArrivalsFlightError;

type SharedArrivalsFlightResult =
  | Omit<ArrivalsFlightSuccess, 'flightNumber'>
  | {
      error: {
        code: ArrivalsErrorCode;
      };
    };

export interface ArrivalsResponse {
  source: 'flightview';
  airportCode: string;
  arrivalDate: string;
  summary: {
    requested: number;
    resolved: number;
    failed: number;
  };
  results: ArrivalsFlightResult[];
}

export interface ArrivalsService {
  getArrivals(request: ArrivalsRequest): Promise<ArrivalsResponse>;
  close(): Promise<void>;
}

export class ArrivalsServiceBusyError extends Error {
  constructor(message = 'Another arrivals batch is already running') {
    super(message);
    this.name = 'ArrivalsServiceBusyError';
  }
}

interface FlightViewArrivalsServiceDependencies {
  lookupArrival?: (
    request: FlightViewFlightLookupRequest,
  ) => Promise<FlightViewFlightLookupResult>;
  normalizeFlightNumber?: (flightNumber: string) => string;
}

function createSummary(results: ArrivalsFlightResult[]) {
  const resolved = results.filter((result) => 'status' in result).length;

  return {
    requested: results.length,
    resolved,
    failed: results.length - resolved,
  };
}

function buildErrorMessage(
  request: ArrivalsRequest,
  flightNumber: string,
  code: ArrivalsErrorCode,
): string {
  if (code === 'not_found') {
    return `No FlightView match found for ${flightNumber} arriving at ${request.airportCode} on ${request.arrivalDate}`;
  }

  if (code === 'ambiguous_match') {
    return `Multiple FlightView matches found for ${flightNumber} arriving at ${request.airportCode} on ${request.arrivalDate}`;
  }

  if (code === 'parse_failed') {
    return `Unable to parse FlightView data for ${flightNumber}`;
  }

  return `FlightView lookup failed for ${flightNumber}`;
}

function toFlightResult(
  request: ArrivalsRequest,
  flightNumber: string,
  sharedResult: SharedArrivalsFlightResult,
): ArrivalsFlightResult {
  if ('status' in sharedResult) {
    return {
      flightNumber,
      status: sharedResult.status,
      scheduledArrivalLocal: sharedResult.scheduledArrivalLocal,
      estimatedArrivalLocal: sharedResult.estimatedArrivalLocal,
      actualArrivalLocal: sharedResult.actualArrivalLocal,
      sourceUrl: sharedResult.sourceUrl,
    };
  }

  return {
    flightNumber,
    error: {
      code: sharedResult.error.code,
      message: buildErrorMessage(request, flightNumber, sharedResult.error.code),
    },
  };
}

export class FlightViewArrivalsService implements ArrivalsService {
  private readonly lookupArrival: NonNullable<
    FlightViewArrivalsServiceDependencies['lookupArrival']
  >;
  private readonly normalizeFlightNumber: NonNullable<
    FlightViewArrivalsServiceDependencies['normalizeFlightNumber']
  >;
  private busy = false;

  constructor(dependencies: FlightViewArrivalsServiceDependencies = {}) {
    this.lookupArrival = dependencies.lookupArrival ?? lookupFlightViewArrival;
    const icaoToIataMap = loadIcaoToIataMap();
    this.normalizeFlightNumber =
      dependencies.normalizeFlightNumber ??
      ((flightNumber: string) =>
        normalizeFlightNumberForLookup(flightNumber, icaoToIataMap));
  }

  async getArrivals(request: ArrivalsRequest): Promise<ArrivalsResponse> {
    if (this.busy) {
      throw new ArrivalsServiceBusyError();
    }

    this.busy = true;

    try {
      const results: ArrivalsFlightResult[] = [];
      const sharedResults = new Map<string, SharedArrivalsFlightResult>();

      for (const flightNumber of request.flightNumbers) {
        const searchFlightNumber = this.normalizeFlightNumber(flightNumber);
        const sharedResult = sharedResults.get(searchFlightNumber);

        if (sharedResult) {
          results.push(toFlightResult(request, flightNumber, sharedResult));
          continue;
        }

        const resolvedResult = await this.resolveFlightResult(
          request,
          flightNumber,
          searchFlightNumber,
        );

        sharedResults.set(searchFlightNumber, resolvedResult);
        results.push(toFlightResult(request, flightNumber, resolvedResult));
      }

      return {
        source: 'flightview',
        airportCode: request.airportCode,
        arrivalDate: request.arrivalDate,
        summary: createSummary(results),
        results,
      };
    } finally {
      this.busy = false;
    }
  }

  async close(): Promise<void> {
    return undefined;
  }

  private async resolveFlightResult(
    request: ArrivalsRequest,
    flightNumber: string,
    searchFlightNumber: string,
  ): Promise<SharedArrivalsFlightResult> {
    const lookupResult = await this.lookupArrival({
      flightNumber,
      searchFlightNumber,
      airportCode: request.airportCode,
      arrivalDate: request.arrivalDate,
    });

    if (lookupResult.kind === 'error') {
      return {
        error: {
          code: lookupResult.code,
        },
      };
    }

    return {
      status: lookupResult.status,
      scheduledArrivalLocal: lookupResult.scheduledArrivalLocal,
      estimatedArrivalLocal: lookupResult.estimatedArrivalLocal,
      actualArrivalLocal: lookupResult.actualArrivalLocal,
      sourceUrl: lookupResult.sourceUrl,
    };
  }
}
