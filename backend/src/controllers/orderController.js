const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { normalizeImageUrl } = require("../utils/uploadPaths");
const { generateInvoicePDF } = require("../services/pdfService");
const { sendInvoiceEmail } = require("../services/invoiceEmailService");
const { ensureOrderTrackingTable, getTrackingSteps, getEstimatedDelivery, generateTrackingNumber } = require("../config/orderMigration");

const normalizeOrderItemImages = (items) =>
  items.map((item) => ({
    ...item,
    product_image: normalizeImageUrl(item.product_image),
  }));

const clearUserCart = async (userId) => {
  if (!userId) return;

  const [cart] = await query("SELECT * FROM carts WHERE user_id = ?", [userId]);
  if (!cart) return;

  await query("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);
};

const ALLOWED_PAYMENT_METHODS = ["cod", "online", "card", "upi"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+()\-\.\s\d]{7,20}$/;

const normalizeCustomer = (customer = {}) => ({
  full_name: String(customer.full_name || "").trim(),
  email: String(customer.email || "").trim().toLowerCase(),
  phone: String(customer.phone || "").trim(),
  address: String(customer.address || "").trim(),
  city: String(customer.city || "").trim(),
  state: String(customer.state || "").trim(),
  pincode: String(customer.pincode || "").trim(),
});

const validateCheckoutRequest = (items, customer, payment_method) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("items array is required and cannot be empty", 400, "VALIDATION_ERROR");
  }

  if (!customer || typeof customer !== "object") {
    throw new AppError("customer details are required", 400, "VALIDATION_ERROR");
  }

  const normalizedCustomer = normalizeCustomer(customer);
  const requiredFields = ["full_name", "email", "phone", "address", "city", "state", "pincode"];

  for (const field of requiredFields) {
    if (!normalizedCustomer[field]) {
      throw new AppError("Please complete all required checkout fields", 400, "VALIDATION_ERROR");
    }
  }

  if (!EMAIL_REGEX.test(normalizedCustomer.email)) {
    throw new AppError("Please enter a valid email address", 400, "VALIDATION_ERROR");
  }

  if (!PHONE_REGEX.test(normalizedCustomer.phone)) {
    throw new AppError("Please enter a valid phone number", 400, "VALIDATION_ERROR");
  }

  const normalizedPaymentMethod = String(payment_method || "cod").trim().toLowerCase();
  if (!ALLOWED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
    throw new AppError("Please select a valid payment method", 400, "VALIDATION_ERROR");
  }

  return {
    customer: normalizedCustomer,
    payment_method: normalizedPaymentMethod,
  };
};

/**
 * ✅ POST /api/orders (authenticated user)
 * ✅ POST /api/guest/orders (guest user)
 * Create a new order, generate invoice, send email
 */
