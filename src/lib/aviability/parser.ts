import { load, type CheerioAPI } from 'cheerio';
import { type Element } from 'domhandler';

export interface ParsedAviabilityArrivalPage {
  status: string;
  scheduledArrivalLocal?: string;
  estimatedArrivalLocal?: string;
  actualArrivalLocal?: string;
}

export class AviabilityBlockedError extends Error {
  constructor(message = 'Aviability blocked the browser session') {
    super(message);
    this.name = 'AviabilityBlockedError';
  }
}

export class AviabilityParseError extends Error {
  constructor(message = 'Unable to parse Aviability arrival data') {
    super(message);
    this.name = 'AviabilityParseError';
  }
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeStatus(value: string): string {
  return normalizeWhitespace(value).toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function isTimeLike(value: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(value);
}

function findAssociatedValue($: CheerioAPI, element: Element): string | undefined {
  const current = $(element);
  const next = current.next();

  if (next.length > 0) {
    const value = normalizeWhitespace(next.first().text());
    if (value) {
      return value;
    }
  }

  const parent = current.parent();
  const siblings = parent.children();
  const currentIndex = siblings.toArray().findIndex((child) => child === element);

  if (currentIndex >= 0) {
    for (const sibling of siblings.toArray().slice(currentIndex + 1)) {
      const value = normalizeWhitespace($(sibling).text());
      if (value) {
        return value;
      }
    }
  }

  return undefined;
}

function extractValueByLabel(
  $: CheerioAPI,
  patterns: RegExp[],
): string | undefined {
  const elements = $('dt, th, div, span, strong, b, td');

  for (const element of elements.toArray()) {
    const label = normalizeWhitespace($(element).text());

    if (!label) {
      continue;
    }

    if (!patterns.some((pattern) => pattern.test(label))) {
      continue;
    }

    const value = findAssociatedValue($, element);
    if (value && isTimeLike(value)) {
      return value;
    }
  }

  return undefined;
}

function extractStatus($: CheerioAPI): string | undefined {
  const statusCandidates = [
    '.flight-status',
    '.status-chip',
    '[class*="status"]',
    '[data-status]',
  ];

  for (const selector of statusCandidates) {
    for (const element of $(selector).toArray()) {
      const text = normalizeWhitespace($(element).text());
      if (text && !/flight status/i.test(text)) {
        return normalizeStatus(text);
      }
    }
  }

  const bodyText = normalizeWhitespace($('body').text());
  const match = bodyText.match(/\bstatus\b[:\s]+([A-Za-z ]+)/i);

  if (match?.[1]) {
    return normalizeStatus(match[1]);
  }

  return undefined;
}

function isFeedbackPageText(bodyText: string): boolean {
  return bodyText.includes('this page is normally shown to automated traffic');
}

export function parseAviabilityArrivalPage(html: string): ParsedAviabilityArrivalPage {
  const $ = load(html);
  const bodyText = normalizeWhitespace($('body').text()).toLowerCase();

  if (isFeedbackPageText(bodyText)) {
    throw new AviabilityBlockedError();
  }

  const status = extractStatus($);
  const scheduledArrivalLocal = extractValueByLabel($, [/scheduled arrival/i]);
  const estimatedArrivalLocal = extractValueByLabel($, [/estimated arrival/i]);
  const actualArrivalLocal = extractValueByLabel($, [/actual arrival/i]);

  if (!status || (!scheduledArrivalLocal && !estimatedArrivalLocal && !actualArrivalLocal)) {
    throw new AviabilityParseError();
  }

  return {
    status,
    scheduledArrivalLocal,
    estimatedArrivalLocal,
    actualArrivalLocal,
  };
}
