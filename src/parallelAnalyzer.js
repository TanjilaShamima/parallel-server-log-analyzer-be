const fs = require("fs");
const path = require("path");
const { Worker } = require("worker_threads");
const { performance } = require("perf_hooks");
const { LOG_FILE } = require("./generateLogs");
const { hierarchicalMerge } = require("./merge");

function getFileChunks(filePath, workerCount) {
  const fileSize = fs.statSync(filePath).size;
  const chunkSize = Math.floor(fileSize / workerCount);
  const fd = fs.openSync(filePath, "r");
  const chunks = [];
  let start = 0;

  for (let i = 0; i < workerCount; i += 1) {
    let end = i === workerCount - 1 ? fileSize : start + chunkSize;
    if (end < fileSize) {
      const buffer = Buffer.alloc(1);
      while (end < fileSize) {
        fs.readSync(fd, buffer, 0, 1, end);
        end += 1;
        if (buffer[0] === 10) break;
      }
    }
    chunks.push({ workerId: i + 1, filePath, start, end });
    start = end;
  }

  fs.closeSync(fd);
  return chunks.filter((chunk) => chunk.end > chunk.start);
}

function runWorker(chunk) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "worker.js"), { workerData: chunk });
    worker.on("message", (message) => (message.ok ? resolve({ summary: message.summary, worker: message.worker }) : reject(new Error(message.error))));
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

async function parallelAnalyze(filePath = LOG_FILE, workerCount = 4) {
  const totalStart = performance.now();
  const chunkingStart = performance.now();
  const chunks = getFileChunks(filePath, workerCount);
  const chunkingTimeMs = performance.now() - chunkingStart;

  const processingStart = performance.now();
  const workerResults = await Promise.all(chunks.map(runWorker));
  const processingTimeMs = performance.now() - processingStart;

  const mergeStart = performance.now();
  const localSummaries = workerResults.map((result) => result.summary);
  const summary = hierarchicalMerge(localSummaries);
  const mergeTimeMs = performance.now() - mergeStart;
  const totalParallelTimeMs = performance.now() - totalStart;

  return {
    summary,
    timing: {
      workerCount,
      chunkingTimeMs,
      processingTimeMs,
      mergeTimeMs,
      totalParallelTimeMs,
      finalOutputTimeMs: totalParallelTimeMs,
      workers: workerResults.map((result) => result.worker),
    },
  };
}

if (require.main === module) {
  parallelAnalyze(LOG_FILE, Number(process.argv[2]) || 4).then((result) => console.log(JSON.stringify(result, null, 2)));
}

module.exports = { parallelAnalyze, getFileChunks };
