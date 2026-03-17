import { type FastifyInstance } from 'fastify';

function renderHomePage(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Arrival Desk</title>
    <meta
      name="description"
      content="Check flight arrivals without touching the API."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --accent: #fe3a4d;
        --accent-deep: #ce2137;
        --ink: #111322;
        --ink-soft: #384053;
        --paper: #fff8f2;
        --paper-strong: #fffdf8;
        --board: #171a24;
        --board-soft: rgba(23, 26, 36, 0.78);
        --line: rgba(17, 19, 34, 0.1);
        --success: #157f5f;
        --warning: #c27812;
        --danger: #b42318;
        --shadow: 0 28px 80px rgba(17, 19, 34, 0.16);
      }

      * {
        box-sizing: border-box;
      }

      html {
        min-height: 100%;
        background:
          radial-gradient(circle at top left, rgba(254, 58, 77, 0.24), transparent 32%),
          radial-gradient(circle at 85% 15%, rgba(254, 58, 77, 0.12), transparent 24%),
          linear-gradient(135deg, #fff8f2 0%, #fffcf9 45%, #fff1ed 100%);
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: 'Manrope', sans-serif;
        background:
          linear-gradient(90deg, rgba(17, 19, 34, 0.04) 1px, transparent 1px) 0 0 / 72px 72px,
          linear-gradient(rgba(17, 19, 34, 0.04) 1px, transparent 1px) 0 0 / 72px 72px,
          linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 248, 242, 0.92));
      }

      body::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: 0.18;
        background-image:
          radial-gradient(circle at 20% 20%, rgba(254, 58, 77, 0.28) 0 2px, transparent 2px),
          radial-gradient(circle at 80% 70%, rgba(17, 19, 34, 0.16) 0 1px, transparent 1px);
        background-size: 26px 26px, 18px 18px;
        mix-blend-mode: multiply;
      }

      a {
        color: inherit;
      }

      .page {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 32px 0 48px;
      }

      .masthead {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 18px;
        opacity: 0;
        transform: translateY(14px);
        animation: rise 600ms ease forwards;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .brand-mark {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: var(--accent);
        color: white;
        box-shadow: 0 16px 28px rgba(254, 58, 77, 0.35);
      }

      .masthead-note {
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid rgba(17, 19, 34, 0.1);
        background: rgba(255, 255, 255, 0.62);
        color: var(--ink-soft);
        font-size: 0.92rem;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
        gap: 24px;
        align-items: stretch;
      }

      .hero-copy,
      .panel {
        position: relative;
        overflow: hidden;
        border-radius: 32px;
        box-shadow: var(--shadow);
      }

      .hero-copy {
        padding: 42px;
        background:
          radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 34%),
          linear-gradient(160deg, rgba(17, 19, 34, 0.98), rgba(30, 34, 48, 0.96));
        color: white;
        isolation: isolate;
        opacity: 0;
        transform: translateY(14px);
        animation: rise 650ms ease 100ms forwards;
      }

      .hero-copy::before,
      .hero-copy::after {
        content: '';
        position: absolute;
        border-radius: 999px;
        background: rgba(254, 58, 77, 0.16);
        filter: blur(4px);
        z-index: -1;
      }

      .hero-copy::before {
        width: 320px;
        height: 320px;
        right: -120px;
        top: -80px;
      }

      .hero-copy::after {
        width: 240px;
        height: 240px;
        left: -90px;
        bottom: -120px;
      }

      .eyebrow,
      .ticket-tag,
      .results-header-label {
        font-family: 'IBM Plex Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 0.76rem;
      }

      .eyebrow {
        color: rgba(255, 255, 255, 0.72);
        margin: 0 0 20px;
      }

      h1 {
        margin: 0 0 18px;
        font-family: 'Fraunces', serif;
        font-size: clamp(3rem, 7vw, 5.6rem);
        line-height: 0.94;
        letter-spacing: -0.04em;
      }

      .hero-copy strong {
        color: var(--accent);
        font-weight: 700;
      }

      .hero-summary {
        max-width: 32rem;
        margin: 0 0 28px;
        font-size: 1.02rem;
        line-height: 1.7;
        color: rgba(255, 255, 255, 0.78);
      }

      .hero-points {
        display: grid;
        gap: 12px;
      }

      .hero-point {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(12px);
      }

      .hero-point-index {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: rgba(254, 58, 77, 0.16);
        color: #ffd6dc;
        font-family: 'IBM Plex Mono', monospace;
      }

      .panel {
        padding: 26px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 252, 248, 0.9));
        border: 1px solid rgba(255, 255, 255, 0.8);
        opacity: 0;
        transform: translateY(14px);
        animation: rise 650ms ease 180ms forwards;
      }

      .panel::before,
      .panel::after {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: 14px;
        background:
          radial-gradient(circle at right center, transparent 0 9px, rgba(255, 248, 242, 1) 9px 10px, transparent 10px 100%);
        background-size: 14px 28px;
        opacity: 0.88;
      }

      .panel::after {
        inset: 0 0 0 auto;
        transform: scaleX(-1);
      }

      .ticket-tag {
        display: inline-flex;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(254, 58, 77, 0.12);
        color: var(--accent-deep);
        margin-bottom: 14px;
      }

      .panel h2 {
        margin: 0 0 10px;
        font-family: 'Fraunces', serif;
        font-size: 2.05rem;
        line-height: 1;
      }

      .panel-copy {
        margin: 0 0 24px;
        color: var(--ink-soft);
        line-height: 1.65;
      }

      .form-grid {
        display: grid;
        gap: 16px;
      }

      label {
        display: grid;
        gap: 8px;
      }

      .field-label {
        font-size: 0.92rem;
        font-weight: 700;
      }

      input,
      button {
        font: inherit;
      }

      input {
        width: 100%;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid rgba(17, 19, 34, 0.12);
        background: var(--paper-strong);
        color: var(--ink);
        transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
      }

      input:focus {
        outline: none;
        border-color: rgba(254, 58, 77, 0.7);
        box-shadow: 0 0 0 4px rgba(254, 58, 77, 0.12);
        transform: translateY(-1px);
      }

      .flight-entry-shell {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 24px;
        background: rgba(17, 19, 34, 0.04);
        border: 1px solid rgba(17, 19, 34, 0.08);
      }

      .entry-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
      }

      .entry-input {
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .entry-button {
        padding: 14px 16px;
        border-radius: 18px;
        border: none;
        background: rgba(254, 58, 77, 0.12);
        color: var(--accent-deep);
        font-weight: 800;
        cursor: pointer;
        transition: transform 160ms ease, background 160ms ease;
      }

      .entry-button:hover {
        transform: translateY(-1px);
        background: rgba(254, 58, 77, 0.18);
      }

      .flight-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        min-height: 56px;
        padding: 0;
        margin: 0;
        list-style: none;
      }

      .flight-chip {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px 10px 14px;
        border-radius: 999px;
        background: white;
        border: 1px solid rgba(17, 19, 34, 0.08);
        box-shadow: 0 10px 18px rgba(17, 19, 34, 0.06);
        animation: ticket-pop 220ms ease;
      }

      .flight-chip-code {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.9rem;
        letter-spacing: 0.12em;
      }

      .chip-remove {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: none;
        background: rgba(17, 19, 34, 0.08);
        color: var(--ink);
        font-weight: 800;
        cursor: pointer;
      }

      .flight-list-empty {
        width: 100%;
        padding: 16px;
        border-radius: 18px;
        border: 1px dashed rgba(17, 19, 34, 0.14);
        color: var(--ink-soft);
      }

      .field-hint {
        color: var(--ink-soft);
        font-size: 0.88rem;
        line-height: 1.5;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .primary-button,
      .secondary-button {
        border: none;
        cursor: pointer;
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
      }

      .primary-button {
        min-width: 194px;
        padding: 16px 20px;
        border-radius: 18px;
        background: linear-gradient(135deg, var(--accent), #ff5d59);
        color: white;
        font-weight: 800;
        box-shadow: 0 18px 30px rgba(254, 58, 77, 0.3);
      }

      .secondary-button {
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(17, 19, 34, 0.08);
        color: var(--ink);
        font-weight: 700;
      }

      .primary-button:hover,
      .secondary-button:hover {
        transform: translateY(-2px);
      }

      .primary-button:disabled,
      .secondary-button:disabled {
        cursor: wait;
        opacity: 0.72;
        transform: none;
      }

      .status-line {
        min-height: 24px;
        font-size: 0.92rem;
        color: var(--ink-soft);
      }

      .results-shell {
        margin-top: 24px;
        padding: 22px;
        border-radius: 32px;
        background: linear-gradient(180deg, rgba(17, 19, 34, 0.98), rgba(20, 23, 34, 0.96));
        color: white;
        box-shadow: var(--shadow);
        opacity: 0;
        transform: translateY(14px);
        animation: rise 700ms ease 260ms forwards;
      }

      .results-topline {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: end;
        margin-bottom: 22px;
      }

      .results-title {
        margin: 6px 0 0;
        font-family: 'Fraunces', serif;
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 0.98;
      }

      .results-subtitle {
        margin: 10px 0 0;
        color: rgba(255, 255, 255, 0.72);
        max-width: 32rem;
        line-height: 1.6;
      }

      .summary-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .summary-card {
        padding: 16px 18px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.06);
      }

      .summary-card strong {
        display: block;
        margin-top: 6px;
        font-size: 1.75rem;
        font-family: 'Fraunces', serif;
      }

      .results-grid {
        display: grid;
        gap: 14px;
      }

      .result-card {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        padding: 18px;
        border-radius: 24px;
        background:
          linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
          rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transform-origin: center;
        animation: ticket-pop 300ms ease;
      }

      .flight-code {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 1.15rem;
        letter-spacing: 0.1em;
      }

      .result-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.74rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .pill-success {
        background: rgba(21, 127, 95, 0.14);
        color: #93eccf;
      }

      .pill-warning {
        background: rgba(194, 120, 18, 0.14);
        color: #ffd48a;
      }

      .pill-danger {
        background: rgba(180, 35, 24, 0.18);
        color: #ffb6ad;
      }

      .pill-neutral {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.86);
      }

      .timings {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-start;
      }

      .timing {
        min-width: 92px;
        padding: 10px 12px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.05);
      }

      .timing-label {
        display: block;
        margin-bottom: 6px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.67rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.56);
      }

      .timing-value {
        font-size: 1.05rem;
        font-weight: 800;
      }

      .source-link {
        padding: 10px 14px;
        border-radius: 14px;
        color: white;
        text-decoration: none;
        background: rgba(254, 58, 77, 0.12);
        border: 1px solid rgba(254, 58, 77, 0.24);
      }

      .empty-state,
      .error-banner,
      .json-panel {
        border-radius: 24px;
      }

      .empty-state {
        padding: 22px;
        border: 1px dashed rgba(255, 255, 255, 0.16);
        color: rgba(255, 255, 255, 0.74);
      }

      .error-banner {
        display: none;
        margin-bottom: 16px;
        padding: 16px 18px;
        background: rgba(180, 35, 24, 0.16);
        color: #ffd2cc;
        border: 1px solid rgba(255, 128, 117, 0.18);
      }

      .json-panel {
        margin-top: 18px;
        padding: 18px;
        background: rgba(6, 8, 14, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .json-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      pre {
        margin: 14px 0 0;
        overflow: auto;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.85rem;
        line-height: 1.7;
        color: #ffdeda;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @keyframes rise {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes ticket-pop {
        from {
          transform: scale(0.98) translateY(6px);
          opacity: 0;
        }

        to {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }

      @media (max-width: 960px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .results-topline,
        .result-card {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .page {
          width: min(100vw - 20px, 1180px);
          padding: 18px 0 28px;
        }

        .masthead {
          align-items: start;
          flex-direction: column;
        }

        .hero-copy,
        .panel,
        .results-shell {
          border-radius: 24px;
        }

        .hero-copy,
        .panel {
          padding: 22px;
        }

        .entry-row,
        .summary-strip {
          grid-template-columns: 1fr;
        }

        h1 {
          font-size: clamp(2.7rem, 13vw, 4rem);
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="masthead">
        <div class="brand">
          <span class="brand-mark">A</span>
          <span>Arrival Desk</span>
        </div>
        <div class="masthead-note">Live Aviability checks, shaped for humans.</div>
      </header>

      <main class="hero">
        <section class="hero-copy" aria-label="Application overview">
          <p class="eyebrow">Fast flight checks for non-technical teams</p>
          <h1>Check flight arrivals without touching the <strong>API</strong>.</h1>
          <p class="hero-summary">
            Add flights one by one, keep the date in view, and get a clear arrivals board plus
            formatted JSON you can copy into reports, chats, or ops notes.
          </p>
          <div class="hero-points">
            <div class="hero-point">
              <span class="hero-point-index">01</span>
              <span>Type one flight number, press Enter, and it lands in the batch instantly.</span>
            </div>
            <div class="hero-point">
              <span class="hero-point-index">02</span>
              <span>Shows friendly cards first, while keeping the raw JSON visible below.</span>
            </div>
            <div class="hero-point">
              <span class="hero-point-index">03</span>
              <span>Uses the same <code>/arrivals</code> endpoint already running on this server.</span>
            </div>
          </div>
        </section>

        <section class="panel" aria-labelledby="arrivals-form-title">
          <span class="ticket-tag">Batch arrival lookup</span>
          <h2 id="arrivals-form-title">One short form. No Postman required.</h2>
          <p class="panel-copy">
            Pick the date, then add flights one by one into the list below.
          </p>

          <form id="arrivals-form" class="form-grid">
            <label>
              <span class="field-label">Arrival date</span>
              <input id="arrivalDate" name="arrivalDate" type="date" required />
            </label>

            <div class="flight-entry-shell">
              <label for="flightNumberEntry">
                <span class="field-label">Flight numbers</span>
              </label>
              <div class="entry-row">
                <input
                  id="flightNumberEntry"
                  class="entry-input"
                  type="text"
                  placeholder="Type one flight number and press Enter"
                  autocomplete="off"
                />
                <button class="entry-button" id="addFlightButton" type="button">
                  Add flight
                </button>
              </div>
              <span class="field-hint">
                Press Enter to add the current flight. Use the X button on any tag to remove it.
                Duplicate and equivalent flight numbers are still handled safely by the backend.
              </span>
              <ul id="flightNumberList" class="flight-list" aria-live="polite"></ul>
            </div>

            <div class="actions">
              <button class="primary-button" id="submitButton" type="submit">
                Check arrivals
              </button>
              <button class="secondary-button" id="fillExampleButton" type="button">
                Load example
              </button>
            </div>

            <p id="statusLine" class="status-line" role="status" aria-live="polite"></p>
          </form>
        </section>
      </main>

      <section class="results-shell" aria-labelledby="results-title">
        <div class="results-topline">
          <div>
            <span class="results-header-label">Results</span>
            <h2 class="results-title" id="results-title">Your arrivals board</h2>
            <p class="results-subtitle">
              Successful flights show schedule data and direct Aviability links. Any misses or
              blocks stay visible instead of disappearing.
            </p>
          </div>
        </div>

        <div id="errorBanner" class="error-banner" role="alert"></div>

        <div class="summary-strip" id="summaryStrip">
          <div class="summary-card">
            Requested
            <strong id="requestedCount">0</strong>
          </div>
          <div class="summary-card">
            Resolved
            <strong id="resolvedCount">0</strong>
          </div>
          <div class="summary-card">
            Failed
            <strong id="failedCount">0</strong>
          </div>
        </div>

        <div id="resultsGrid" class="results-grid">
          <div class="empty-state">
            Submit a batch above and the arrival cards will appear here.
          </div>
        </div>

        <section class="json-panel" aria-labelledby="json-title">
          <div class="json-header">
            <div>
              <span class="results-header-label">Formatted payload</span>
              <h3 id="json-title">Raw JSON</h3>
            </div>
            <button class="secondary-button" id="copyJsonButton" type="button">
              Copy JSON
            </button>
          </div>
          <pre id="jsonOutput">{}</pre>
        </section>
      </section>
    </div>

    <script>
      const arrivalsForm = document.getElementById('arrivals-form');
      const arrivalDateInput = document.getElementById('arrivalDate');
      const flightNumberEntry = document.getElementById('flightNumberEntry');
      const addFlightButton = document.getElementById('addFlightButton');
      const flightNumberList = document.getElementById('flightNumberList');
      const submitButton = document.getElementById('submitButton');
      const fillExampleButton = document.getElementById('fillExampleButton');
      const statusLine = document.getElementById('statusLine');
      const requestedCount = document.getElementById('requestedCount');
      const resolvedCount = document.getElementById('resolvedCount');
      const failedCount = document.getElementById('failedCount');
      const resultsGrid = document.getElementById('resultsGrid');
      const jsonOutput = document.getElementById('jsonOutput');
      const copyJsonButton = document.getElementById('copyJsonButton');
      const errorBanner = document.getElementById('errorBanner');
      const FIXED_AIRPORT_CODE = String.fromCharCode(70, 78, 67);
      const flightNumbers = [];

      const examplePayload = {
        arrivalDate: '2026-03-22',
        flightNumbers: ['EJU7631', 'U27631', 'FR366', 'EJU7665'],
      };

      function splitFlightNumbers(value) {
        return value
          .split(/[\\s,]+/)
          .map((flightNumber) => flightNumber.trim().toUpperCase())
          .filter(Boolean);
      }

      function renderFlightNumberList() {
        flightNumberList.replaceChildren();

        if (flightNumbers.length === 0) {
          const emptyItem = document.createElement('li');
          emptyItem.className = 'flight-list-empty';
          emptyItem.textContent = 'No flights added yet. Type a flight number and press Enter.';
          flightNumberList.append(emptyItem);
          return;
        }

        flightNumbers.forEach((flightNumber, index) => {
          const item = document.createElement('li');
          item.className = 'flight-chip';

          const code = document.createElement('span');
          code.className = 'flight-chip-code';
          code.textContent = flightNumber;

          const removeButton = document.createElement('button');
          removeButton.className = 'chip-remove';
          removeButton.type = 'button';
          removeButton.setAttribute('aria-label', 'Remove ' + flightNumber);
          removeButton.textContent = '×';
          removeButton.addEventListener('click', () => {
            flightNumbers.splice(index, 1);
            renderFlightNumberList();
            setStatus('Removed ' + flightNumber + '.');
          });

          item.append(code, removeButton);
          flightNumberList.append(item);
        });
      }

      function addFlightNumber(value) {
        const parsedFlightNumbers = splitFlightNumbers(value);

        if (parsedFlightNumbers.length === 0) {
          return false;
        }

        flightNumbers.push(...parsedFlightNumbers);
        renderFlightNumberList();
        return true;
      }

      function addFlightNumberFromEntry() {
        const wasAdded = addFlightNumber(flightNumberEntry.value);

        if (!wasAdded) {
          setStatus('Type a flight number before pressing Enter.');
          return;
        }

        const addedCount = splitFlightNumbers(flightNumberEntry.value).length;
        flightNumberEntry.value = '';
        flightNumberEntry.focus();
        setStatus(addedCount === 1 ? 'Flight added to the batch.' : 'Flights added to the batch.');
      }

      function setBusyState(isBusy) {
        submitButton.disabled = isBusy;
        fillExampleButton.disabled = isBusy;
        addFlightButton.disabled = isBusy;
        flightNumberEntry.disabled = isBusy;
        submitButton.textContent = isBusy ? 'Checking arrivals...' : 'Check arrivals';
      }

      function setStatus(message) {
        statusLine.textContent = message;
      }

      function setError(message) {
        if (!message) {
          errorBanner.style.display = 'none';
          errorBanner.textContent = '';
          return;
        }

        errorBanner.style.display = 'block';
        errorBanner.textContent = message;
      }

      function setSummary(summary) {
        requestedCount.textContent = String(summary.requested ?? 0);
        resolvedCount.textContent = String(summary.resolved ?? 0);
        failedCount.textContent = String(summary.failed ?? 0);
      }

      function getPillClass(result) {
        if (result.error) {
          return 'pill pill-danger';
        }

        const normalized = String(result.status || '').toLowerCase();
        if (normalized.includes('arriv')) {
          return 'pill pill-success';
        }

        if (normalized.includes('delay')) {
          return 'pill pill-warning';
        }

        return 'pill pill-neutral';
      }

      function createTiming(label, value) {
        const timing = document.createElement('div');
        timing.className = 'timing';

        const timingLabel = document.createElement('span');
        timingLabel.className = 'timing-label';
        timingLabel.textContent = label;

        const timingValue = document.createElement('span');
        timingValue.className = 'timing-value';
        timingValue.textContent = value;

        timing.append(timingLabel, timingValue);
        return timing;
      }

      function renderResults(results) {
        resultsGrid.replaceChildren();

        if (!Array.isArray(results) || results.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'empty-state';
          emptyState.textContent = 'No flights came back in this response.';
          resultsGrid.append(emptyState);
          return;
        }

        for (const result of results) {
          const card = document.createElement('article');
          card.className = 'result-card';

          const left = document.createElement('div');
          const flightCode = document.createElement('div');
          flightCode.className = 'flight-code';
          flightCode.textContent = result.flightNumber;

          const meta = document.createElement('div');
          meta.className = 'result-meta';

          const pill = document.createElement('span');
          pill.className = getPillClass(result);
          pill.textContent = result.error ? result.error.code.replace(/_/g, ' ') : result.status;
          meta.append(pill);

          if (result.error) {
            const message = document.createElement('p');
            message.style.margin = '10px 0 0';
            message.style.color = 'rgba(255,255,255,0.72)';
            message.textContent = result.error.message;
            left.append(flightCode, meta, message);
          } else {
            left.append(flightCode, meta);
          }

          const middle = document.createElement('div');
          middle.className = 'timings';

          if (result.scheduledArrivalLocal) {
            middle.append(createTiming('Scheduled', result.scheduledArrivalLocal));
          }

          if (result.estimatedArrivalLocal) {
            middle.append(createTiming('Estimated', result.estimatedArrivalLocal));
          }

          if (result.actualArrivalLocal) {
            middle.append(createTiming('Actual', result.actualArrivalLocal));
          }

          if (!result.error && middle.childElementCount === 0) {
            middle.append(createTiming('Status', result.status || 'Unknown'));
          }

          const right = document.createElement('div');
          if (result.sourceUrl) {
            const sourceLink = document.createElement('a');
            sourceLink.className = 'source-link';
            sourceLink.href = result.sourceUrl;
            sourceLink.target = '_blank';
            sourceLink.rel = 'noreferrer';
            sourceLink.textContent = 'Open source';
            right.append(sourceLink);
          }

          card.append(left, middle, right);
          resultsGrid.append(card);
        }
      }

      function renderResponse(payload) {
        setSummary(payload.summary || {});
        renderResults(payload.results || []);
        jsonOutput.textContent = JSON.stringify(payload, null, 2);
      }

      function scrollToResultsBoard() {
        const resultsTitle = document.getElementById('results-title');

        if (!resultsTitle) {
          return;
        }

        requestAnimationFrame(() => {
          resultsTitle.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        });
      }

      async function copyJson() {
        try {
          await navigator.clipboard.writeText(jsonOutput.textContent || '{}');
          setStatus('JSON copied to clipboard.');
        } catch (error) {
          setStatus('Clipboard copy failed. You can still select the JSON below.');
        }
      }

      addFlightButton.addEventListener('click', () => {
        addFlightNumberFromEntry();
      });

      flightNumberEntry.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') {
          return;
        }

        event.preventDefault();
        addFlightNumberFromEntry();
      });

      fillExampleButton.addEventListener('click', () => {
        arrivalDateInput.value = examplePayload.arrivalDate;
        flightNumbers.splice(0, flightNumbers.length, ...examplePayload.flightNumbers);
        renderFlightNumberList();
        flightNumberEntry.value = '';
        setStatus('Example batch loaded.');
      });

      copyJsonButton.addEventListener('click', () => {
        void copyJson();
      });

      arrivalsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setError('');

        const payload = {
          airportCode: FIXED_AIRPORT_CODE,
          arrivalDate: arrivalDateInput.value,
          flightNumbers: [...flightNumbers],
        };

        if (!payload.arrivalDate || payload.flightNumbers.length === 0) {
          setStatus('Pick a date and add at least one flight number.');
          return;
        }

        setBusyState(true);
        setStatus('Checking Aviability and building the arrivals board...');

        try {
          const response = await fetch('/arrivals', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          jsonOutput.textContent = JSON.stringify(data, null, 2);

          if (!response.ok) {
            setSummary({
              requested: payload.flightNumbers.length,
              resolved: 0,
              failed: payload.flightNumbers.length,
            });
            resultsGrid.replaceChildren();
            setError(data.message || 'The request failed.');
            setStatus('The request did not complete.');
            scrollToResultsBoard();
            return;
          }

          renderResponse(data);
          setStatus('Arrivals board updated.');
          scrollToResultsBoard();
        } catch (error) {
          setSummary({
            requested: 0,
            resolved: 0,
            failed: 0,
          });
          resultsGrid.replaceChildren();
          setError('The frontend could not reach the API. Make sure this server is still running.');
          setStatus('Connection failed.');
        } finally {
          setBusyState(false);
        }
      });

      renderFlightNumberList();
    </script>
  </body>
</html>`;
}

export function registerHomeRoute(app: FastifyInstance): void {
  app.get('/', async (_request, reply) =>
    reply.type('text/html; charset=utf-8').send(renderHomePage()),
  );
}
