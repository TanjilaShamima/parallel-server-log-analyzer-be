const { sequentialAnalyze } = require("./sequentialAnalyzer");
const { parallelAnalyze } = require("./parallelAnalyzer");
const { calculateMetrics } = require("./calculations");
const { LOG_FILE } = require("./generateLogs");

async function runBenchmark() {
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

  return rows;
}

if (require.main === module) {
  runBenchmark().then((rows) => console.table(rows));
}

module.exports = { runBenchmark };
