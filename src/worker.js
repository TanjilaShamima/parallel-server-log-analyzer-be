const fs = require("fs");
const { parentPort, workerData } = require("worker_threads");
const { performance } = require("perf_hooks");
const { createEmptySummary, parseLine, updateSummary } = require("./parser");

const summary = createEmptySummary();
const startTime = performance.now();
const stream = fs.createReadStream(workerData.filePath, {
  start: workerData.start,
  end: workerData.end - 1,
  encoding: "utf8",
});
let leftover = "";

stream.on("data", (chunk) => {
  const lines = (leftover + chunk).split("\n");
  leftover = lines.pop() || "";
  for (const line of lines) updateSummary(summary, parseLine(line));
});

stream.on("end", () => {
  if (leftover.trim()) updateSummary(summary, parseLine(leftover));
  parentPort.postMessage({
    ok: true,
    summary,
    worker: {
      workerId: workerData.workerId,
      start: workerData.start,
      end: workerData.end,
      bytes: workerData.end - workerData.start,
      totalRequests: summary.totalRequests,
      durationMs: performance.now() - startTime,
    },
  });
});

stream.on("error", (error) => {
  parentPort.postMessage({ ok: false, error: error.message });
});
