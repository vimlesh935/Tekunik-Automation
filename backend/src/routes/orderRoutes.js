const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  trackOrder,
  getUserOrders,
  getUserOrder,
  regenerateInvoice,
  downloadInvoice,
  downloadUserInvoice,
  downloadGuestInvoice,
  getOrderStats,
  cancelOrder,
} = require("../controllers/orderController");

const router = express.Router();

/** Create new order (authenticated user only) */
router.post("/api/orders", requireAuth, createOrder);

/** Guest order endpoints (no auth required) */
router.post("/api/guest/orders", createOrder);
router.post("/api/guest/orders/track", trackOrder);
router.get("/api/guest/orders/download-invoice", downloadGuestInvoice);

/** User's own orders (authenticated) */
router.get("/api/user/orders", requireAuth, getUserOrders);
router.get("/api/user/orders/:id", requireAuth, getUserOrder);
router.get("/api/user/orders/:id/download-invoice", requireAuth, downloadUserInvoice);
router.post("/api/user/orders/:id/cancel", requireAuth, cancelOrder);

/** Admin routes */
router.get("/api/admin/orders", requireAdmin, listOrders);
router.get("/api/admin/orders/stats", requireAdmin, getOrderStats);
router.get("/api/admin/orders/:id", requireAdmin, getOrder);
router.patch("/api/admin/orders/:id/status", requireAdmin, updateOrderStatus);
router.get("/api/admin/orders/:id/invoice", requireAdmin, downloadInvoice);
router.post("/api/admin/orders/:id/invoice", requireAdmin, regenerateInvoice);

module.exports = router;