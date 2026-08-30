function createEmptySummary() {
  return {
    totalRequests: 0,
    statusCount: {},
    ipCount: {},
    endpointCount: {},
    failedLoginCount: 0,
    serverErrorCount: 0,
    notFoundCount: 0,
    suspiciousIps: [],
  };
}

function increase(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function parseLine(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 7) return null;
  return {
    date: parts[0],
    time: parts[1],
    ip: parts[2],
    method: parts[3],
    endpoint: parts[4],
    status: parts[5],
    message: parts[6],
  };
}

function updateSummary(summary, parsed) {
  if (!parsed) return;
  summary.totalRequests += 1;
  increase(summary.statusCount, parsed.status);
  increase(summary.ipCount, parsed.ip);
  increase(summary.endpointCount, parsed.endpoint);
  if (parsed.message === "FAILED_LOGIN") summary.failedLoginCount += 1;
  if (parsed.status === "500") summary.serverErrorCount += 1;
  if (parsed.status === "404") summary.notFoundCount += 1;
}

function addSuspiciousIps(summary) {
  summary.suspiciousIps = Object.entries(summary.ipCount)
    .map(([ip, requestCount]) => {
      const failedLoginCount = Math.round(
        summary.totalRequests ? (summary.failedLoginCount / summary.totalRequests) * requestCount : 0
      );
      return {
        ip,
        requestCount,
        failedLoginCount,
        reason:
          failedLoginCount > 10 && requestCount > 1000
            ? "High requests and failed logins"
            : failedLoginCount > 10
              ? "Failed login count > 10"
              : "Request count > 1000",
      };
    })
    .filter((item) => item.failedLoginCount > 10 || item.requestCount > 1000)
    .sort((a, b) => b.requestCount - a.requestCount);
  return summary;
}

module.exports = { createEmptySummary, increase, parseLine, updateSummary, addSuspiciousIps };
