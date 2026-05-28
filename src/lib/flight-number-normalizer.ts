import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface AirlineCodeMapping {
  airline: string;
  iata: string;
  icao: string;
}

type IcaoToIataMap = Map<string, string>;

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function parseFlightNumber(flightNumber: string): { prefix: string; suffix: string } | undefined {
  const normalized = normalizeCode(flightNumber);
  const match = normalized.match(/^([A-Z]{2,3})([A-Z0-9]+)$/);

  if (!match) {
    return undefined;
  }

  return {
    prefix: match[1],
    suffix: match[2],
  };
}

export function buildIcaoToIataMap(
  mappings: AirlineCodeMapping[],
): IcaoToIataMap {
  const map = new Map<string, string>();

  for (const mapping of mappings) {
    const iata = normalizeCode(mapping.iata);
    const icao = normalizeCode(mapping.icao);

    if (!iata || !icao) {
      continue;
    }

    map.set(icao, iata);
  }

  return map;
}

export function loadIcaoToIataMap(
  filePath = join(process.cwd(), 'codes.json'),
): IcaoToIataMap {
  const fileContents = readFileSync(filePath, 'utf8');
  const mappings = JSON.parse(fileContents) as AirlineCodeMapping[];

  return buildIcaoToIataMap(mappings);
}

export function normalizeFlightNumberForLookup(
  flightNumber: string,
  icaoToIataMap: IcaoToIataMap,
): string {
  const parsed = parseFlightNumber(flightNumber);

  if (!parsed) {
    return normalizeCode(flightNumber);
  }

  const normalizedPrefix = icaoToIataMap.get(parsed.prefix) ?? parsed.prefix;
  return `${normalizedPrefix}${parsed.suffix}`;
}
