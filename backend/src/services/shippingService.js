const { query } = require("../config/db");
const settingsService = require("../config/settingsService");
const { getEstimatedDelivery } = require("../config/orderMigration");

const SHIPPING_STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "cancelled",
];

const VALID_STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["in_transit", "delivery_failed", "cancelled"],
  in_transit: ["out_for_delivery", "delivery_failed"],
  out_for_delivery: ["delivered", "delivery_failed"],
  delivered: [],
  delivery_failed: ["shipped", "cancelled"],
  cancelled: [],
};

async function getShippingSettings() {
  return {
    enabled: await settingsService.getBool("shipping.enabled"),
    freeShippingThreshold: await settingsService.getNumber("shipping.free_shipping_threshold"),
    defaultCharge: await settingsService.getNumber("shipping.default_charge"),
    expressCharge: await settingsService.getNumber("shipping.express_charge"),
    codCharge: await settingsService.getNumber("shipping.cod_charge"),
    defaultDeliveryDaysMin: await settingsService.getNumber("shipping.default_delivery_days_min"),
    defaultDeliveryDaysMax: await settingsService.getNumber("shipping.default_delivery_days_max"),
  };
}

async function calculateShipping({ subtotal, paymentMethod, pincode, shippingMethod = "standard" }) {
  const settings = await getShippingSettings();
  
  if (!settings.enabled) {
    return { charge: 0, method: shippingMethod, estimatedDays: { min: 0, max: 0 }, freeShipping: true };
  }

  // Check serviceability first
  const serviceability = await checkPincodeServiceability(pincode);
  if (!serviceability.available) {
    throw new Error("Delivery not available for this pincode");
  }

  // Check free shipping threshold
  if (subtotal >= settings.freeShippingThreshold) {
    return {
      charge: 0,
      method: shippingMethod,
      estimatedDays: serviceability.estimatedDays || { min: settings.defaultDeliveryDaysMin, max: settings.defaultDeliveryDaysMax },
      freeShipping: true,
      zone: serviceability.zone,
    };
  }

  // Determine charge based on shipping method and payment method
  let charge = settings.defaultCharge;
  if (shippingMethod === "express") {
    charge = settings.expressCharge;
  } else if (shippingMethod === "cod" && paymentMethod === "cod") {
    charge = settings.codCharge || settings.defaultCharge;
  }

  return {
    charge,
    method: shippingMethod,
    estimatedDays: serviceability.estimatedDays || { min: settings.defaultDeliveryDaysMin, max: settings.defaultDeliveryDaysMax },
    freeShipping: false,
    zone: serviceability.zone,
  };
}

async function checkPincodeServiceability(pincode) {
  if (!pincode || pincode.length !== 6) {
    return { available: false, reason: "Invalid pincode" };
  }

  // Check shipping zones
  const zones = await query(
    `SELECT * FROM shipping_zones WHERE is_enabled = 1 ORDER BY priority DESC, id ASC`
  );

  for (const zone of zones) {
    const pincodes = zone.pincodes ? JSON.parse(zone.pincodes) : [];
    const states = zone.states ? JSON.parse(zone.states) : [];

    // Check pincode match
    if (pincodes.length > 0 && pincodes.includes(pincode)) {
      return {
        available: true,
        zone: zone.zone_name,
        shippingCharge: zone.shipping_charge,
        expressCharge: zone.express_charge,
        codCharge: zone.cod_charge,
        estimatedDays: {
          min: zone.estimated_delivery_days_min,
          max: zone.estimated_delivery_days_max,
        },
      };
    }

    // Check state match (would need state from pincode lookup)
    // This is a simplified check - in reality you'd lookup state from pincode
    if (states.length > 0) {
      // We'll skip state-based matching for now since we only have pincode
    }
  }

  // Default: use global settings
  const settings = await getShippingSettings();
  return {
    available: true,
    zone: "Default",
    shippingCharge: settings.defaultCharge,
    expressCharge: settings.expressCharge,
    codCharge: settings.codCharge,
    estimatedDays: {
      min: settings.defaultDeliveryDaysMin,
      max: settings.defaultDeliveryDaysMax,
    },
  };
}

async function getShippingMethods() {
  return await query(
    `SELECT * FROM shipping_methods WHERE is_enabled = 1 ORDER BY sort_order ASC, id ASC`
  );
}

