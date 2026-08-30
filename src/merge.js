const { createEmptySummary, addSuspiciousIps } = require("./parser");

function addMap(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    target[key] = (target[key] || 0) + value;
  }
}

function mergeTwoSummaries(a, b) {
  const merged = createEmptySummary();
  merged.totalRequests = a.totalRequests + b.totalRequests;
  merged.failedLoginCount = a.failedLoginCount + b.failedLoginCount;
  merged.serverErrorCount = a.serverErrorCount + b.serverErrorCount;
  merged.notFoundCount = a.notFoundCount + b.notFoundCount;
  addMap(merged.statusCount, a.statusCount);
  addMap(merged.statusCount, b.statusCount);
  addMap(merged.ipCount, a.ipCount);
  addMap(merged.ipCount, b.ipCount);
  addMap(merged.endpointCount, a.endpointCount);
  addMap(merged.endpointCount, b.endpointCount);
  return merged;
}

function hierarchicalMerge(summaries) {
  if (!summaries.length) return createEmptySummary();
  let current = summaries;
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      next.push(current[i + 1] ? mergeTwoSummaries(current[i], current[i + 1]) : current[i]);
    }
    current = next;
  }
  return addSuspiciousIps(current[0]);
}

module.exports = { mergeTwoSummaries, hierarchicalMerge };
