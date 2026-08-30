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

module.exports = { calculateMetrics };
