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
  const match = bodyText.match(
    /\bstatus\b[:\s]+([A-Za-z]+(?: [A-Za-z]+){0,2})(?=\s+(?:departing|arriving|route|flight times|flight schedule|departure|arrival)\b|$)/i,
  );

  if (match?.[1]) {
    return normalizeStatus(match[1]);
  }

  return undefined;
}

function isFeedbackPageText(bodyText: string): boolean {
  return bodyText.includes('this page is normally shown to automated traffic');
}

function extractTimeFromText(patterns: RegExp[], bodyText: string): string | undefined {
  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match?.[1] && isTimeLike(match[1])) {
      return match[1];
    }
  }

  return undefined;
}

function extractMetaDescription($: CheerioAPI): string | undefined {
  return (
    $('meta[name="Description"]').attr('content') ??
    $('meta[name="description"]').attr('content')
  );
}

function extractStatusFromMetaDescription(metaDescription: string): string | undefined {
  const match = metaDescription.match(/status\s+([a-z]+(?: [a-z]+){0,2})(?=,|$)/i);
  return match?.[1] ? normalizeStatus(match[1]) : undefined;
}

function findHeading(
  $: CheerioAPI,
  pattern: RegExp,
): Element | undefined {
  return $('h1, h2, h3, h4, h5')
    .toArray()
    .find((element) => pattern.test(normalizeWhitespace($(element).text())));
}

function extractStatusFromHeading($: CheerioAPI): string | undefined {
  const heading = findHeading($, /^flight status$/i);
  if (!heading) {
    return undefined;
  }

  const text = normalizeWhitespace($(heading).next().text());
  return text ? normalizeStatus(text) : undefined;
}

function extractScheduledArrivalFromFlightTimesSection($: CheerioAPI): string | undefined {
  const heading = findHeading($, /^flight times$/i);
  if (!heading) {
    return undefined;
  }

  const section = $(heading).closest('section');
  const explicitArrivalTimes = section
    .find('.Qc .Ac')
    .toArray()
    .map((element) => normalizeWhitespace($(element).text()))
    .flatMap((text) => {
      const matches = text.match(/\b(\d{1,2}:\d{2})\b/g);
      return matches ?? [];
    });

  if (explicitArrivalTimes.length >= 2) {
    return explicitArrivalTimes[1];
  }

  const rowArrivalTimes = section
    .children()
    .toArray()
    .map((element) =>
      $(element)
        .children()
        .toArray()
        .map((child) => normalizeWhitespace($(child).text()))
        .flatMap((text) => {
          const matches = text.match(/\b(\d{1,2}:\d{2})\b/g);
          return matches ?? [];
        }),
    )
    .find((times) => times.length >= 2);

  if (rowArrivalTimes) {
    return rowArrivalTimes[1];
  }

  const timeValues = section
    .children()
    .toArray()
    .map((element) => normalizeWhitespace($(element).text()))
    .flatMap((text) => {
      const matches = text.match(/\b(\d{1,2}:\d{2})\b/g);
      return matches ?? [];
    });

  return timeValues.length >= 2 ? timeValues[1] : undefined;
}

function extractStatusFromBodyText(bodyText: string): string | undefined {
  const patterns = [
    /flight status\s+([a-z]+(?: [a-z]+){0,2})\s+(?:departing|arriving|route|flight times|flight schedule)\b/i,
    /\bstatus\b[:\s]+([a-z]+(?: [a-z]+){0,2})\s+(?:departing|arriving|route|flight times|flight schedule)\b/i,
    /\bstatus\b[:\s]+([a-z]+(?: [a-z]+){0,2})\b/i,
  ];

  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match?.[1]) {
      return normalizeStatus(match[1]);
    }
  }

  return undefined;
}

export function parseAviabilityArrivalPage(html: string): ParsedAviabilityArrivalPage {
  const $ = load(html);
  const bodyText = normalizeWhitespace($('body').text());
  const normalizedBodyText = bodyText.toLowerCase();
  const metaDescription = normalizeWhitespace(extractMetaDescription($) ?? '');

  if (isFeedbackPageText(normalizedBodyText)) {
    throw new AviabilityBlockedError();
  }

  const status =
    extractStatusFromHeading($) ??
    extractStatus($) ??
    extractStatusFromBodyText(bodyText) ??
    extractStatusFromMetaDescription(metaDescription);
  const scheduledArrivalLocal =
    extractValueByLabel($, [/scheduled arrival/i]) ??
    extractScheduledArrivalFromFlightTimesSection($) ??
    extractTimeFromText(
      [
        /arrival\s+airport:.*?date and time:.*?(\d{1,2}:\d{2})/i,
        /gate arrival time\s+scheduled time\s+(?:mar \d{1,2},\s+\d{1,2}:\d{2}\s+)?(?:mar \d{1,2},\s+)?(\d{1,2}:\d{2})/i,
        /arrival .*?(\d{1,2}:\d{2})(?=,|$)/i,
      ],
      `${bodyText} ${metaDescription}`.trim(),
    );
  const estimatedArrivalLocal =
    extractValueByLabel($, [/estimated arrival/i]) ??
    extractTimeFromText([/estimated(?: arrival)?(?: time)?[^0-9]*(\d{1,2}:\d{2})/i], bodyText);
  const actualArrivalLocal =
    extractValueByLabel($, [/actual arrival/i]) ??
    extractTimeFromText([/actual(?: arrival)?(?: time)?[^0-9]*(\d{1,2}:\d{2})/i], bodyText);

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
