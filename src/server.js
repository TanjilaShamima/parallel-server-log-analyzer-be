const { randomUUID } = require("crypto");
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const log = require("./logBuffer");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ exposedHeaders: ["X-Request-Id"] }));
app.use(express.json());

// Every request and response is recorded so the dashboard can replay them.
// The log endpoints themselves are skipped, otherwise reading logs creates logs.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/server-logs")) return next();

  const requestId = randomUUID().slice(0, 8);
  const startedAt = process.hrtime.bigint();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  log.record("info", `${req.method} ${req.originalUrl} received`, {
    requestId,
    method: req.method,
    path: req.originalUrl,
    source: "request",
  });

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "success";
    log.record(level, `${req.method} ${req.originalUrl} responded ${res.statusCode}`, {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      source: "response",
    });
  });

  next();
});

app.use("/api", routes);

app.get("/", (_req, res) => {
  res.json({ name: "Parallel Server Log Analyzer API", status: "running", port: PORT });
});

app.use((req, res) => {
  res.status(404).json({
    message: `No route matches ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
  });
});

app.use((error, req, res, _next) => {
  const status = error.status || 500;
  // A 4xx is a client mistake, not a server fault — keep the error count meaningful.
  log.record(status >= 500 ? "error" : "warn", error.message || "Unhandled server error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    status,
    name: error.name,
    stack: error.stack,
    source: "error-handler",
  });
  res.status(status).json({
    message: error.message || "Server error",
    name: error.name,
    requestId: req.requestId,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
});

process.on("uncaughtException", (error) => {
  log.record("error", `Uncaught exception: ${error.message}`, {
    name: error.name,
    stack: error.stack,
    source: "process",
  });
});

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  log.record("error", `Unhandled promise rejection: ${error.message}`, {
    name: error.name,
    stack: error.stack,
    source: "process",
  });
});

const server = app.listen(PORT, () => {
  log.record("success", `Backend running on http://localhost:${PORT}`, { source: "system" });
  log.record("info", `Runtime log file: ${log.RUNTIME_LOG_FILE}`, { source: "system" });
});

// A bind failure is fatal — staying alive after it would silently serve nothing.
server.on("error", (error) => {
  const hint =
    error.code === "EADDRINUSE"
      ? `Port ${PORT} is already in use. Stop the other backend, or start this one with a different port: PORT=4100 npm run dev`
      : error.message;
  log.record("error", `Server failed to start: ${hint}`, { name: error.name, stack: error.stack, source: "system" });
  process.exit(1);
});
