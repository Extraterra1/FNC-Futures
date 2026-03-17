import { afterEach, describe, expect, test } from 'vitest';

import { buildApp } from '../src/app.js';

describe('GET /health', () => {
  const app = buildApp();

  afterEach(async () => {
    await app.close();
  });

  test('returns ok status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
    });
  });
});
