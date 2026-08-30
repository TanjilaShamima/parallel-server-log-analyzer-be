const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.json({ name: "Parallel Server Log Analyzer API", status: "running" });
});

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
