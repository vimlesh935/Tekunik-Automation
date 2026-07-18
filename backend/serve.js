const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { ensurePaymentColumns } = require("./src/config/orderMigration");
const { ensureSmartHomeProposalsTables } = require("./src/config/migrate");
const app = express();

process.on("uncaughtException", (err) => console.error("UNCAUGHT:", err.message));
process.on("unhandledRejection", (err) => console.error("UNHANDLED:", err.message));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(require("./src/middleware/responseNormalizer"));

app.use(require("./src/routes/authRoutes"));
app.use(require("./src/routes/adminRoutes"));
app.use(require("./src/routes/publicRoutes"));
app.use(require("./src/routes/productRoutes"));
app.use(require("./src/routes/categoryRoutes"));
app.use(require("./src/routes/orderRoutes"));
app.use(require("./src/routes/cartRoutes"));
app.use(require("./src/routes/dashboardRoutes"));
app.use(require("./src/routes/reviewRoutes"));
app.use(require("./src/routes/demoEnquiryRoutes"));
app.use(require("./src/routes/userRoutes"));
app.use(require("./src/routes/userAdminRoutes"));
app.use(require("./src/routes/websiteReviewRoutes"));
app.use(require("./src/routes/validationRoutes"));
app.use(require("./src/routes/inventoryRoutes"));
app.use(require("./src/routes/discountRoutes"));
app.use("/api/orders", require("./src/routes/paymentRoutes"));
app.use("/api/smart-home/proposals", require("./src/routes/smartHomeProposalRoutes"));
app.use("/api/smart-home/steps", require("./src/routes/smartHomeStepRoutes"));
app.use("/api/admin/upload", require("./src/routes/uploadRoutes"));
app.get("/health", (req, res) => res.json({ success: true, message: "API live on 8787" }));

// Website mode settings (stored in JSON file)
const settingsPath = path.join(__dirname, "website-mode.json");
const { requireAdmin } = require("./src/middleware/adminMiddleware");

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
    return res.status(400).json({ success: false, message: "Invalid mode. Must be 'live' or 'coming_soon'" });
  }
  fs.writeFileSync(settingsPath, JSON.stringify({ mode }, null, 2));
  res.json({ success: true, data: { mode } });
});

app.use(require("./src/middleware/errorMiddleware").errorHandler);

const distDir = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(distDir));
app.use((req, res) => {
  const p = path.join(distDir, "index.html");
  if (fs.existsSync(p)) res.sendFile(p);
  else res.status(404).json({ error: "not found" });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, async () => {
  console.log("TekNode live on http://localhost:" + PORT);
  try { await ensurePaymentColumns(); } catch (e) { console.warn("Payment migration:", e.message); }
  try { await ensureSmartHomeProposalsTables(); } catch (e) { console.warn("Smart home migration:", e.message); }
}).on("error", (err) => {
  console.error("Failed to start server on port " + PORT + ":", err.message);
  process.exit(1);
});
