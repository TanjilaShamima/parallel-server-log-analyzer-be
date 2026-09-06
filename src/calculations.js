const WORKER_STEPS = [1, 2, 4, 8];

function calculateMetrics(sequentialTimeMs, timing) {
  const totalParallelTimeMs = timing.totalParallelTimeMs || 1;
  const workers = timing.workerCount || 1;
  const speedup = sequentialTimeMs / totalParallelTimeMs;
  return {
    speedup,
    efficiency: speedup / workers,
    mergeOverheadPercentage: (timing.mergeTimeMs / totalParallelTimeMs) * 100,
  };
}

/**
 * Builds one benchmark table row.
 *
 * `timing` carries a `workers` array holding per-worker detail. Spreading it
 * straight into the row used to overwrite the numeric worker count with that
 * array, which broke the benchmark chart axis and crashed the results table.
 * The array is pulled out here and re-exposed as `workerDetails`.
 */
function buildBenchmarkRow(sequentialTimeMs, timing) {
  const { workers: workerDetails = [], ...rest } = timing;
  return {
    workers: timing.workerCount,
    sequentialTimeMs,
    ...rest,
    ...calculateMetrics(sequentialTimeMs, timing),
    workerDetails,
  };
}

module.exports = { calculateMetrics, buildBenchmarkRow, WORKER_STEPS };
