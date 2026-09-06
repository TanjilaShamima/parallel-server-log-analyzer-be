const { sequentialAnalyze } = require("./sequentialAnalyzer");
const { parallelAnalyze } = require("./parallelAnalyzer");
const { buildBenchmarkRow, WORKER_STEPS } = require("./calculations");
const { LOG_FILE } = require("./generateLogs");

async function runBenchmark() {
  const sequential = await sequentialAnalyze(LOG_FILE);
  const rows = [];

  for (const workers of WORKER_STEPS) {
    const parallel = await parallelAnalyze(LOG_FILE, workers);
    rows.push(buildBenchmarkRow(sequential.timeMs, parallel.timing));
  }

  return rows;
}

if (require.main === module) {
  runBenchmark().then((rows) => {
    console.table(
      rows.map(({ workerDetails, ...row }) => ({
        ...row,
        speedup: `${row.speedup.toFixed(2)}x`,
        efficiency: `${(row.efficiency * 100).toFixed(1)}%`,
        mergeOverheadPercentage: `${row.mergeOverheadPercentage.toFixed(2)}%`,
      }))
    );
  });
}

module.exports = { runBenchmark };
