const express = require("express");
const fs = require("fs");
const path = require("path");
const { generateLogs, LOG_FILE } = require("./generateLogs");
const { sequentialAnalyze } = require("./sequentialAnalyzer");
const { parallelAnalyze } = require("./parallelAnalyzer");
const { buildBenchmarkRow, WORKER_STEPS } = require("./calculations");
const log = require("./logBuffer");

const router = express.Router();
const RESULTS_DIR = path.join(__dirname, "storage", "results");
const SUMMARY_FILE = path.join(RESULTS_DIR, "summary.json");
const BENCHMARK_FILE = path.join(RESULTS_DIR, "benchmark-results.json");

function writeJson(filePath, data) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    log.record("warn", `Could not parse ${path.basename(filePath)}, using fallback.`, {
      name: error.name,
      stack: error.stack,
      source: "storage",
    });
    return fallback;
  }
}

function requireLogFile() {
  if (fs.existsSync(LOG_FILE)) return;
  const error = new Error("No server.log found. Generate logs first from the Analyzer page.");
  error.status = 409;
  throw error;
}

router.post("/generate-logs", async (req, res, next) => {
  try {
    const totalLines = Number(req.body.totalLines || 100000);
    if (![10000, 100000, 500000, 1000000].includes(totalLines)) {
      const error = new Error(`Invalid log size: ${req.body.totalLines}. Allowed: 10000, 100000, 500000, 1000000.`);
      error.status = 400;
      throw error;
    }
    const result = await generateLogs(totalLines);
    log.record("success", `Generated ${totalLines.toLocaleString()} log lines.`, {
      requestId: req.requestId,
      totalLines,
      source: "generator",
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/sequential", async (req, res, next) => {
  try {
    requireLogFile();
    const result = await sequentialAnalyze(LOG_FILE);
    log.record("success", `Sequential analysis finished in ${result.timeMs.toFixed(2)} ms.`, {
      requestId: req.requestId,
      durationMs: Number(result.timeMs.toFixed(2)),
      totalRequests: result.summary.totalRequests,
      source: "analyzer",
    });
    writeJson(SUMMARY_FILE, { ...readJson(SUMMARY_FILE, {}), sequential: result, updatedAt: new Date().toISOString() });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/parallel", async (req, res, next) => {
  try {
    requireLogFile();
    const workerCount = Number(req.body.workerCount || 4);
    if (!WORKER_STEPS.includes(workerCount)) {
      const error = new Error(`Invalid worker count: ${req.body.workerCount}. Allowed: ${WORKER_STEPS.join(", ")}.`);
      error.status = 400;
      throw error;
    }
    const result = await parallelAnalyze(LOG_FILE, workerCount);
    log.record("success", `Parallel analysis with ${workerCount} workers finished in ${result.timing.totalParallelTimeMs.toFixed(2)} ms.`, {
      requestId: req.requestId,
      workerCount,
      durationMs: Number(result.timing.totalParallelTimeMs.toFixed(2)),
      mergeTimeMs: Number(result.timing.mergeTimeMs.toFixed(2)),
      source: "analyzer",
    });
    writeJson(SUMMARY_FILE, { ...readJson(SUMMARY_FILE, {}), parallel: result, updatedAt: new Date().toISOString() });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/benchmark", async (req, res, next) => {
  try {
    requireLogFile();
    const sequential = await sequentialAnalyze(LOG_FILE);
    log.record("info", `Benchmark baseline measured: ${sequential.timeMs.toFixed(2)} ms.`, {
      requestId: req.requestId,
      source: "benchmark",
    });

    const rows = [];
    for (const workers of WORKER_STEPS) {
      const parallel = await parallelAnalyze(LOG_FILE, workers);
      const row = buildBenchmarkRow(sequential.timeMs, parallel.timing);
      rows.push(row);
      log.record("info", `Benchmark ${workers} worker(s): ${row.totalParallelTimeMs.toFixed(2)} ms, speedup ${row.speedup.toFixed(2)}x.`, {
        requestId: req.requestId,
        workers,
        source: "benchmark",
      });
    }

    writeJson(BENCHMARK_FILE, rows);
    writeJson(SUMMARY_FILE, { ...readJson(SUMMARY_FILE, {}), sequential, benchmark: rows, updatedAt: new Date().toISOString() });
    log.record("success", `Benchmark complete for ${rows.length} worker configurations.`, {
      requestId: req.requestId,
      source: "benchmark",
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/summary", (_req, res) => {
  res.json(readJson(SUMMARY_FILE, {}));
});

router.get("/benchmark-results", (_req, res) => {
  const rows = readJson(BENCHMARK_FILE, []);
  // Older result files stored the worker detail array under `workers`; normalise them.
  res.json(
    Array.isArray(rows)
      ? rows.map((row) => (Array.isArray(row.workers) ? { ...row, workers: row.workerCount, workerDetails: row.workers } : row))
      : []
  );
});

router.get("/log-lines", (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(5, Number(req.query.limit || 10)));
    if (!fs.existsSync(LOG_FILE)) {
      return res.json({ page, limit, total: 0, totalPages: 1, rows: [] });
    }

    const lines = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n").filter(Boolean);
    const total = lines.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const rows = lines.slice(start, start + limit).map((line, index) => ({
      lineNumber: start + index + 1,
      raw: line,
    }));

    res.json({ page, limit, total, totalPages, rows });
  } catch (error) {
    next(error);
  }
});

router.get("/health", (_req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: "ok",
    uptimeSeconds: Number(process.uptime().toFixed(1)),
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
    heapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(1)),
    logFileExists: fs.existsSync(LOG_FILE),
    runtimeLogFile: log.RUNTIME_LOG_FILE,
  });
});

router.get("/server-logs", (req, res) => {
  res.json(
    log.list({
      level: String(req.query.level || "all"),
      search: String(req.query.search || ""),
      limit: Number(req.query.limit || 200),
    })
  );
});

router.get("/server-logs/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: ready\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);

  const unsubscribe = log.subscribe((entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  });
  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

router.delete("/server-logs", (_req, res) => {
  log.clear();
  res.json(log.list({}));
});

// Deliberate failures so the Server Logs page can demonstrate real error capture.
router.post("/debug/error", (req, res, next) => {
  const kind = String(req.body?.kind || "crash");

  if (kind === "validation") {
    const error = new Error("Validation failed: `workerCount` must be one of 1, 2, 4, 8.");
    error.name = "ValidationError";
    error.status = 400;
    return next(error);
  }

  if (kind === "missing-file") {
    return next(Object.assign(new Error("ENOENT: no such file or directory, open 'storage/data/does-not-exist.log'"), { name: "FileNotFoundError", status: 404 }));
  }

  if (kind === "async") {
    return Promise.reject(new Error("Async worker task rejected before returning a summary.")).catch(next);
  }

  // Genuine runtime crash, so the stack trace is real and points at this file.
  const broken = null;
  res.json({ willNeverRun: broken.value });
});

module.exports = router;
