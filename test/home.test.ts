import { describe, expect, test } from 'vitest';

import { buildApp } from '../src/build-app.js';

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
    expect(response.body).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />');
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
    expect(response.body).toContain('id="clearFlightsButton"');
    expect(response.body).toContain('id="resultsLoading"');
    expect(response.body).toContain('id="localeTogglePt"');
    expect(response.body).toContain('id="localeToggleEn"');
    expect(response.body).toContain("let activeLocale = 'pt'");
    expect(response.body).toContain('function applyLocale(locale)');
    expect(response.body).toContain('function getTodayInputValue()');
    expect(response.body).toContain('addFlightNumber');
    expect(response.body).toContain('function clearAllFlights()');
    expect(response.body).toContain('scrollIntoView({');
    expect(response.body).toContain('#fe3a4d');
    expect(response.body).toContain("fetch('/arrivals'");
    expect(response.body).toContain("resultsLoading.classList.toggle('is-visible', isBusy);");
    expect(response.body).toContain('align-content: start;');
    expect(response.body).toContain('.result-lead {');
    expect(response.body).toContain('.result-actions {');
    expect(response.body).toContain('.flight-list-toolbar {');
    expect(response.body).toContain('.results-loading {');
    expect(response.body).toContain('.result-card::before {');
    expect(response.body).toContain('visibility: hidden;');
    expect(response.body).toContain('visibility: visible;');
    expect(response.body).toContain('function formatDisplayDate(dateString)');
    expect(response.body).toContain("dateLabel.textContent = localeStrings().flightDateLabel;");
    expect(response.body).toContain("dateValue.textContent = formatDisplayDate(arrivalDateInput.value);");
    expect(response.body).toContain('arrivalDateInput.value = getTodayInputValue();');
    expect(response.body).toContain('padding: 16px 18px;');
    expect(response.body).toContain('min-height: 64px;');
    expect(response.body).toContain('flex-basis: 100%;');
    expect(response.body).toContain("const resultsShell = document.querySelector('.results-shell');");
    expect(response.body).toContain('resultsShell.scrollIntoView({');
    expect(response.body).toContain("const urlSearchParams = new URLSearchParams(window.location.search);");
    expect(response.body).toContain('function isValidArrivalDate(value)');
    expect(response.body).toContain('function applyBootstrapParams()');
    expect(response.body).toContain("const bootstrapFlightsValue = urlSearchParams.get('flights');");
    expect(response.body).toContain("const bootstrapDateValue = urlSearchParams.get('date');");
    expect(response.body).toContain("setStatus('statusUrlDateInvalid');");
    expect(response.body).toContain("setStatus('statusUrlFlightsInvalid');");
    expect(response.body).toContain("setStatus('statusUrlFlightsPartial');");
    expect(response.body).toContain('await submitArrivalsLookup();');
    expect(response.body.indexOf('id="jsonOutput"')).toBeGreaterThan(response.body.indexOf('</main>'));
  });
});
