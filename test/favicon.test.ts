import { describe, expect, test } from 'vitest';

import { buildApp } from '../src/build-app.js';

describe('GET /favicon.svg', () => {
  test('returns the branded svg favicon', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/favicon.svg',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('image/svg+xml');
    expect(response.body).toContain('<svg');
    expect(response.body).toContain('Painel de Chegadas favicon');
    expect(response.body).toContain('#fe3a4d');
    expect(response.body).toContain('#171a24');
  });
});
