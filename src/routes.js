const express = require("express");
const fs = require("fs");
const path = require("path");
const { generateLogs, LOG_FILE } = require("./generateLogs");
const { sequentialAnalyze } = require("./sequentialAnalyzer");
const { parallelAnalyze } = require("./parallelAnalyzer");
const { calculateMetrics } = require("./calculations");

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
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

router.post("/generate-logs", async (req, res, next) => {
  try {
    const totalLines = Number(req.body.totalLines || 100000);
    if (![10000, 100000, 500000, 1000000].includes(totalLines)) {
      return res.status(400).json({ message: "Invalid log size" });
    }
    res.json(await generateLogs(totalLines));
  } catch (error) {
    next(error);
  }
});

router.post("/sequential", async (_req, res, next) => {
  try {
    const result = await sequentialAnalyze(LOG_FILE);
    writeJson(SUMMARY_FILE, { ...readJson(SUMMARY_FILE, {}), sequential: result, updatedAt: new Date().toISOString() });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/parallel", async (req, res, next) => {
  try {
    const workerCount = Number(req.body.workerCount || 4);
    const result = await parallelAnalyze(LOG_FILE, workerCount);
    writeJson(SUMMARY_FILE, { ...readJson(SUMMARY_FILE, {}), parallel: result, updatedAt: new Date().toISOString() });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/benchmark", async (_req, res, next) => {
  try {
    const sequential = await sequentialAnalyze(LOG_FILE);
    const rows = [];
    for (const workers of [1, 2, 4, 8]) {
      const parallel = await parallelAnalyze(LOG_FILE, workers);
      rows.push({
        workers,
        sequentialTimeMs: sequential.timeMs,
        ...parallel.timing,
        ...calculateMetrics(sequential.timeMs, parallel.timing),
      });
    }
    writeJson(BENCHMARK_FILE, rows);
    writeJson(SUMMARY_FILE, { ...readJson(SUMMARY_FILE, {}), sequential, benchmark: rows, updatedAt: new Date().toISOString() });
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/summary", (_req, res) => {
  res.json(readJson(SUMMARY_FILE, {}));
});

router.get("/benchmark-results", (_req, res) => {
  res.json(readJson(BENCHMARK_FILE, []));
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

module.exports = router;