const createOrder = asyncHandler(async (req, res) => {
  const user_id = req.user?.id || null;
  const { items, customer, payment_method } = req.body;

  const { customer: normalizedCustomer, payment_method: normalizedPaymentMethod } = validateCheckoutRequest(
    items,
    customer,
    payment_method
  );

  try {
    await ensureOrderTrackingTable();

    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity < 1) {
        throw new AppError("Invalid product_id or quantity for item", 400, "VALIDATION_ERROR");
      }

      const [product] = await query("SELECT * FROM products WHERE id = ?", [product_id]);
      if (!product) {
        throw new AppError(`Product ${product_id} not found`, 404, "NOT_FOUND");
      }

      if (product.stock_quantity < quantity) {
        throw new AppError(
          `Product "${product.name}" has insufficient stock. Available: ${product.stock_quantity}, Requested: ${quantity}`,
          400,
          "INSUFFICIENT_STOCK"
        );
      }

      validatedItems.push({
        product_id,
        quantity: parseInt(quantity, 10),
        product_name: product.name,
        price: parseFloat(product.price),
      });

      totalAmount += parseFloat(product.price) * parseInt(quantity, 10);
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).slice(2, 8).toUpperCase();
    const orderNumber = `ORD-${timestamp}${randomStr}`;
    const invoiceNumber = `INV-${timestamp}${randomStr}`;
    const trackingNumber = generateTrackingNumber();
    const estimatedDelivery = getEstimatedDelivery();
    const userEmail = typeof req.user?.email === "string" ? req.user.email : normalizedCustomer.email || null;

    const result = await query(
      `INSERT INTO orders (
        user_id,
        order_number,
        invoice_number,
        tracking_number,
        total_amount,
        status,
        payment_status,
        payment_method,
        guest_name,
        guest_email,
        guest_phone,
        delivery_address,
        guest_city,
        guest_state,
        guest_pincode,
        user_email,
        estimated_delivery
      ) VALUES (?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        user_id,
        orderNumber,
        invoiceNumber,
        trackingNumber,
        totalAmount.toFixed(2),
        normalizedPaymentMethod,
        normalizedCustomer.full_name,
        normalizedCustomer.email,
        normalizedCustomer.phone,
        normalizedCustomer.address,
        normalizedCustomer.city,
        normalizedCustomer.state,
        normalizedCustomer.pincode,
        userEmail,
        estimatedDelivery,
      ]
    );

    const orderId = result.insertId;

    console.log(`✅ [ORDER] Created order ${orderNumber} for user_id=${user_id || "guest"}`);

    for (const item of validatedItems) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.price, item.quantity]
      );

      const [product] = await query("SELECT * FROM products WHERE id = ?", [item.product_id]);
      const oldStock = product.stock_quantity;
      const newStock = oldStock - item.quantity;

      let stockStatus = "in_stock";
      if (newStock === 0) {
        stockStatus = "out_of_stock";
      } else if (newStock <= product.low_stock_limit) {
        stockStatus = "limited_stock";
      }

      await query(
        `UPDATE products
         SET stock_quantity = ?, stock_status = ?, stock = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newStock, stockStatus, newStock, item.product_id]
      );

      await query(
        `INSERT INTO inventory_logs (product_id, old_stock, new_stock, action_type, updated_by, notes)
         VALUES (?, ?, ?, 'order_purchase', ?, ?)`,
        [item.product_id, oldStock, newStock, user_id, `Order #${orderNumber}`]
      );

      if (newStock === 0) {
        await query(
          `INSERT INTO inventory_alerts (product_id, alert_type, message)
           VALUES (?, 'out_of_stock', ?)`,
          [item.product_id, `Product "${product.name}" is now OUT OF STOCK after purchase`]
        );
      }
    }

    await query(
      `INSERT INTO order_tracking (order_id, status, label, description)
       VALUES (?, 'pending', 'Order Confirmed', 'Your order has been placed and is awaiting confirmation')`,
      [orderId]
    );

    await clearUserCart(user_id);

    const [createdOrder] = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const orderItems = await query(
      `SELECT oi.*, p.image_url AS product_image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const normalizedItems = normalizeOrderItemImages(orderItems);

    generateInvoicePDF(createdOrder, orderItems)
      .then(async (invoiceResult) => {
        console.log(`✅ [ORDER] Invoice generated for order #${orderNumber}: ${invoiceResult.fileName}`);

        try {
          const emailResult = await sendInvoiceEmail({
            order: createdOrder,
            items: orderItems,
            pdfPath: invoiceResult.filePath,
            invoiceNumber: invoiceResult.invoiceNumber,
          });

          if (emailResult.success) {
            console.log(`✅ [ORDER] Invoice email sent for order #${orderNumber}`);
          } else {
            console.warn(`⚠️ [ORDER] Invoice email failed for order #${orderNumber}: ${emailResult.error}`);
          }
        } catch (emailError) {
          console.error(`❌ [ORDER] Email error for order #${orderNumber}:`, emailError.message);
        }
      })
      .catch((pdfError) => {
        console.error(`❌ [ORDER] PDF generation failed for order #${orderNumber}:`, pdfError.message);
      });

    return success(
      res,
      "Order created successfully",
      {
        order: { ...createdOrder, items: normalizedItems, estimated_delivery: estimatedDelivery },
      },
      201
    );
  } catch (error) {
    console.error("❌ [ORDER] createOrder failed", {
      message: error.message,
      stack: error.stack,
      user_id,
    });
    throw error;
  }
});

