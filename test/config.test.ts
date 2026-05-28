import { describe, expect, test } from 'vitest';

import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  test('uses defaults when optional environment variables are omitted', () => {
    const config = loadConfig({});

    expect(config).toEqual({
      port: 3000,
    });
  });

  test('parses explicit environment variables', () => {
    const config = loadConfig({
      PORT: '4321',
    });

    expect(config).toEqual({
      port: 4321,
    });
  });
});
