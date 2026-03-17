import { describe, expect, test } from 'vitest';

import {
  buildIcaoToIataMap,
  normalizeFlightNumberForLookup,
} from '../src/lib/aviability/flight-number-normalizer.js';

describe('normalizeFlightNumberForLookup', () => {
  const codeMap = buildIcaoToIataMap([
    { airline: 'easyJet Europe', iata: 'U2', icao: 'EJU' },
    { airline: 'Ryanair', iata: 'FR', icao: 'RYR' },
  ]);

  test('converts ICAO prefixes to IATA prefixes for lookup', () => {
    expect(normalizeFlightNumberForLookup('EJU7631', codeMap)).toBe('U27631');
    expect(normalizeFlightNumberForLookup('RYR366', codeMap)).toBe('FR366');
  });

  test('keeps already-normalized IATA flight numbers unchanged', () => {
    expect(normalizeFlightNumberForLookup('U27631', codeMap)).toBe('U27631');
    expect(normalizeFlightNumberForLookup('FR366', codeMap)).toBe('FR366');
  });

  test('keeps unknown airline prefixes unchanged', () => {
    expect(normalizeFlightNumberForLookup('ZZ1234', codeMap)).toBe('ZZ1234');
  });
});