/**
 * ✅ POST /api/guest/orders/track
 * Track an order by order_number (or tracking_number) and contact (email or phone)
 */
const trackOrder = asyncHandler(async (req, res) => {
  const { order_number, tracking_number, contact } = req.body;

  const identifier = order_number || tracking_number;
  if (!identifier || !contact) {
    throw new AppError("order_number or tracking_number and contact are required", 400, "VALIDATION_ERROR");
  }

  const [order] = await query(
    `SELECT o.*, 
            COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name,
            COALESCE(u.email, o.guest_email) AS customer_email
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE (o.order_number = ? OR o.tracking_number = ?)
       AND (o.guest_email = ? OR o.guest_phone = ? OR u.email = ?)
     LIMIT 1`,
    [identifier, identifier, contact, contact, contact]
  );

  if (!order) {
    throw new AppError("Order not found. Please check your order/tracking number and contact details.", 404, "ORDER_NOT_FOUND");
  }

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [order.id]
  );

  // Get tracking timeline
  const trackingHistory = await query(
    `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY timestamp ASC`,
    [order.id]
  );

  const trackingSteps = getTrackingSteps(order.status);

  return success(res, "Order found", { 
    order: { ...order, items: normalizeOrderItemImages(items), trackingHistory, trackingSteps } 
  });
});

/** GET /api/user/orders - Get authenticated user's orders */
const getUserOrders = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const [totalRow] = await query(
    `SELECT COUNT(*) AS count FROM orders WHERE user_id = ?`,
    [user_id]
  );

  const orders = await query(
    `SELECT o.*, 
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [user_id, limit, offset]
  );

  return success(res, "Orders fetched", {
    orders,
    pagination: {
      total: Number(totalRow.count),
      page,
      limit,
      pages: Math.ceil(Number(totalRow.count) / limit),
    },
  });
});

/** GET /api/user/orders/:id - Get authenticated user's specific order */
const getUserOrder = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const [order] = await query(
    `SELECT o.*
     FROM orders o
     WHERE o.id = ? AND o.user_id = ?`,
    [req.params.id, user_id]
  );

  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [req.params.id]
  );

  // Get tracking timeline
  const trackingHistory = await query(
    `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY timestamp ASC`,
    [req.params.id]
  );

  const trackingSteps = getTrackingSteps(order.status);

  return success(res, "Order fetched", { 
    order: { ...order, items: normalizeOrderItemImages(items), trackingHistory, trackingSteps } 
  });
});

/** GET /api/admin/orders?page=1&limit=20&status=&search= */
const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const status = req.query.status || null;
  const search = req.query.search ? req.query.search.trim() : null;

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

  const [totalRow] = await query(`SELECT COUNT(*) AS count FROM orders o ${where}`, params);

  const orders = await query(
    `SELECT o.*,
            COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name,
            COALESCE(u.email, o.guest_email) AS customer_email,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return success(res, "Orders fetched", {
    orders,
    pagination: {
      total: Number(totalRow.count),
      page,
      limit,
      pages: Math.ceil(Number(totalRow.count) / limit),
    },
  });
});

/** GET /api/admin/orders/:id */
const getOrder = asyncHandler(async (req, res) => {
  const [order] = await query(
    `SELECT o.*,
            COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name,
            COALESCE(u.email, o.guest_email) AS customer_email
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE o.id = ?`,
    [req.params.id]
  );
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [req.params.id]
  );

  // Get tracking timeline
  const trackingHistory = await query(
    `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY timestamp ASC`,
    [req.params.id]
  );

  const trackingSteps = getTrackingSteps(order.status);

  return success(res, "Order fetched", { 
    order: { ...order, items: normalizeOrderItemImages(items), trackingHistory, trackingSteps } 
  });
});