async function getShippingMethodByKey(methodKey) {
  const [method] = await query(
    `SELECT * FROM shipping_methods WHERE method_key = ? AND is_enabled = 1`,
    [methodKey]
  );
  return method || null;
}

async function getShippingZones() {
  return await query(
    `SELECT * FROM shipping_zones ORDER BY priority DESC, id ASC`
  );
}

async function getEnabledShippingZones() {
  return await query(
    `SELECT * FROM shipping_zones WHERE is_enabled = 1 ORDER BY priority DESC, id ASC`
  );
}

async function createShippingZone(data) {
  const {
    zone_name,
    states = [],
    pincodes = [],
    shipping_charge = 0,
    express_charge = null,
    cod_charge = null,
    estimated_delivery_days_min = 2,
    estimated_delivery_days_max = 7,
    is_enabled = 1,
    is_default = 0,
    priority = 0,
  } = data;

  // If this is set as default, unset other defaults
  if (is_default) {
    await query(`UPDATE shipping_zones SET is_default = 0 WHERE is_default = 1`);
  }

  const result = await query(
    `INSERT INTO shipping_zones (
      zone_name, states, pincodes, shipping_charge, express_charge, cod_charge,
      estimated_delivery_days_min, estimated_delivery_days_max,
      is_enabled, is_default, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      zone_name,
      JSON.stringify(states),
      JSON.stringify(pincodes),
      shipping_charge,
      express_charge,
      cod_charge,
      estimated_delivery_days_min,
      estimated_delivery_days_max,
      is_enabled,
      is_default,
      priority,
    ]
  );

  return { id: result.insertId, ...data };
}

async function updateShippingZone(id, data) {
  const allowedFields = [
    "zone_name",
    "states",
    "pincodes",
    "shipping_charge",
    "express_charge",
    "cod_charge",
    "estimated_delivery_days_min",
    "estimated_delivery_days_max",
    "is_enabled",
    "is_default",
    "priority",
  ];

  const updates = [];
  const params = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      if (field === "states" || field === "pincodes") {
        params.push(JSON.stringify(data[field]));
      } else {
        params.push(data[field]);
      }
    }
  }

  // If setting as default, unset others
  if (data.is_default) {
    await query(`UPDATE shipping_zones SET is_default = 0 WHERE is_default = 1 AND id != ?`, [id]);
  }

  if (!updates.length) return null;

  params.push(id);
  await query(
    `UPDATE shipping_zones SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );

  return { id, ...data };
}

async function deleteShippingZone(id) {
  // Check if any orders use this zone
  // For now, we'll just delete. In production, you might want to prevent deletion if in use.
  await query(`DELETE FROM shipping_zones WHERE id = ?`, [id]);
  return { success: true };
}

