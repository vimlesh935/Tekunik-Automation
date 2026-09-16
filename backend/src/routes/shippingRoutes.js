const express = require("express");
const { requireAdmin } = require("../middleware/adminMiddleware");
const { requireAuth, optionalAuth } = require("../middleware/authMiddleware");
const {
  getShippingSummary,
  getShipments,
  getShipmentDetails,
  updateShipmentStatus,
  getShippingSettings,
  updateShippingSettings,
  getShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getShippingZones,
  getEnabledShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  checkPincodeServiceability,
  calculateShipping,
} = require("../controllers/shippingController");

const router = express.Router();

/** Admin Shipping Dashboard Summary */
router.get("/api/admin/shipping/summary", requireAdmin, getShippingSummary);

/** Admin Shipping List */
router.get("/api/admin/shipping", requireAdmin, getShipments);

/** Admin Shipping Settings */
router.get("/api/admin/shipping/settings", requireAdmin, getShippingSettings);
router.put("/api/admin/shipping/settings", requireAdmin, updateShippingSettings);

/** Admin Shipping Methods */
router.get("/api/admin/shipping/methods", requireAdmin, getShippingMethods);
router.post("/api/admin/shipping/methods", requireAdmin, createShippingMethod);
router.put("/api/admin/shipping/methods/:id", requireAdmin, updateShippingMethod);
router.delete("/api/admin/shipping/methods/:id", requireAdmin, deleteShippingMethod);

/** Admin Shipping Zones */
router.get("/api/admin/shipping/zones", requireAdmin, getShippingZones);
router.get("/api/admin/shipping/zones/enabled", requireAdmin, getEnabledShippingZones);
router.post("/api/admin/shipping/zones", requireAdmin, createShippingZone);
router.put("/api/admin/shipping/zones/:id", requireAdmin, updateShippingZone);
router.delete("/api/admin/shipping/zones/:id", requireAdmin, deleteShippingZone);

/** Admin Shipping Detail & Status Update */
router.get("/api/admin/shipping/:id", requireAdmin, getShipmentDetails);
router.patch("/api/admin/shipping/:id/status", requireAdmin, updateShipmentStatus);

/** Public Shipping APIs (for checkout) */
router.post("/api/shipping/check-pincode", optionalAuth, checkPincodeServiceability);
router.post("/api/shipping/calculate", optionalAuth, calculateShipping);

module.exports = router;