/** PATCH /api/admin/orders/:id/status */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, payment_status, admin_notes } = req.body;

  const validStatuses = ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
  const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
  const trackingLabels = {
    confirmed: { label: "Confirmed", description: "Your order has been confirmed and is being processed" },
    processing: { label: "Processing", description: "Your order is being processed" },
    packed: { label: "Packed", description: "Your items are packed and ready for shipping" },
    shipped: { label: "Shipped", description: "Your package has been shipped and is on its way" },
    out_for_delivery: { label: "Out for Delivery", description: "Your package is out for delivery today" },
    delivered: { label: "Delivered", description: "Your package has been delivered successfully" },
    cancelled: { label: "Cancelled", description: "Your order has been cancelled" },
  };

  if (status && !validStatuses.includes(status))
    throw new AppError("Invalid order status", 400, "VALIDATION_ERROR");
  if (payment_status && !validPaymentStatuses.includes(payment_status))
    throw new AppError("Invalid payment status", 400, "VALIDATION_ERROR");

  const existing = await query("SELECT * FROM orders WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Order not found", 404, "NOT_FOUND");

  const updates = [];
  const params = [];
  if (status) { updates.push("status = ?"); params.push(status); }
  if (payment_status) { updates.push("payment_status = ?"); params.push(payment_status); }
  if (admin_notes !== undefined) { updates.push("admin_notes = ?"); params.push(admin_notes); }

  if (!updates.length) throw new AppError("No update fields provided", 400, "VALIDATION_ERROR");

  params.push(id);
  await query(`UPDATE orders SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);

  // Add tracking entry if status changed
  if (status && trackingLabels[status]) {
    await query(
      `INSERT INTO order_tracking (order_id, status, label, description)
       VALUES (?, ?, ?, ?)`,
      [id, status, trackingLabels[status].label, trackingLabels[status].description]
    );
  }

  const [updated] = await query("SELECT * FROM orders WHERE id = ?", [id]);
  return success(res, "Order updated", { order: updated });
});

/** POST /api/admin/orders/:id/invoice - Regenerate invoice */
const regenerateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [order] = await query("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [id]
  );

  // Generate invoice
  const invoiceResult = await generateInvoicePDF(order, items);
  
  // Send email
  await sendInvoiceEmail({
    order,
    items,
    pdfPath: invoiceResult.filePath,
    invoiceNumber: invoiceResult.invoiceNumber,
  });

  return success(res, "Invoice regenerated and sent", {
    invoice: invoiceResult,
  });
});

/** GET /api/admin/orders/:id/invoice - Download invoice */
const downloadInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [order] = await query("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [id]
  );

  const invoiceResult = await generateInvoicePDF(order, items);
  const fileName = `${invoiceResult.invoiceNumber}.pdf`;

  res.download(invoiceResult.filePath, fileName, (err) => {
    if (err) {
      console.error("❌ [Invoice] Download error:", err);
      throw new AppError("Failed to download invoice", 500, "DOWNLOAD_ERROR");
    }
  });
});

/** GET /api/admin/orders/stats - Order dashboard stats */
const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await query(`
    SELECT 
      COUNT(*) AS total_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped_count,
      SUM(CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END) AS out_for_delivery_count,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
      COALESCE(SUM(total_amount), 0) AS total_revenue,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_revenue
    FROM orders
  `);

  // Get recent orders
  const recentOrders = await query(`
    SELECT o.*,
           COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);

  return success(res, "Order stats fetched", {
    stats: stats[0],
    recentOrders,
  });
});

module.exports = { 
  createOrder, 
  listOrders, 
  getOrder, 
  updateOrderStatus, 
  trackOrder,
  getUserOrders,
  getUserOrder,
  regenerateInvoice,
  downloadInvoice,
  getOrderStats,
};