import { describe, expect, test } from 'vitest';

import { buildApp } from '../src/build-app.js';

describe('GET /health', () => {
  test('returns ok status', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
    });
  });
});
