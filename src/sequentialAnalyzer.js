const fs = require("fs");
const readline = require("readline");
const { performance } = require("perf_hooks");
const { createEmptySummary, parseLine, updateSummary, addSuspiciousIps } = require("./parser");
const { LOG_FILE } = require("./generateLogs");

async function sequentialAnalyze(filePath = LOG_FILE) {
  const summary = createEmptySummary();
  const start = performance.now();

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    updateSummary(summary, parseLine(line));
  }

  return {
    summary: addSuspiciousIps(summary),
    timeMs: performance.now() - start,
  };
}

if (require.main === module) {
  sequentialAnalyze().then((result) => console.log(JSON.stringify(result, null, 2)));
}

module.exports = { sequentialAnalyze };
