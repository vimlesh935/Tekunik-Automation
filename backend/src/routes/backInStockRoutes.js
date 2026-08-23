const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const {
  subscribe,
  cancel,
  status,
  myAlerts,
  adminWaitingCustomers,
  adminWaitingCounts,
  adminRestockAnalytics,
} = require("../controllers/backInStockController");

const router = express.Router();

// ─── CUSTOMER (authenticated) ───────────────────────────────────────
// POST /api/back-in-stock/:productId — subscribe to back-in-stock alert
router.post("/api/back-in-stock/:productId", requireAuth, subscribe);

// DELETE /api/back-in-stock/:productId — cancel own alert
router.delete("/api/back-in-stock/:productId", requireAuth, cancel);

// GET /api/back-in-stock/status/:productId — own alert state
router.get("/api/back-in-stock/status/:productId", requireAuth, status);

// GET /api/back-in-stock/my — all own alerts
router.get("/api/back-in-stock/my", requireAuth, myAlerts);

// ─── ADMIN (admin token required) ───────────────────────────────────
// GET /api/admin/back-in-stock/waiting-counts — counts per product
router.get("/api/admin/back-in-stock/waiting-counts", requireAdmin, adminWaitingCounts);

// GET /api/admin/back-in-stock/product/:productId/waiting — waiting customers
router.get("/api/admin/back-in-stock/product/:productId/waiting", requireAdmin, adminWaitingCustomers);

// GET /api/admin/back-in-stock/product/:productId/analytics — restock demand
router.get("/api/admin/back-in-stock/product/:productId/analytics", requireAdmin, adminRestockAnalytics);

module.exports = router;