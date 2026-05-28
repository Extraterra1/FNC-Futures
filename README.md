# FlightView Arrival API

Local API for fetching formatted arrival data from FlightView for a batch of flight numbers that all arrive on the same date at the same airport.

## Requirements

- Node.js 20+
- npm 10+

Install project dependencies:

```bash
npm install
```

## Environment

The server reads these environment variables:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | HTTP port for the Fastify server |

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
npm start
```

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
  "arrivalDate": "2026-03-18",
  "flightNumbers": ["AA100"]
}
```

Rules:

- `airportCode` must be a 3-letter IATA airport code.
- `arrivalDate` must use `YYYY-MM-DD` and is interpreted as the arrival airport local date.
- `flightNumbers` must contain 1 to 20 values.
- All flight numbers are normalized to uppercase and trimmed before lookup.
- ICAO airline prefixes are normalized to IATA prefixes before calling FlightView.

The service queries FlightView for both the requested arrival date and the previous date as departure dates, then filters matches by the requested arrival airport and arrival local date. This preserves overnight arrival behavior for flights like `AA100` into `LHR`.

Successful or partial-success response:

```json
{
  "source": "flightview",
  "airportCode": "LHR",
  "arrivalDate": "2026-03-18",
  "summary": {
    "requested": 2,
    "resolved": 1,
    "failed": 1
  },
  "results": [
    {
      "flightNumber": "AA100",
      "status": "arrived",
      "scheduledArrivalLocal": "06:16",
      "actualArrivalLocal": "06:16",
      "sourceUrl": "https://www.flightview.com/flight-tracker/AA/100?date=2026-03-17"
    },
    {
      "flightNumber": "BA283",
      "error": {
        "code": "not_found",
        "message": "No FlightView match found for BA283 arriving at LHR on 2026-03-18"
      }
    }
  ]
}
```

Per-flight error codes:

- `not_found`
- `ambiguous_match`
- `flightview_unavailable`
- `parse_failed`

Whole-request errors:

- `400` for invalid request bodies
- `429` when another batch is already running

## Test Commands

```bash
npm test
npm run build
```

## Manual Smoke Test

1. Start the API with `npm run dev`.
2. Submit one of the known payloads:

```bash
curl --request POST http://localhost:3000/arrivals \
  --header 'content-type: application/json' \
  --data '{"airportCode":"OPO","arrivalDate":"2026-06-15","flightNumbers":["TP1702"]}'
```

```bash
curl --request POST http://localhost:3000/arrivals \
  --header 'content-type: application/json' \
  --data '{"airportCode":"LHR","arrivalDate":"2026-03-18","flightNumbers":["AA100"]}'
```

3. Open the returned `sourceUrl` values in a browser and confirm the status and arrival times match FlightView.
