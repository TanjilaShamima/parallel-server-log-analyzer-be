# Backend

Simple Node.js + Express API for server log analysis.

## Run

```bash
npm install
npm run dev
```

API runs on `http://localhost:4000`.

## Endpoints

- `POST /api/generate-logs`
- `POST /api/sequential`
- `POST /api/parallel`
- `POST /api/benchmark`
- `GET /api/summary`
- `GET /api/benchmark-results`

## Storage

This backend uses file system storage only:

- Logs: `src/storage/data/server.log`
- Results: `src/storage/results/summary.json`
- Benchmark: `src/storage/results/benchmark-results.json`
