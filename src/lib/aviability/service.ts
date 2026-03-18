import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { type BrowserContext, type Page } from 'playwright';

import { type AppConfig } from '../../config.js';
import { launchAviabilityBrowser } from '../browser.js';
import {
  loadIcaoToIataMap,
  normalizeFlightNumberForLookup,
} from './flight-number-normalizer.js';
import {
  lookupAviabilityFlightPage,
  type AviabilityFlightLookupRequest,
  type AviabilityFlightLookupResult,
} from './client.js';
import {
  AviabilityBlockedError,
  AviabilityParseError,
  parseAviabilityArrivalPage,
} from './parser.js';
import { type ArrivalsRequest } from '../../schemas/arrivals.js';

type ArrivalsErrorCode =
  | 'not_found'
  | 'ambiguous_match'
  | 'blocked_by_aviability'
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
        message: string;
      };
    };

export interface ArrivalsResponse {
  source: 'aviability';
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

export class ArrivalsServiceBootstrapError extends Error {
  constructor(message = 'Aviability browser session could not be prepared') {
    super(message);
    this.name = 'ArrivalsServiceBootstrapError';
  }
}

interface AviabilityArrivalsServiceDependencies {
  launchBrowser?: typeof launchAviabilityBrowser;
  lookupFlightPage?: (
    page: Page,
    request: AviabilityFlightLookupRequest,
  ) => Promise<AviabilityFlightLookupResult>;
  parseArrivalPage?: typeof parseAviabilityArrivalPage;
  saveDebugArtifact?: (
    config: AppConfig,
    request: ArrivalsRequest,
    flightNumber: string,
    html: string,
  ) => Promise<void>;
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

function buildLookupErrorMessage(
  request: ArrivalsRequest,
  flightNumber: string,
  code: Extract<ArrivalsErrorCode, 'not_found' | 'ambiguous_match'>,
): string {
  if (code === 'not_found') {
    return `No Aviability match found for ${flightNumber} on ${request.arrivalDate} at ${request.airportCode}`;
  }

  return `Multiple Aviability matches found for ${flightNumber} on ${request.arrivalDate} at ${request.airportCode}`;
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

  const errorMessage =
    sharedResult.error.code === 'not_found' || sharedResult.error.code === 'ambiguous_match'
      ? buildLookupErrorMessage(request, flightNumber, sharedResult.error.code)
      : sharedResult.error.message;

  return {
    flightNumber,
    error: {
      code: sharedResult.error.code,
      message: errorMessage,
    },
  };
}

function sanitizeFilePart(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '-');
}

async function saveDebugArtifact(
  config: AppConfig,
  request: ArrivalsRequest,
  flightNumber: string,
  html: string,
): Promise<void> {
  await mkdir(config.debugArtifactsDir, {
    recursive: true,
  });

  const filename = [
    sanitizeFilePart(request.arrivalDate),
    sanitizeFilePart(request.airportCode),
    sanitizeFilePart(flightNumber),
  ].join('-');

  await writeFile(join(config.debugArtifactsDir, `${filename}.html`), html, 'utf8');
}

export class AviabilityArrivalsService implements ArrivalsService {
  private readonly launchBrowser: typeof launchAviabilityBrowser;
  private readonly lookupFlightPage: NonNullable<
    AviabilityArrivalsServiceDependencies['lookupFlightPage']
  >;
  private readonly parseArrivalPage: typeof parseAviabilityArrivalPage;
  private readonly saveDebugArtifact: NonNullable<
    AviabilityArrivalsServiceDependencies['saveDebugArtifact']
  >;
  private readonly normalizeFlightNumber: NonNullable<
    AviabilityArrivalsServiceDependencies['normalizeFlightNumber']
  >;
  private browserContext?: BrowserContext;
  private busy = false;

  constructor(
    private readonly config: AppConfig,
    dependencies: AviabilityArrivalsServiceDependencies = {},
  ) {
    this.launchBrowser = dependencies.launchBrowser ?? launchAviabilityBrowser;
    this.lookupFlightPage = dependencies.lookupFlightPage ?? lookupAviabilityFlightPage;
    this.parseArrivalPage = dependencies.parseArrivalPage ?? parseAviabilityArrivalPage;
    this.saveDebugArtifact = dependencies.saveDebugArtifact ?? saveDebugArtifact;
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
      const browserContext = await this.getBrowserContext();
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
          browserContext,
          request,
          flightNumber,
          searchFlightNumber,
        );

        sharedResults.set(searchFlightNumber, resolvedResult);
        results.push(toFlightResult(request, flightNumber, resolvedResult));
      }

      return {
        source: 'aviability',
        airportCode: request.airportCode,
        arrivalDate: request.arrivalDate,
        summary: createSummary(results),
        results,
      };
    } finally {
      await this.closeBrowserContext(this.browserContext);
      this.busy = false;
    }
  }

  async close(): Promise<void> {
    await this.closeBrowserContext(this.browserContext);
  }

  private async getBrowserContext(): Promise<BrowserContext> {
    if (this.browserContext) {
      return this.browserContext;
    }

    const browserContext = await this.launchBrowser(this.config);
    this.browserContext = browserContext;
    return browserContext;
  }

  private async resolveFlightResult(
    browserContext: BrowserContext,
    request: ArrivalsRequest,
    flightNumber: string,
    searchFlightNumber: string,
  ): Promise<SharedArrivalsFlightResult> {
    const page = await browserContext.newPage();
    let lookupHtml: string | undefined;

    try {
      const lookupResult = await this.lookupFlightPage(page, {
        flightNumber,
        searchFlightNumber,
        airportCode: request.airportCode,
        arrivalDate: request.arrivalDate,
      });

      if (lookupResult.kind === 'error') {
        return {
          error: {
            code: lookupResult.code,
            message: lookupResult.message,
          },
        };
      }

      lookupHtml = lookupResult.html;
      const parsedArrival = this.parseArrivalPage(lookupResult.html);
      return {
        status: parsedArrival.status,
        scheduledArrivalLocal: parsedArrival.scheduledArrivalLocal,
        estimatedArrivalLocal: parsedArrival.estimatedArrivalLocal,
        actualArrivalLocal: parsedArrival.actualArrivalLocal,
        sourceUrl: lookupResult.sourceUrl,
      };
    } catch (error) {
      if (error instanceof AviabilityBlockedError) {
        return {
          error: {
            code: 'blocked_by_aviability',
            message: `Aviability blocked the browser session while parsing ${flightNumber}`,
          },
        };
      }

      if (error instanceof AviabilityParseError) {
        if (lookupHtml) {
          await this.saveDebugArtifact(this.config, request, flightNumber, lookupHtml);
        }

        return {
          error: {
            code: 'parse_failed',
            message: `Unable to parse Aviability arrival data for ${flightNumber}`,
          },
        };
      }

      throw error;
    } finally {
      await page.close();
    }
  }

  private async closeBrowserContext(
    browserContext: BrowserContext | undefined,
  ): Promise<void> {
    if (!browserContext || this.browserContext !== browserContext) {
      return;
    }

    this.browserContext = undefined;
    await browserContext.close();
  }
}
