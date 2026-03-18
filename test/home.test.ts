import { describe, expect, test } from 'vitest';

import { buildApp } from '../src/app.js';

describe('GET /', () => {
  test('returns the non-technical arrivals frontend shell', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('lang="pt-PT"');
    expect(response.body).toContain('class="workspace"');
    expect(response.body).toContain('class="panel control-panel"');
    expect(response.body).toContain('align-items: stretch;');
    expect(response.body).toContain('.control-panel,');
    expect(response.body).toContain('height: 100%;');
    expect(response.body).not.toContain('id="heroTitle"');
    expect(response.body).not.toContain('class="hero-copy"');
    expect(response.body).not.toContain('name="airportCode"');
    expect(response.body).toContain('name="arrivalDate"');
    expect(response.body).not.toContain('Madeira');
    expect(response.body).not.toContain('FNC');
    expect(response.body).toContain('id="flightNumberEntry"');
    expect(response.body).toContain('id="flightNumberList"');
    expect(response.body).toContain('id="localeTogglePt"');
    expect(response.body).toContain('id="localeToggleEn"');
    expect(response.body).toContain("let activeLocale = 'pt'");
    expect(response.body).toContain('function applyLocale(locale)');
    expect(response.body).toContain('addFlightNumber');
    expect(response.body).toContain('scrollIntoView({');
    expect(response.body).toContain('#fe3a4d');
    expect(response.body).toContain("fetch('/arrivals'");
    expect(response.body).toContain('align-content: start;');
    expect(response.body).toContain('.result-lead {');
    expect(response.body).toContain('.result-actions {');
    expect(response.body.indexOf('id="jsonOutput"')).toBeGreaterThan(response.body.indexOf('</main>'));
  });
});