async function validateStatusTransition(currentStatus, newStatus) {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

async function updateOrderShippingStatus(orderId, newStatus, adminId, extraData = {}) {
  const [order] = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!order) throw new Error("Order not found");

  const currentStatus = order.status;
  const isValidTransition = await validateStatusTransition(currentStatus, newStatus);
  
  if (!isValidTransition && currentStatus !== newStatus) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  // Handle special requirements for "shipped" status
  if (newStatus === "shipped") {
    if (!extraData.shipping_provider || !extraData.tracking_number || !extraData.estimated_delivery) {
      throw new Error("Shipping provider, tracking number, and estimated delivery are required when marking as shipped");
    }
  }

  const updates = ["status = ?"];
  const params = [newStatus];

  // Add timestamp columns
  if (newStatus === "shipped") {
    updates.push("shipped_at = CURRENT_TIMESTAMP");
    if (extraData.shipping_provider) {
      updates.push("shipping_provider = ?");
      params.push(extraData.shipping_provider);
    }
    if (extraData.tracking_number) {
      updates.push("tracking_number = ?");
      params.push(extraData.tracking_number);
    }
    if (extraData.estimated_delivery) {
      updates.push("estimated_delivery = ?");
      params.push(extraData.estimated_delivery);
    }
  } else if (newStatus === "out_for_delivery") {
    updates.push("out_for_delivery_at = CURRENT_TIMESTAMP");
  } else if (newStatus === "delivered") {
    updates.push("delivered_at = CURRENT_TIMESTAMP");
  } else if (newStatus === "delivery_failed") {
    updates.push("failed_at = CURRENT_TIMESTAMP");
  } else if (newStatus === "cancelled") {
    updates.push("cancelled_at = CURRENT_TIMESTAMP");
    if (extraData.cancelled_by) {
      updates.push("cancelled_by = ?");
      params.push(extraData.cancelled_by);
    }
    if (extraData.cancel_reason) {
      updates.push("cancel_reason = ?");
      params.push(extraData.cancel_reason);
    }
  }

  params.push(orderId);
  await query(
    `UPDATE orders SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );

  // Add tracking entry
  const trackingLabels = {
    confirmed: { label: "Confirmed", description: "Your order has been confirmed and is being processed" },
    processing: { label: "Processing", description: "Your order is being processed" },
    packed: { label: "Packed", description: "Your items are packed and ready for shipping" },
    shipped: { label: "Shipped", description: "Your package has been shipped and is on its way" },
    in_transit: { label: "In Transit", description: "Your package is on the way to your location" },
    out_for_delivery: { label: "Out for Delivery", description: "Your package is out for delivery today" },
    delivered: { label: "Delivered", description: "Your package has been delivered successfully" },
    delivery_failed: { label: "Delivery Failed", description: "Delivery attempt failed. We will retry or contact you" },
    cancelled: { label: "Cancelled", description: "Your order has been cancelled" },
  };

  if (currentStatus !== newStatus && trackingLabels[newStatus]) {
    await query(
      `INSERT INTO order_tracking (order_id, status, label, description) VALUES (?, ?, ?, ?)`,
      [orderId, newStatus, trackingLabels[newStatus].label, trackingLabels[newStatus].description]
    );
  }

  // Get updated order for notification
  const [updatedOrder] = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
  
  // Notify user
  const { NOTIFICATION_TYPES, createNotification } = require("../services/notificationService");
  const statuses = {
    confirmed: [NOTIFICATION_TYPES.ORDER_CONFIRMED, "Order Confirmed", `Your order #${updatedOrder.order_number} has been confirmed.`],
    processing: [NOTIFICATION_TYPES.ORDER_PROCESSING, "Order Processing", `Your order #${updatedOrder.order_number} is being prepared.`],
    packed: [NOTIFICATION_TYPES.ORDER_PACKED || NOTIFICATION_TYPES.ORDER_PROCESSING, "Order Packed", `Your order #${updatedOrder.order_number} has been packed.`],
    shipped: [NOTIFICATION_TYPES.ORDER_SHIPPED, "Your order is on the way", `Order #${updatedOrder.order_number} has been shipped${updatedOrder.tracking_number ? `. Tracking #: ${updatedOrder.tracking_number}` : "."}`],
    in_transit: [NOTIFICATION_TYPES.ORDER_IN_TRANSIT || NOTIFICATION_TYPES.ORDER_SHIPPED, "In Transit", `Order #${updatedOrder.order_number} is in transit.`],
    out_for_delivery: [NOTIFICATION_TYPES.ORDER_OUT_FOR_DELIVERY, "Out for Delivery", `Order #${updatedOrder.order_number} is out for delivery.`],
    delivered: [NOTIFICATION_TYPES.ORDER_DELIVERED, "Order Delivered", `Order #${updatedOrder.order_number} was delivered successfully.`],
    delivery_failed: [NOTIFICATION_TYPES.ORDER_DELIVERY_FAILED || NOTIFICATION_TYPES.ORDER_SHIPPED, "Delivery Failed", `Delivery failed for order #${updatedOrder.order_number}. We will contact you.`],
    cancelled: [NOTIFICATION_TYPES.ORDER_CANCELLED, "Order Cancelled", `Order #${updatedOrder.order_number} has been cancelled.`],
  };

  const definition = statuses[newStatus];
  if (definition && updatedOrder.user_id) {
    try {
      await createNotification({
        userId: updatedOrder.user_id,
        type: definition[0],
        title: definition[1],
        message: definition[2],
        data: { orderId: updatedOrder.id, orderNumber: updatedOrder.order_number, trackingNumber: updatedOrder.tracking_number || null },
        actionUrl: `/orders/${updatedOrder.id}`,
        eventKey: `order:${updatedOrder.id}:status:${newStatus}`,
      });
    } catch (error) {
      console.warn("[NOTIFICATION] Shipping status notification failed:", error.message);
    }
  }

  return updatedOrder;
}

async function getShippingSummary() {
  const [total] = await query("SELECT COUNT(*) as count FROM orders");
  const [pending] = await query("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'confirmed', 'processing')");
  const [packed] = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'packed'");
  const [shipped] = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'");
  const [inTransit] = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'in_transit'");
  const [outForDelivery] = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'out_for_delivery'");
  const [delivered] = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'");
  const [deliveryFailed] = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'delivery_failed'");
  const [cancelled] = await query("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'");

  return {
    total: total.count,
    pending: pending.count,
    packed: packed.count,
    shipped: shipped.count,
    inTransit: inTransit.count,
    outForDelivery: outForDelivery.count,
    delivered: delivered.count,
    deliveryFailed: deliveryFailed.count,
    cancelled: cancelled.count,
  };
}

async function getShipments({ page = 1, limit = 20, status, search }) {
  const offset = (page - 1) * limit;
  let where = "WHERE 1=1";
  const params = [];

  if (status) {
    where += " AND o.status = ?";
    params.push(status);
  }

  if (search) {
    where += " AND (o.order_number LIKE ? OR o.tracking_number LIKE ? OR o.guest_name LIKE ? OR o.guest_email LIKE ? OR o.guest_phone LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }

  const [totalRow] = await query(
    `SELECT COUNT(*) as count FROM orders o ${where}`,
    params
  );

  const orders = await query(
    `SELECT o.*, 
            COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') as customer_name,
            COALESCE(u.email, o.guest_email) as customer_email,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    shipments: orders,
    pagination: {
      total: totalRow.count,
      page,
      limit,
      pages: Math.ceil(totalRow.count / limit),
    },
  };
}

async function getShipmentDetails(orderId) {
  const [order] = await query(
    `SELECT o.*,
            COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') as customer_name,
            COALESCE(u.email, o.guest_email) as customer_email,
            COALESCE(up.phone, o.guest_phone) as customer_phone
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE o.id = ?`,
    [orderId]
  );

  if (!order) return null;

  const items = await query(
    `SELECT oi.*, p.image_url as product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  const trackingHistory = await query(
    `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY timestamp ASC`,
    [orderId]
  );

  const trackingSteps = getTrackingSteps(order.status);

  return {
    ...order,
    items,
    trackingHistory,
    trackingSteps,
  };
}

function getTrackingSteps(currentStatus = "pending") {
  const TRACKING_STEPS = [
    { status: "pending", label: "Order Placed", description: "Your order has been placed and is awaiting confirmation" },
    { status: "confirmed", label: "Order Confirmed", description: "Your order has been confirmed" },
    { status: "processing", label: "Processing", description: "Your order is being prepared" },
    { status: "packed", label: "Packed", description: "Your order has been packed and is ready for shipping" },
    { status: "shipped", label: "Shipped", description: "Your order has been shipped and is on its way" },
    { status: "in_transit", label: "In Transit", description: "Your order is on the way to your location" },
    { status: "out_for_delivery", label: "Out for Delivery", description: "Your order is out for delivery today" },
    { status: "delivered", label: "Delivered", description: "Your order has been delivered successfully" },
    { status: "delivery_failed", label: "Delivery Failed", description: "Delivery attempt failed. We will retry or contact you" },
    { status: "cancelled", label: "Cancelled", description: "Your order has been cancelled" },
  ];

  const currentIndex = TRACKING_STEPS.findIndex((step) => step.status === currentStatus);
  return TRACKING_STEPS.map((step, index) => ({
    ...step,
    completed: currentIndex >= index || currentStatus === "delivered",
    current: step.status === currentStatus,
  }));
}

module.exports = {
  getShippingSettings,
  calculateShipping,
  checkPincodeServiceability,
  getShippingMethods,
  getShippingMethodByKey,
  getShippingZones,
  getEnabledShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  validateStatusTransition,
  updateOrderShippingStatus,
  getShippingSummary,
  getShipments,
  getShipmentDetails,
  getTrackingSteps,
  SHIPPING_STATUS_FLOW,
  VALID_STATUS_TRANSITIONS,
};