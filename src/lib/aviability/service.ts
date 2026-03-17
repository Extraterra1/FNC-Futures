import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { type BrowserContext, type Page } from 'playwright';

import { type AppConfig } from '../../config.js';
import {
  AVIABILITY_PROFILE_DIR_ERROR,
  launchAviabilityBrowser,
} from '../browser.js';
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
  constructor(message = 'Aviability browser profile is not configured or ready') {
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
}

function createSummary(results: ArrivalsFlightResult[]) {
  const resolved = results.filter((result) => 'status' in result).length;

  return {
    requested: results.length,
    resolved,
    failed: results.length - resolved,
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
  }

  async getArrivals(request: ArrivalsRequest): Promise<ArrivalsResponse> {
    if (this.busy) {
      throw new ArrivalsServiceBusyError();
    }

    this.busy = true;

    try {
      const browserContext = await this.getBrowserContext();
      const results: ArrivalsFlightResult[] = [];

      for (const flightNumber of request.flightNumbers) {
        const page = await browserContext.newPage();
        let lookupHtml: string | undefined;

        try {
          const lookupResult = await this.lookupFlightPage(page, {
            flightNumber,
            airportCode: request.airportCode,
            arrivalDate: request.arrivalDate,
          });

          if (lookupResult.kind === 'error') {
            results.push({
              flightNumber,
              error: {
                code: lookupResult.code,
                message: lookupResult.message,
              },
            });
            continue;
          }

          lookupHtml = lookupResult.html;
          const parsedArrival = this.parseArrivalPage(lookupResult.html);
          results.push({
            flightNumber,
            status: parsedArrival.status,
            scheduledArrivalLocal: parsedArrival.scheduledArrivalLocal,
            estimatedArrivalLocal: parsedArrival.estimatedArrivalLocal,
            actualArrivalLocal: parsedArrival.actualArrivalLocal,
            sourceUrl: lookupResult.sourceUrl,
          });
        } catch (error) {
          if (error instanceof AviabilityBlockedError) {
            results.push({
              flightNumber,
              error: {
                code: 'blocked_by_aviability',
                message: `Aviability blocked the browser session while parsing ${flightNumber}`,
              },
            });
            continue;
          }

          if (error instanceof AviabilityParseError) {
            if (lookupHtml) {
              await this.saveDebugArtifact(this.config, request, flightNumber, lookupHtml);
            }

            results.push({
              flightNumber,
              error: {
                code: 'parse_failed',
                message: `Unable to parse Aviability arrival data for ${flightNumber}`,
              },
            });
            continue;
          }

          throw error;
        } finally {
          await page.close();
        }
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

    try {
      const browserContext = await this.launchBrowser(this.config);
      this.browserContext = browserContext;
      return browserContext;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === AVIABILITY_PROFILE_DIR_ERROR
      ) {
        throw new ArrivalsServiceBootstrapError();
      }

      throw error;
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
