const fs = require("fs");
const path = require("path");

const resultsPath = path.join(__dirname, "..", "results", "benchmark_results.json");
const summaryPath = path.join(__dirname, "..", "results", "summary.json");

function clearScreen() {
  process.stdout.write("\x1Bc");
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function render() {
  clearScreen();

  console.log("=".repeat(80));
  console.log("PARALLEL SERVER LOG ANALYZER - LIVE MONITOR");
  console.log("=".repeat(80));

  const summary = readJson(summaryPath);
  const rows = readJson(resultsPath);

  if (summary) {
    console.log("\nLog Summary");
    console.log("-".repeat(80));
    console.log("Total Requests      :", summary.totalRequests);
    console.log("Failed Login Count  :", summary.failedLoginCount);
    console.log("Server Error Count  :", summary.serverErrorCount);
    console.log("404 Not Found Count :", summary.notFoundCount);
  } else {
    console.log("\nNo summary found yet. Run: npm run benchmark");
  }

  if (rows) {
    console.log("\nBenchmark Result");
    console.log("-".repeat(80));
    console.log(
      "Workers".padEnd(10),
      "Seq(s)".padEnd(12),
      "Par(s)".padEnd(12),
      "Merge(s)".padEnd(12),
      "Speedup".padEnd(10),
      "Efficiency"
    );
    console.log("-".repeat(80));

    for (const row of rows) {
      console.log(
        String(row.workers).padEnd(10),
        (row.sequentialTimeMs / 1000).toFixed(4).padEnd(12),
        (row.totalParallelTimeMs / 1000).toFixed(4).padEnd(12),
        (row.mergeTimeMs / 1000).toFixed(4).padEnd(12),
        row.speedup.toFixed(2).padEnd(10),
        (row.efficiency * 100).toFixed(2) + "%"
      );
    }
  } else {
    console.log("\nNo benchmark result found yet. Run: npm run benchmark");
  }

  console.log("\nRefreshing every 2 seconds. Press Ctrl + C to stop.");
}

setInterval(render, 2000);
render();