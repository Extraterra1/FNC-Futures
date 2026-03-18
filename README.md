# Aviability Arrival API

Local API for fetching formatted arrival data from Aviability for a batch of flight numbers that all arrive on the same date at the same airport.

## Requirements

- Node.js 20+
- npm 10+
- Chromium available through Playwright

Install project dependencies:

```bash
npm install
npx playwright install chromium
```

## Environment

The server reads these environment variables:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | HTTP port for the Fastify server |
| `AVIABILITY_PROFILE_DIR` | No | none | Optional Chromium profile directory reused across runs |
| `SCRAPE_TIMEOUT_MS` | No | `30000` | Timeout for Aviability page loads |
| `DEBUG_ARTIFACTS_DIR` | No | `debug-artifacts` | Directory for saved HTML when parsing fails |
| `AVIABILITY_HEADED` | No | `false` | Runs live lookups in headless mode by default; set to `true` when you want to watch the browser session |

Example:

```bash
export DEBUG_ARTIFACTS_DIR="$PWD/debug-artifacts"
export AVIABILITY_HEADED="false"
```

If you want to keep a reusable browser session, you can also set:

```bash
export AVIABILITY_PROFILE_DIR="$PWD/.aviability-profile"
```

## Optional Bootstrap Session

As of March 18, 2026, the API can launch a fresh temporary Chromium profile automatically for each request. A saved profile is no longer required.

You can still open a headed browser session manually if you want to inspect Aviability, confirm a challenge flow, or save a reusable profile for later runs:

Run:

```bash
npm run bootstrap:aviability
```

If `AVIABILITY_PROFILE_DIR` is set, the script opens a headed persistent browser session and keeps that profile on disk.

If `AVIABILITY_PROFILE_DIR` is not set, the script opens a disposable headed session and removes it when you exit.

In that browser window:

1. Complete any Aviability challenge or interstitial.
2. Confirm you can browse Aviability normally.
3. Return to the terminal and press Enter.

## Run The API

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start the built server:

```bash
node dist/server.js
```

The API runs in headless mode by default. If `AVIABILITY_PROFILE_DIR` is unset, each arrivals request uses a fresh temporary browser profile. If you want to reuse a saved session, set `AVIABILITY_PROFILE_DIR`. If you want to inspect a live scraper session, start the server with `AVIABILITY_HEADED=true`.

## API

### `GET /health`

Returns:

```json
{
  "status": "ok"
}
```

### `POST /arrivals`

Request body:

```json
{
  "airportCode": "LHR",
  "arrivalDate": "2026-03-17",
  "flightNumbers": ["AA100", "BA283"]
}
```

Rules:

- `airportCode` must be a 3-letter IATA airport code.
- `arrivalDate` must use `YYYY-MM-DD`.
- `flightNumbers` must contain 1 to 20 values.
- All flight numbers are normalized to uppercase and trimmed before lookup.

Successful or partial-success response:

```json
{
  "source": "aviability",
  "airportCode": "LHR",
  "arrivalDate": "2026-03-17",
  "summary": {
    "requested": 2,
    "resolved": 1,
    "failed": 1
  },
  "results": [
    {
      "flightNumber": "AA100",
      "status": "arrived",
      "scheduledArrivalLocal": "06:20",
      "actualArrivalLocal": "06:08",
      "sourceUrl": "https://aviability.com/en/flight/aa100-american-airlines/jfk-lhr/2026-03-17"
    },
    {
      "flightNumber": "BA283",
      "error": {
        "code": "not_found",
        "message": "No Aviability match found for BA283 on 2026-03-17 at LHR"
      }
    }
  ]
}
```

Per-flight error codes:

- `not_found`
- `ambiguous_match`
- `blocked_by_aviability`
- `parse_failed`

Whole-request errors:

- `400` for invalid request bodies
- `429` when another batch is already running

## Debug Artifacts

If Aviability returns a flight detail page that the parser cannot understand, the raw HTML is written to `DEBUG_ARTIFACTS_DIR` using this filename pattern:

```text
<arrivalDate>-<airportCode>-<flightNumber>.html
```

This helps diagnose selector drift without losing the original page content.

## Test Commands

```bash
npm test
npm run build
```

## Manual Smoke Test

1. Start the API with `npm run dev`.
2. Submit a batch of 2-3 flight numbers for the same airport and date:

```bash
curl --request POST http://localhost:3000/arrivals \
  --header 'content-type: application/json' \
  --data '{
    "airportCode": "LHR",
    "arrivalDate": "2026-03-17",
    "flightNumbers": ["AA100", "BA283"]
  }'
```

3. Open the returned `sourceUrl` values in a normal browser and confirm the status and arrival times match Aviability.
4. If a flight returns `parse_failed`, inspect the saved HTML in `DEBUG_ARTIFACTS_DIR`.
