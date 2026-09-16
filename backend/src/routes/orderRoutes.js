const express = require("express");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
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
  markPaymentFailedOrder,
  createReturnRequest,
  getUserReturnRequest,
  listReturnRequests,
  getReturnRequestDetails,
  updateReturnRequestStatus,
  approveReturnRequest,
  rejectReturnRequest,
  startReturnRefund,
  completeReturnRefund,
  submitCodRefundDetails,
  getCodRefundDetails,
  processCodRefund,
} = require("../controllers/orderController");

const router = express.Router();

/** Create new order (authenticated user only) */
router.post("/api/orders", requireAuth, createOrder);

/** Guest order endpoints (auth optional — if user has a valid token, it's used to link the order) */
router.post("/api/guest/orders", optionalAuth, createOrder);
router.post("/api/guest/orders/track", trackOrder);
router.get("/api/guest/orders/download-invoice", downloadGuestInvoice);

/** User's own orders (authenticated) */
router.get("/api/user/orders", requireAuth, getUserOrders);
router.get("/api/user/orders/:id", requireAuth, getUserOrder);
router.get("/api/user/orders/:id/download-invoice", requireAuth, downloadUserInvoice);
router.post("/api/user/orders/:id/cancel", requireAuth, cancelOrder);
router.post("/api/user/orders/:id/payment-failed", requireAuth, markPaymentFailedOrder);
router.post("/api/user/orders/:id/return-request", requireAuth, createReturnRequest);
router.get("/api/user/orders/:id/return-request", requireAuth, getUserReturnRequest);

/** Admin routes */
router.get("/api/admin/orders", requireAdmin, listOrders);
router.get("/api/admin/orders/stats", requireAdmin, getOrderStats);
router.get("/api/admin/orders/:id", requireAdmin, getOrder);
router.patch("/api/admin/orders/:id/status", requireAdmin, updateOrderStatus);
router.get("/api/admin/orders/:id/invoice", requireAdmin, downloadInvoice);
router.post("/api/admin/orders/:id/invoice", requireAdmin, regenerateInvoice);
router.get("/api/admin/order-returns", requireAdmin, listReturnRequests);
router.get("/api/admin/order-returns/:id", requireAdmin, getReturnRequestDetails);
router.patch("/api/admin/order-returns/:id/status", requireAdmin, updateReturnRequestStatus);
router.post("/api/admin/order-returns/:id/approve", requireAdmin, approveReturnRequest);
router.post("/api/admin/order-returns/:id/reject", requireAdmin, rejectReturnRequest);
router.post("/api/admin/order-returns/:id/start-refund", requireAdmin, startReturnRefund);
router.post("/api/admin/order-returns/:id/complete-refund", requireAdmin, completeReturnRefund);

/** COD Refund Details (User & Admin) */
router.post("/api/user/orders/:id/cod-refund-details", requireAuth, submitCodRefundDetails);
router.get("/api/admin/order-returns/:id/cod-refund-details", requireAdmin, getCodRefundDetails);
router.post("/api/admin/order-returns/:id/process-cod-refund", requireAdmin, processCodRefund);

module.exports = router;