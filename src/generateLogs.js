const fs = require("fs");
const path = require("path");

const METHODS = ["GET", "POST", "PUT", "DELETE"];
const ENDPOINTS = ["/api/login", "/api/products", "/api/orders", "/api/payment", "/api/profile", "/api/logout", "/api/dashboard"];
const STATUS_CODES = [200, 200, 200, 201, 400, 401, 403, 404, 500];
const DATA_DIR = path.join(__dirname, "storage", "data");
const LOG_FILE = path.join(DATA_DIR, "server.log");

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function generateLogLine(index) {
  const date = new Date(2026, 7, 24, 10, 0, index);
  const ip = `192.168.1.${Math.floor(Math.random() * 80) + 1}`;
  const method = randomItem(METHODS);
  const endpoint = randomItem(ENDPOINTS);
  const status = randomItem(STATUS_CODES);
  let message = "OK";

  if (status === 401 && endpoint === "/api/login") message = "FAILED_LOGIN";
  if (status === 500) message = "SERVER_ERROR";
  if (status === 404) message = "NOT_FOUND";

  return `${formatDate(date)} ${ip} ${method} ${endpoint} ${status} ${message}\n`;
}

function generateLogs(totalLines = 100000) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(LOG_FILE);
    stream.on("error", reject);
    stream.on("finish", () => resolve({ totalLines, filePath: LOG_FILE }));

    for (let i = 0; i < totalLines; i += 1) {
      stream.write(generateLogLine(i));
    }
    stream.end();
  });
}

if (require.main === module) {
  generateLogs(Number(process.argv[2]) || 100000).then((result) => {
    console.log(`Generated ${result.totalLines} log lines at ${result.filePath}`);
  });
}

module.exports = { generateLogs, LOG_FILE };
