const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const shippingService = require("../services/shippingService");
const { NOTIFICATION_TYPES, createNotification } = require("../services/notificationService");
const { ACTIVITY_TYPES, createActivity } = require("../services/adminActivityService");

/** GET /api/admin/shipping/summary */
const getShippingSummary = asyncHandler(async (req, res) => {
  const summary = await shippingService.getShippingSummary();
  return success(res, "Shipping summary fetched", { summary });
});

/** GET /api/admin/shipping */
const getShipments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const status = req.query.status || null;
  const search = req.query.search ? req.query.search.trim() : null;

  const result = await shippingService.getShipments({ page, limit, status, search });
  return success(res, "Shipments fetched", result);
});

/** GET /api/admin/shipping/:id */
const getShipmentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const shipment = await shippingService.getShipmentDetails(id);
  if (!shipment) throw new AppError("Shipment not found", 404, "NOT_FOUND");
  return success(res, "Shipment details fetched", { shipment });
});

/** PATCH /api/admin/shipping/:id/status */
const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, shipping_provider, tracking_number, estimated_delivery, cancelled_by, cancel_reason } = req.body;

  if (!status) throw new AppError("Status is required", 400, "VALIDATION_ERROR");

  // Validate status
  if (!shippingService.SHIPPING_STATUS_FLOW.includes(status)) {
    throw new AppError("Invalid shipping status", 400, "VALIDATION_ERROR");
  }

  // Get current order to validate transition
  const { query } = require("../config/db");
  const [order] = await query("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  // Check if transition is valid
  const isValidTransition = await shippingService.validateStatusTransition(order.status, status);
  if (!isValidTransition && order.status !== status) {
    throw new AppError(
      `Cannot change status from ${order.status} to ${status}`,
      400,
      "INVALID_STATUS_TRANSITION"
    );
  }

  // For shipped status, require tracking info
  if (status === "shipped") {
    if (!shipping_provider || !tracking_number || !estimated_delivery) {
      throw new AppError(
        "Shipping provider, tracking number, and estimated delivery are required when marking as shipped",
        400,
        "MISSING_SHIPPING_INFO"
      );
    }
  }

  const extraData = {};
  if (status === "shipped") {
    extraData.shipping_provider = shipping_provider;
    extraData.tracking_number = tracking_number;
    extraData.estimated_delivery = estimated_delivery;
  }
  if (status === "cancelled") {
    extraData.cancelled_by = cancelled_by || "ADMIN";
    extraData.cancel_reason = cancel_reason;
  }

  const updatedOrder = await shippingService.updateOrderShippingStatus(id, status, req.admin?.id, extraData);

  // Admin activity
  try {
    await createActivity({
      userId: req.admin?.id,
      activityType: ACTIVITY_TYPES.ORDER_STATUS_CHANGED,
      entityType: "order",
      entityId: id,
      metadata: {
        orderId: id,
        orderNumber: updatedOrder.order_number,
        fromStatus: order.status,
        toStatus: status,
        shippingProvider: shipping_provider,
        trackingNumber: tracking_number,
      },
      eventKey: `ORDER_STATUS_CHANGED:${id}:${status}`,
    });
  } catch (activityError) {
    console.warn("[ACTIVITY] Shipping status change activity failed:", activityError.message);
  }

  return success(res, "Shipment status updated", { order: updatedOrder });
});

/** GET /api/admin/shipping/settings */
const getShippingSettings = asyncHandler(async (req, res) => {
  const settings = await shippingService.getShippingSettings();
  return success(res, "Shipping settings fetched", { settings });
});

/** PUT /api/admin/shipping/settings */
const updateShippingSettings = asyncHandler(async (req, res) => {
  const {
    enabled,
    free_shipping_threshold,
    default_charge,
    express_charge,
    cod_charge,
    default_delivery_days_min,
    default_delivery_days_max,
  } = req.body;

  const settingsService = require("../config/settingsService");
  
  const updates = [];
  if (enabled !== undefined) updates.push(settingsService.set("shipping.enabled", String(enabled)));
  if (free_shipping_threshold !== undefined) updates.push(settingsService.set("shipping.free_shipping_threshold", String(free_shipping_threshold)));
  if (default_charge !== undefined) updates.push(settingsService.set("shipping.default_charge", String(default_charge)));
  if (express_charge !== undefined) updates.push(settingsService.set("shipping.express_charge", String(express_charge)));
  if (cod_charge !== undefined) updates.push(settingsService.set("shipping.cod_charge", String(cod_charge)));
  if (default_delivery_days_min !== undefined) updates.push(settingsService.set("shipping.default_delivery_days_min", String(default_delivery_days_min)));
  if (default_delivery_days_max !== undefined) updates.push(settingsService.set("shipping.default_delivery_days_max", String(default_delivery_days_max)));

  await Promise.all(updates);

  const settings = await shippingService.getShippingSettings();
  return success(res, "Shipping settings updated", { settings });
});

