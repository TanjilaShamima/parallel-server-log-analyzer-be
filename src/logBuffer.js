const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "storage", "logs");
const RUNTIME_LOG_FILE = path.join(LOG_DIR, "server-runtime.log");
const MAX_ENTRIES = 800;

const entries = [];
const subscribers = new Set();
let nextId = 1;

fs.mkdirSync(LOG_DIR, { recursive: true });
const fileStream = fs.createWriteStream(RUNTIME_LOG_FILE, { flags: "a" });

const COLOR = {
  info: "\x1b[36m",
  success: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  reset: "\x1b[0m",
};

function record(level, message, detail = {}) {
  const entry = {
    id: nextId,
    level,
    message,
    time: new Date().toISOString(),
    ...detail,
  };
  nextId += 1;

  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();

  // Persisted as JSON lines so the file stays greppable and machine readable.
  fileStream.write(`${JSON.stringify(entry)}\n`);

  // Mirrored to the terminal so `npm run dev` shows the exact same events.
  const stamp = entry.time.slice(11, 23);
  const head = `${COLOR[level] || ""}${stamp} ${level.toUpperCase().padEnd(7)}${COLOR.reset}`;
  if (level === "error") {
    console.error(`${head} ${message}`);
    if (entry.stack) console.error(entry.stack);
  } else {
    console.log(`${head} ${message}`);
  }

  for (const send of subscribers) {
    try {
      send(entry);
    } catch {
      subscribers.delete(send);
    }
  }

  return entry;
}

function subscribe(send) {
  subscribers.add(send);
  return () => subscribers.delete(send);
}

function counts() {
  const result = { all: entries.length, info: 0, success: 0, warn: 0, error: 0 };
  for (const entry of entries) {
    if (result[entry.level] !== undefined) result[entry.level] += 1;
  }
  return result;
}

function list({ level = "all", search = "", limit = 200 } = {}) {
  const needle = String(search).trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    if (level !== "all" && entry.level !== level) return false;
    if (!needle) return true;
    return JSON.stringify(entry).toLowerCase().includes(needle);
  });

  return {
    entries: filtered.slice(-Math.max(1, Math.min(800, Number(limit) || 200))).reverse(),
    matched: filtered.length,
    counts: counts(),
    logFile: RUNTIME_LOG_FILE,
  };
}

function clear() {
  entries.length = 0;
  record("info", "Server log buffer cleared by the dashboard.", { source: "system" });
}

module.exports = { record, subscribe, list, clear, counts, RUNTIME_LOG_FILE };
