# Backend

Node.js + Express API for parallel server log analysis using worker threads.

## Run

```bash
npm install
npm run dev          # nodemon, http://localhost:4000
npm start            # plain node
PORT=4100 npm start  # if port 4000 is taken
```

## CLI (no frontend needed)

```bash
npm run generate     # write src/storage/data/server.log
npm run sequential   # baseline timing
npm run parallel 4   # parallel run with 4 worker threads
npm run benchmark    # full sweep at 1, 2, 4, 8 workers, printed as a table
```

## Endpoints

### Analysis

- `POST /api/generate-logs` — body `{ totalLines }`, one of 10000 / 100000 / 500000 / 1000000
- `POST /api/sequential` — single-process baseline
- `POST /api/parallel` — body `{ workerCount }`, one of 1 / 2 / 4 / 8
- `POST /api/benchmark` — sequential baseline plus a sweep of all worker counts
- `GET /api/summary` — last stored sequential/parallel/benchmark results
- `GET /api/benchmark-results` — last stored benchmark table
- `GET /api/log-lines?page=&limit=` — paginated raw log lines

### Observability

- `GET /api/health` — uptime, Node version, PID, heap usage, log file path
- `GET /api/server-logs?level=&search=&limit=` — recent runtime events with stack traces
- `GET /api/server-logs/stream` — live Server-Sent Events feed
- `DELETE /api/server-logs` — clear the in-memory buffer
- `POST /api/debug/error` — body `{ kind }`, one of `validation` / `missing-file` / `async` / `crash`; deliberately fails so error capture can be demonstrated

## Server logs

Every request, response, analyzer run and error is:

1. printed to the terminal running the server, colour-coded by level;
2. appended as one JSON object per line to `src/storage/logs/server-runtime.log`;
3. kept in a 800-entry ring buffer and pushed live to any connected dashboard.

Errors carry the full stack plus a short `requestId`, which is also returned to the
browser in the `X-Request-Id` header — so a failed request in the browser can be
matched to the exact stack trace on the server.

Reading them outside the dashboard:

```bash
# follow live — PowerShell
Get-Content -Path .\src\storage\logs\server-runtime.log -Wait -Tail 20

# follow live — Git Bash / macOS / Linux
tail -f src/storage/logs/server-runtime.log

# errors only
grep '"level":"error"' src/storage/logs/server-runtime.log

# over HTTP
curl http://localhost:4000/api/server-logs?level=error
curl -N http://localhost:4000/api/server-logs/stream
```

## Storage

File system only, no database:

- Generated log: `src/storage/data/server.log`
- Runtime log: `src/storage/logs/server-runtime.log`
- Results: `src/storage/results/summary.json`
- Benchmark: `src/storage/results/benchmark-results.json`

## Note on benchmark rows

`parallelAnalyze` returns `timing.workers` as an **array** of per-worker detail, while a
benchmark row needs `workers` as the **thread count**. `buildBenchmarkRow` in
`src/calculations.js` separates the two — the array is re-exposed as `workerDetails`.
Spreading `timing` directly into a row silently overwrites the count with the array.