/** GET /api/admin/shipping/methods */
const getShippingMethods = asyncHandler(async (req, res) => {
  const methods = await shippingService.getShippingMethods();
  return success(res, "Shipping methods fetched", { methods });
});

/** POST /api/admin/shipping/methods */
const createShippingMethod = asyncHandler(async (req, res) => {
  const { query } = require("../config/db");
  const {
    method_key,
    name,
    description,
    base_charge,
    estimated_days_min,
    estimated_days_max,
    is_enabled,
    is_default,
    supports_cod,
    supports_online,
    sort_order,
  } = req.body;

  if (!method_key || !name) {
    throw new AppError("Method key and name are required", 400, "VALIDATION_ERROR");
  }

  // If this is set as default, unset other defaults
  if (is_default) {
    await query(`UPDATE shipping_methods SET is_default = 0 WHERE is_default = 1`);
  }

  const result = await query(
    `INSERT INTO shipping_methods (
      method_key, name, description, base_charge, estimated_days_min, estimated_days_max,
      is_enabled, is_default, supports_cod, supports_online, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      method_key,
      name,
      description || null,
      base_charge || 0,
      estimated_days_min || 2,
      estimated_days_max || 7,
      is_enabled !== undefined ? is_enabled : 1,
      is_default || 0,
      supports_cod !== undefined ? supports_cod : 1,
      supports_online !== undefined ? supports_online : 1,
      sort_order || 0,
    ]
  );

  return success(res, "Shipping method created", { id: result.insertId }, 201);
});

/** PUT /api/admin/shipping/methods/:id */
const updateShippingMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { query } = require("../config/db");
  const {
    method_key,
    name,
    description,
    base_charge,
    estimated_days_min,
    estimated_days_max,
    is_enabled,
    is_default,
    supports_cod,
    supports_online,
    sort_order,
  } = req.body;

  const allowedFields = [
    "method_key",
    "name",
    "description",
    "base_charge",
    "estimated_days_min",
    "estimated_days_max",
    "is_enabled",
    "is_default",
    "supports_cod",
    "supports_online",
    "sort_order",
  ];

  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(req.body[field]);
    }
  }

  if (is_default) {
    await query(`UPDATE shipping_methods SET is_default = 0 WHERE is_default = 1 AND id != ?`, [id]);
  }

  if (!updates.length) throw new AppError("No fields to update", 400, "VALIDATION_ERROR");

  params.push(id);
  await query(
    `UPDATE shipping_methods SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );

  return success(res, "Shipping method updated");
});

/** DELETE /api/admin/shipping/methods/:id */
const deleteShippingMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { query } = require("../config/db");
  await query(`DELETE FROM shipping_methods WHERE id = ?`, [id]);
  return success(res, "Shipping method deleted");
});

/** GET /api/admin/shipping/zones */
const getShippingZones = asyncHandler(async (req, res) => {
  const zones = await shippingService.getShippingZones();
  return success(res, "Shipping zones fetched", { zones });
});

/** GET /api/admin/shipping/zones/enabled */
const getEnabledShippingZones = asyncHandler(async (req, res) => {
  const zones = await shippingService.getEnabledShippingZones();
  return success(res, "Enabled shipping zones fetched", { zones });
});

/** POST /api/admin/shipping/zones */
const createShippingZone = asyncHandler(async (req, res) => {
  const zone = await shippingService.createShippingZone(req.body);
  return success(res, "Shipping zone created", { zone }, 201);
});

/** PUT /api/admin/shipping/zones/:id */
const updateShippingZone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const zone = await shippingService.updateShippingZone(id, req.body);
  if (!zone) throw new AppError("No changes made", 400, "VALIDATION_ERROR");
  return success(res, "Shipping zone updated", { zone });
});

/** DELETE /api/admin/shipping/zones/:id */
const deleteShippingZone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await shippingService.deleteShippingZone(id);
  return success(res, "Shipping zone deleted");
});

/** POST /api/shipping/check-pincode */
const checkPincodeServiceability = asyncHandler(async (req, res) => {
  const { pincode } = req.body;
  if (!pincode || pincode.length !== 6) {
    throw new AppError("Valid 6-digit pincode is required", 400, "VALIDATION_ERROR");
  }

  const result = await shippingService.checkPincodeServiceability(pincode);
  return success(res, "Pincode checked", result);
});

/** POST /api/shipping/calculate */
const calculateShipping = asyncHandler(async (req, res) => {
  const { subtotal, payment_method, pincode, shipping_method } = req.body;
  
  if (subtotal === undefined || !payment_method || !pincode) {
    throw new AppError("subtotal, payment_method, and pincode are required", 400, "VALIDATION_ERROR");
  }

  const result = await shippingService.calculateShipping({
    subtotal: Number(subtotal),
    paymentMethod: payment_method,
    pincode,
    shippingMethod: shipping_method || "standard",
  });

  return success(res, "Shipping calculated", result);
});

module.exports = {
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
};