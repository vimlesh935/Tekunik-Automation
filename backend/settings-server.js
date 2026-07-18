const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const settingsPath = path.join(__dirname, "website-mode.json");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Admin auth required" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (payload.role !== "admin" && payload.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid admin session" });
  }
}

app.get("/api/settings/website-mode", (req, res) => {
  try {
    const data = fs.existsSync(settingsPath)
      ? JSON.parse(fs.readFileSync(settingsPath, "utf8"))
      : { mode: "live" };
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: true, data: { mode: "live" } });
  }
});

app.put("/api/settings/website-mode", requireAdmin, (req, res) => {
  const { mode } = req.body;
  if (!["live", "coming_soon"].includes(mode)) {
    return res.status(400).json({ success: false, message: "Invalid mode" });
  }
  fs.writeFileSync(settingsPath, JSON.stringify({ mode }, null, 2));
  res.json({ success: true, data: { mode } });
});

const PORT = 8790;
app.listen(PORT, () => console.log("Settings server on http://localhost:" + PORT))
  .on("error", (err) => {
    console.error("Settings server error:", err.message);
    process.exit(1);
  });
