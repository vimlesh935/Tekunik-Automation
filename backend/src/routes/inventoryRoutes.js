const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  getInventoryDashboard,
  listInventory,
  getInventoryItem,
  updateStock,
  bulkUpdateStock,
  getInventoryLogs,
  getInventoryAlerts,
  markAlertAsRead,
  getPublicProducts,
  getPublicProductById,
} = require("../controllers/inventoryController");

const router = express.Router();

// ════════════════════════════════════════════════════════════════════════════
// ADMIN INVENTORY ROUTES (JWT protected)
// ════════════════════════════════════════════════════════════════════════════

/** Dashboard: Summary stats, alerts, recent updates */
router.get("/api/admin/inventory/dashboard", requireAdmin, getInventoryDashboard);

/** List inventory with pagination, search, filter */
router.get("/api/admin/inventory", requireAdmin, listInventory);

/** Get single product inventory details + logs */
router.get("/api/admin/inventory/:id", requireAdmin, getInventoryItem);

/** Update stock for one product */
router.put("/api/admin/stock/:id", requireAdmin, updateStock);

/** Bulk update stock for multiple products */
router.post("/api/admin/stock/bulk", requireAdmin, bulkUpdateStock);

/** View inventory logs/history */
router.get("/api/admin/inventory/logs", requireAdmin, getInventoryLogs);

/** Get low stock / out of stock alerts */
router.get("/api/admin/alerts", requireAdmin, getInventoryAlerts);

/** Mark alert as read */
router.patch("/api/admin/alerts/:id/read", requireAdmin, markAlertAsRead);

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC PRODUCT ROUTES (User side)
// ════════════════════════════════════════════════════════════════════════════

/** Get all products with stock status (for users) */
router.get("/api/products", getPublicProducts);

/** Get single product details */
router.get("/api/products/:id", getPublicProductById);

module.exports = router;