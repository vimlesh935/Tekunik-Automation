const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");
const { normalizeImageUrl } = require("../utils/uploadPaths");
const { generateInvoicePDF } = require("../services/pdfService");
const { sendInvoiceEmail } = require("../services/invoiceEmailService");
const {
  getActiveOffers,
  calculateOfferPrice,
} = require("../services/offerPricingService");
const {
  ensureOrderTrackingTable,
  getTrackingSteps,
  getEstimatedDelivery,
  generateTrackingNumber,
} = require("../config/orderMigration");
const { NOTIFICATION_TYPES, createNotification } = require("../services/notificationService");
const { ACTIVITY_TYPES, createActivity, detectProductDemand } = require("../services/adminActivityService");

/**
 * Calculate discount price fields for a product.
 * Returns: { original_price, discount_percent, discount_amount, final_price }
 */
const calculateDiscountPrice = (product) => {
  const originalPrice = parseFloat(product.price) || 0;
  let discountPercent = 0;
  
  if (product.discount_percent !== null && product.discount_percent !== undefined) {
    discountPercent = Math.max(0, Math.min(100, parseFloat(product.discount_percent) || 0));
  }
  
  const discountAmount = Math.max(0, originalPrice * discountPercent / 100);
  const finalPrice = Math.max(0, originalPrice - discountAmount);
  
  return {
    original_price: originalPrice,
    discount_percent: discountPercent,
    discount_amount: Math.round(discountAmount * 100) / 100,
    final_price: Math.round(finalPrice * 100) / 100,
  };
};

const normalizeOrderItemImages = (items) =>
  items.map((item) => ({
    ...item,
    image_url: normalizeImageUrl(item.image_url),
  }));

/** Friendly date for customer emails (e.g. "10 Sep 2026"). */
const formatEmailDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return value || new Date().toLocaleDateString("en-IN");
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const clearUserCart = async (userId) => {
  if (!userId) return;

  const [cart] = await query("SELECT * FROM carts WHERE user_id = ?", [userId]);
  if (!cart) return;

  await query("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);
};

const notifyOrderStatus = async (order, status) => {
  if (!order?.user_id) return;
  const statuses = {
    pending: [NOTIFICATION_TYPES.ORDER_PLACED, "Order Placed Successfully", `Your order #${order.order_number} has been placed successfully.`],
    confirmed: [NOTIFICATION_TYPES.ORDER_CONFIRMED, "Order Confirmed", `Your order #${order.order_number} has been confirmed.`],
    processing: [NOTIFICATION_TYPES.ORDER_PROCESSING, "Order Processing", `Your order #${order.order_number} is being prepared.`],
    packed: [NOTIFICATION_TYPES.ORDER_PACKED, "Order Packed", `Your order #${order.order_number} has been packed.`],
    shipped: [NOTIFICATION_TYPES.ORDER_SHIPPED, "Your order is on the way", `Order #${order.order_number} has been shipped${order.tracking_number ? `. Tracking #: ${order.tracking_number}` : "."}`],
    in_transit: [NOTIFICATION_TYPES.ORDER_IN_TRANSIT, "In Transit", `Order #${order.order_number} is in transit.`],
    out_for_delivery: [NOTIFICATION_TYPES.ORDER_OUT_FOR_DELIVERY, "Out for Delivery", `Order #${order.order_number} is out for delivery.`],
    delivered: [NOTIFICATION_TYPES.ORDER_DELIVERED, "Order Delivered", `Order #${order.order_number} was delivered successfully.`],
    delivery_failed: [NOTIFICATION_TYPES.ORDER_DELIVERY_FAILED, "Delivery Failed", `Delivery failed for order #${order.order_number}. We will contact you.`],
    cancelled: [NOTIFICATION_TYPES.ORDER_CANCELLED, "Order Cancelled", `Order #${order.order_number} has been cancelled.`],
  };
  const definition = statuses[status];
  if (!definition) return;
  try {
    await createNotification({
      userId: order.user_id,
      type: definition[0],
      title: definition[1],
      message: definition[2],
      data: { orderId: order.id, orderNumber: order.order_number, trackingNumber: order.tracking_number || null },
      actionUrl: `/orders/${order.id}`,
      eventKey: `order:${order.id}:status:${status}`,
    });
  } catch (error) {
    console.warn("[NOTIFICATION] Order notification failed:", error.message);
  }
};

const ALLOWED_PAYMENT_METHODS = ["cod", "online", "card", "upi"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+().\s\d-]{7,20}$/;
const REQUIRED_CHECKOUT_FIELDS = [
  "full_name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "pincode",
];

const normalizeCustomer = (customer = {}) => ({
  full_name: String(customer.full_name || "").trim(),
  email: String(customer.email || "")
    .trim()
    .toLowerCase(),
  phone: String(customer.phone || "").trim(),
  address: String(customer.address || "").trim(),
  city: String(customer.city || "").trim(),
  state: String(customer.state || "").trim(),
  pincode: String(customer.pincode || "").trim(),
});

const validateCheckoutRequest = (items, customer, payment_method) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(
      "items array is required and cannot be empty",
      400,
      "VALIDATION_ERROR",
    );
  }

  if (!customer || typeof customer !== "object") {
    throw new AppError(
      "customer details are required",
      400,
      "VALIDATION_ERROR",
    );
  }

  const normalizedCustomer = normalizeCustomer(customer);
  console.log("[ORDER][EmailValidation] Backend received email:", customer.email);
  console.log("[ORDER][EmailValidation] Email after trim():", String(customer.email || "").trim());
  console.log("[ORDER][EmailValidation] Email after trim()+lowercase:", normalizedCustomer.email);
  const requiredFieldState = REQUIRED_CHECKOUT_FIELDS.map((field) => ({
    field,
    value: customer[field],
    normalizedValue: normalizedCustomer[field],
    isUndefined: customer[field] === undefined,
    isNull: customer[field] === null,
    isEmptyString: customer[field] === "",
    isWhitespaceOnly:
      typeof customer[field] === "string" &&
      customer[field].length > 0 &&
      String(customer[field]).trim().length === 0,
    missing: !normalizedCustomer[field],
  }));
  console.log("[ORDER][RequiredFields] Received customer:", JSON.stringify(customer));
  console.table(requiredFieldState);

  for (const field of REQUIRED_CHECKOUT_FIELDS) {
    if (!normalizedCustomer[field]) {
      console.log("[ORDER][RequiredFields] Missing field name:", field);
      console.log("[ORDER][RequiredFields] Validation result:", false);
      throw new AppError(
        "Please complete all required checkout fields",
        400,
        "VALIDATION_ERROR",
      );
    }
  }
  console.log("[ORDER][RequiredFields] Missing field name:", null);
  console.log("[ORDER][RequiredFields] Validation result:", true);

  const emailRegexResult = EMAIL_REGEX.test(normalizedCustomer.email);
  console.log("[ORDER][EmailValidation] Regex result:", emailRegexResult);

  if (!emailRegexResult) {
    console.log("[ORDER][EmailValidation] Final validation result:", false);
    throw new AppError(
      "Please enter a valid email address",
      400,
      "VALIDATION_ERROR",
    );
  }
  console.log("[ORDER][EmailValidation] Final validation result:", true);

  if (!PHONE_REGEX.test(normalizedCustomer.phone)) {
    throw new AppError(
      "Please enter a valid phone number",
      400,
      "VALIDATION_ERROR",
    );
  }

  const normalizedPaymentMethod = String(payment_method || "cod")
    .trim()
    .toLowerCase();
  if (!ALLOWED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
    throw new AppError(
      "Please select a valid payment method",
      400,
      "VALIDATION_ERROR",
    );
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
  let user_id = req.user?.id || null;
  const { items, customer, payment_method } = req.body;
  console.log("[ORDER] Request payload:", JSON.stringify(req.body));

  const {
    customer: normalizedCustomer,
    payment_method: normalizedPaymentMethod,
  } = validateCheckoutRequest(items, customer, payment_method);
  console.log("[ORDER] Checkout data:", JSON.stringify({ items, customer, payment_method }));

  try {
    await ensureOrderTrackingTable();

    // If no authenticated user, check if a registered user exists with this email.
    // If so, link the order to that user instead of leaving user_id = null.
    if (!user_id && normalizedCustomer.email) {
      const [existingUser] = await query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [normalizedCustomer.email],
      );
      if (existingUser) {
        user_id = existingUser.id;
        console.log(
          `[ORDER] Guest email matched existing user_id=${user_id}. Linking order.`,
        );
      }
    }

    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity < 1) {
        throw new AppError(
          "Invalid product_id or quantity for item",
          400,
          "VALIDATION_ERROR",
        );
      }

      const [product] = await query("SELECT * FROM products WHERE id = ?", [
        product_id,
      ]);
      if (!product) {
        throw new AppError(`Product ${product_id} not found`, 404, "NOT_FOUND");
      }

      if (product.stock_quantity < quantity) {
        throw new AppError(
          `Product "${product.name}" has insufficient stock. Available: ${product.stock_quantity}, Requested: ${quantity}`,
          400,
          "INSUFFICIENT_STOCK",
        );
      }

      const itemPrice = parseFloat(product.price) || 0;

      validatedItems.push({
        product_id,
        quantity: parseInt(quantity, 10),
        product_name: product.name,
        original_price: itemPrice,
        product,
      });

      totalAmount += itemPrice * parseInt(quantity, 10);
    }

    const orderSubtotal = totalAmount;
    const couponService = require("../services/couponService");
    let couponSnapshot = null;
    let couponCode = req.body.coupon_code || req.body.couponCode || null;
    let offerDiscountAmount = 0;

    // Check cart for applied coupon if not explicitly in payload
    if (!couponCode && user_id) {
      const [cart] = await query("SELECT applied_coupon_code FROM carts WHERE user_id = ?", [user_id]);
      if (cart && cart.applied_coupon_code) {
        couponCode = cart.applied_coupon_code;
      }
    }

    // 1. First calculate active product offer pricing for each item
    const activeOffers = await getActiveOffers();
    totalAmount = 0;
    validatedItems.forEach((item) => {
      const offerPrice = calculateOfferPrice(item.product, activeOffers, orderSubtotal);
      item.price = offerPrice.final_price;
      item.discount_percent = offerPrice.discount_percent;
      item.discount_amount = offerPrice.discount_amount;
      item.final_price = offerPrice.final_price;
      item.offer_id = offerPrice.offer_id;
      item.offer_name = offerPrice.offer_name;
      offerDiscountAmount += (item.original_price - offerPrice.final_price) * item.quantity;
      totalAmount += item.final_price * item.quantity;
      delete item.product;
    });

    const offerSubtotal = totalAmount;

    // 2. Authoritative server-side coupon re-validation (never trust frontend discount)
    if (couponCode) {
      const verdict = await couponService.validateCoupon({
        userId: user_id || null,
        code: couponCode,
        items: validatedItems.map((i) => ({
          product_id: i.product_id,
          category_id: i.category_id,
          original_price: i.original_price,
          price: i.price,
          final_price: i.final_price,
          discount_percent: i.discount_percent,
          discount_amount: i.discount_amount,
          offer_id: i.offer_id,
          quantity: i.quantity,
        })),
        subtotal: offerSubtotal,
      });

      if (!verdict.ok) {
        throw new AppError(verdict.message, 400, verdict.code);
      }
      couponSnapshot = verdict;
      couponCode = verdict.coupon.code;
    }

    const couponDiscountAmount = couponSnapshot ? Number(couponSnapshot.discount || 0) : 0;
    const totalSavingsAmount = offerDiscountAmount + couponDiscountAmount;
    if (couponSnapshot) totalAmount = Math.max(0, totalAmount - couponDiscountAmount);

    // Calculate shipping charge
    const settingsService = require("../config/settingsService");
    const shippingEnabled = await settingsService.getBool("shipping.enabled");
    let shippingCharge = 0;
    let shippingMethod = "standard";
    
    if (shippingEnabled) {
      const freeShippingThreshold = await settingsService.getNumber("shipping.free_shipping_threshold");
      const defaultCharge = await settingsService.getNumber("shipping.default_charge");
      const expressCharge = await settingsService.getNumber("shipping.express_charge");
      const codCharge = await settingsService.getNumber("shipping.cod_charge");
      
      if (totalAmount < freeShippingThreshold) {
        shippingMethod = normalizedPaymentMethod === "cod" ? "cod" : "standard";
        shippingCharge = normalizedPaymentMethod === "cod" ? codCharge : defaultCharge;
      }
      // If free shipping threshold is met, shippingCharge remains 0
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).slice(2, 8).toUpperCase();
    const orderNumber = `ORD-${timestamp}${randomStr}`;
    const invoiceNumber = `INV-${timestamp}${randomStr}`;
    const trackingNumber = generateTrackingNumber();
    const estimatedDelivery = getEstimatedDelivery();
    const userEmail = req.user?.email || normalizedCustomer.email || null;

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
        shipping_method,
        shipping_charge,
        guest_name,
        guest_email,
        guest_phone,
        delivery_address,
        guest_city,
        guest_state,
        guest_pincode,
        user_email,
        estimated_delivery,
        subtotal,
        offer_discount,
        coupon_code,
        coupon_offer_id,
        coupon_offer_name,
        coupon_coupon_id,
        coupon_discount,
        shipping,
        tax,
        total_savings
      ) VALUES (?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        orderNumber,
        invoiceNumber,
        trackingNumber,
        totalAmount.toFixed(2),
        normalizedPaymentMethod,
        shippingMethod,
        shippingCharge.toFixed(2),
        normalizedCustomer.full_name,
        normalizedCustomer.email,
        normalizedCustomer.phone,
        normalizedCustomer.address,
        normalizedCustomer.city,
        normalizedCustomer.state,
        normalizedCustomer.pincode,
        userEmail,
        estimatedDelivery,
        Number(orderSubtotal).toFixed(2),
        Number(offerDiscountAmount).toFixed(2),
        couponCode || null,
        couponSnapshot ? couponSnapshot.offer.id : null,
        couponSnapshot ? (couponSnapshot.offer.name || couponSnapshot.offer.title) : null,
        couponSnapshot ? couponSnapshot.coupon.id : null,
        Number(couponDiscountAmount).toFixed(2),
        "0.00",
        "0.00",
        Number(totalSavingsAmount).toFixed(2),
      ],
    );

    const orderId = result.insertId;

    console.log(
      `✅ [ORDER] Created order ${orderNumber} for user_id=${user_id || "guest"}`,
    );

    for (const item of validatedItems) {
      await query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, price, original_price,
          discount_percent, discount_amount, final_price, quantity
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.price,
          item.original_price,
          item.discount_percent,
          item.discount_amount,
          item.final_price,
          item.quantity,
        ],
      );

      const [product] = await query("SELECT * FROM products WHERE id = ?", [
        item.product_id,
      ]);
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
        [newStock, stockStatus, newStock, item.product_id],
      );

      await query(
        `INSERT INTO inventory_logs (product_id, old_stock, new_stock, action_type, updated_by, notes)
         VALUES (?, ?, ?, 'order_purchase', ?, ?)`,
        [item.product_id, oldStock, newStock, user_id, `Order #${orderNumber}`],
      );

      if (newStock === 0) {
        await query(
          `INSERT INTO inventory_alerts (product_id, alert_type, message)
           VALUES (?, 'out_of_stock', ?)`,
          [
            item.product_id,
            `Product "${product.name}" is now OUT OF STOCK after purchase`,
          ],
        );
      }
    }

    // 💳 Coupon redemption (runs within the order-creation flow, after the
    // order + items exist; if any step above failed the coupon is NOT consumed).
    if (couponSnapshot && couponCode) {
      const cid = couponSnapshot.coupon.id;
      await query(
        "INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)",
        [cid, user_id, orderId, Number(couponDiscountAmount).toFixed(2)]
      );
      await query(
        "UPDATE coupons SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [cid]
      );
      // Offer-level redemption counter keeps §2 (offers.used_count) accurate.
      if (couponSnapshot.offer?.id) {
        await query(
          "UPDATE discounts SET used_count = used_count + 1 WHERE id = ?",
          [couponSnapshot.offer.id]
        );
      }
      // One-shot personal/welcome coupons move to USED so they stop appearing.
      if (couponSnapshot.coupon.user_id) {
        await query(
          "UPDATE coupons SET status = 'USED', used_at = CURRENT_TIMESTAMP, created_order_id = ? WHERE id = ?",
          [orderId, cid]
        );
      }
      const [cartForCoupon] = await query("SELECT id FROM carts WHERE user_id = ?", [user_id]);
      if (cartForCoupon) {
        await query(
          "UPDATE carts SET applied_coupon_id = NULL, applied_coupon_code = NULL, applied_coupon_discount = 0.00 WHERE id = ?",
          [cartForCoupon.id]
        );
      }
    }

    await query(
      `INSERT INTO order_tracking (order_id, status, label, description)
       VALUES (?, 'pending', 'Order Confirmed', 'Your order has been placed and is awaiting confirmation')`,
      [orderId],
    );

    await notifyOrderStatus({
      id: orderId,
      user_id,
      order_number: orderNumber,
      tracking_number: trackingNumber,
    }, "pending");

    // Admin activity: new order created (HIGH priority)
    try {
      await createActivity({
        userId: user_id,
        activityType: ACTIVITY_TYPES.ORDER_CREATED,
        entityType: "order",
        entityId: orderId,
        metadata: {
          orderId,
          orderNumber,
          totalAmount: totalAmount.toFixed(2),
          itemCount: validatedItems.length,
          customerName: normalizedCustomer.full_name,
          paymentMethod: normalizedPaymentMethod,
        },
        eventKey: `ORDER_CREATED:${orderId}`,
      });
      // Detect product demand for each ordered product
      for (const item of validatedItems) {
        await detectProductDemand(item.product_id);
      }

      // Post-restock purchase signal: customer bought a product they had been
      // notified about via a Back-in-Stock alert. Correlation signal only —
      // never claimed as proof the notification caused the purchase.
      if (user_id) {
        try {
          const itemIds = validatedItems.map((i) => Number(i.product_id)).filter(Boolean);
          if (itemIds.length > 0) {
            const placeholders = itemIds.map(() => "?").join(",");
            const matches = await query(
              `SELECT a.id, a.product_id, a.notified_at, p.name AS product_name
               FROM back_in_stock_alerts a
               JOIN products p ON p.id = a.product_id
               WHERE a.user_id = ? AND a.status = 'NOTIFIED'
                 AND a.product_id IN (${placeholders})
                 AND a.notified_at IS NOT NULL
                 AND a.notified_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
              [user_id, ...itemIds],
            );
            for (const match of matches) {
              await createActivity({
                userId: user_id,
                activityType: ACTIVITY_TYPES.POST_RESTOCK_PURCHASE,
                entityType: "product",
                entityId: match.product_id,
                metadata: {
                  productId: match.product_id,
                  productName: match.product_name,
                  orderId,
                  orderNumber,
                  notifiedAt: match.notified_at,
                  label: "Purchase after Restock Alert",
                },
                eventKey: `POST_RESTOCK_PURCHASE:${orderId}:${match.product_id}`,
              });
            }
          }
        } catch (restockSignalError) {
          console.warn("[ACTIVITY] Post-restock purchase signal failed:", restockSignalError.message);
        }
      }
    } catch (activityError) {
      console.warn("[ACTIVITY] Order created activity failed:", activityError.message);
    }

    await clearUserCart(user_id);

    // Abandoned-cart recovery: flag this recovery record as "recovered" is
    // driven ONLY by this real completion event (never time-based). Non-fatal.
    try {
      const { markRecoveredForOrder } = require("../services/abandonedRecoveryService");
      await markRecoveredForOrder({
        userId: user_id,
        orderId,
        orderNumber,
        totalAmount,
        items: validatedItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      });
    } catch (recoveryError) {
      console.warn("[RECOVERY] markRecoveredForOrder failed:", recoveryError.message);
    }

    const [createdOrder] = await query("SELECT * FROM orders WHERE id = ?", [
      orderId,
    ]);
    const orderItems = await query(
      `SELECT oi.*, p.image_url AS product_image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId],
    );

    const normalizedItems = normalizeOrderItemImages(orderItems);

    generateInvoicePDF(createdOrder, orderItems)
      .then(async (invoiceResult) => {
        console.log(
          `✅ [ORDER] Invoice generated for order #${orderNumber}: ${invoiceResult.fileName}`,
        );

        try {
          const emailResult = await sendInvoiceEmail({
            order: createdOrder,
            items: orderItems,
            pdfPath: invoiceResult.filePath,
            invoiceNumber: invoiceResult.invoiceNumber,
          });

          if (emailResult.success) {
            console.log(
              `✅ [ORDER] Invoice email sent for order #${orderNumber}`,
            );
          } else {
            console.warn(
              `⚠️ [ORDER] Invoice email failed for order #${orderNumber}: ${emailResult.error}`,
            );
          }
        } catch (emailError) {
          console.error(
            `❌ [ORDER] Email error for order #${orderNumber}:`,
            emailError.message,
          );
        }
      })
      .catch((pdfError) => {
        console.error(
          `❌ [ORDER] PDF generation failed for order #${orderNumber}:`,
          pdfError.message,
        );
      });

    // 📧 Order-placed confirmation email — admin-editable template. This is a
    // separate message from the invoice email above (which carries the PDF
    // attachment and is intentionally left unchanged).
    try {
      const { sendEmailTemplate } = require("../services/mailService");
      let customerName = createdOrder.guest_name || createdOrder.user_email || "Customer";
      if (createdOrder.user_id) {
        const [profile] = await query(
          "SELECT CONCAT_WS(' ', first_name, last_name) AS name FROM user_profiles WHERE user_id = ?",
          [createdOrder.user_id],
        );
        if (profile?.name?.trim()) customerName = profile.name.trim();
      }
      sendEmailTemplate({
        templateKey: "order_placed",
        emailKey: `ORDER_PLACED:${orderId}`,
        to: createdOrder.user_email,
        variables: {
          user_name: customerName,
          user_email: createdOrder.user_email,
          order_id: createdOrder.order_number || String(orderId),
          order_total: Number(createdOrder.total_amount || 0).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          }),
          date: formatEmailDate(createdOrder.created_at),
        },
      }).catch((orderEmailError) => {
        console.warn(`[EMAIL] Order placed email failed for order #${orderNumber}:`, orderEmailError.message);
      });
    } catch (orderEmailSetupError) {
      console.warn(`[EMAIL] Order placed email setup failed for order #${orderNumber}:`, orderEmailSetupError.message);
    }

    return success(
      res,
      "Order created successfully",
      {
        order: {
          ...createdOrder,
          items: normalizedItems,
          estimated_delivery: estimatedDelivery,
        },
      },
      201,
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
 * Track an order by tracking_number (or order_number)
 * If tracking_number is provided, no contact is needed.
 * If order_number is provided, contact (email or phone) is still required for verification.
 */
const trackOrder = asyncHandler(async (req, res) => {
  const { order_number, tracking_number, contact } = req.body;

  const identifier = order_number || tracking_number;
  if (!identifier) {
    throw new AppError(
      "order_number or tracking_number is required",
      400,
      "VALIDATION_ERROR",
    );
  }

  let order;

  // If tracking_number is provided, lookup by tracking_number only (no contact needed)
  if (tracking_number) {
    [order] = await query(
      `SELECT o.*,
              COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name,
              COALESCE(u.email, o.guest_email) AS customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE o.tracking_number = ?
       LIMIT 1`,
      [tracking_number],
    );
  } else {
    // If order_number is provided, require contact for security
    if (!contact) {
      throw new AppError(
        "contact (email or phone) is required when using order number",
        400,
        "VALIDATION_ERROR",
      );
    }
    [order] = await query(
      `SELECT o.*,
              COALESCE(CONCAT(up.first_name, ' ', up.last_name), o.guest_name, 'Guest') AS customer_name,
              COALESCE(u.email, o.guest_email) AS customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE o.order_number = ?
         AND (o.guest_email = ? OR o.guest_phone = ? OR u.email = ?)
       LIMIT 1`,
      [identifier, contact, contact, contact],
    );
  }

  if (!order) {
    throw new AppError(
      "Order not found. Please check your tracking/order number.",
      404,
      "ORDER_NOT_FOUND",
    );
  }

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [order.id],
  );

  // Get tracking timeline
  const trackingHistory = await query(
    `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY timestamp ASC`,
    [order.id],
  );

  const trackingSteps = getTrackingSteps(order.status);

  return success(res, "Order found", {
    order: {
      ...order,
      items: normalizeOrderItemImages(items),
      trackingHistory,
      trackingSteps,
    },
  });
});

/** GET /api/user/orders - Get authenticated user's orders */
const getUserOrders = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const user_email = req.user.email;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  // First, retroactively link any orphaned guest orders to this user
  if (user_email) {
    await query(
      `UPDATE orders SET user_id = ? WHERE user_id IS NULL AND (guest_email = ? OR user_email = ?)`,
      [user_id, user_email, user_email],
    );
  }

  const [totalRow] = await query(
    `SELECT COUNT(*) AS count FROM orders WHERE user_id = ?`,
    [user_id],
  );

  const [itemsRow] = await query(
    `SELECT COALESCE(SUM(oi.quantity), 0) AS total_items
     FROM order_items oi
     INNER JOIN orders o ON oi.order_id = o.id
     WHERE o.user_id = ?`,
    [user_id],
  );

  const orders = await query(
    `SELECT o.*,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
            (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = o.id) AS total_quantity,
            (SELECT oi.product_name FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id ASC LIMIT 1) AS first_product_name,
            (
              SELECT p.image_url
              FROM order_items oi
              LEFT JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id = o.id
              ORDER BY oi.id ASC
              LIMIT 1
            ) AS first_product_image,
            (SELECT r.status FROM order_returns r WHERE r.order_id = o.id) AS return_status,
            (SELECT r.refund_status FROM order_returns r WHERE r.order_id = o.id) AS return_refund_status,
            (SELECT r.rejection_reason FROM order_returns r WHERE r.order_id = o.id) AS return_rejection_reason,
            (SELECT r.requested_at FROM order_returns r WHERE r.order_id = o.id) AS return_requested_at,
            (SELECT r.id FROM order_returns r WHERE r.order_id = o.id) AS return_id
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [user_id, limit, offset],
  );

  const normalizedOrders = orders.map((order) => ({
    ...order,
    first_product_image: normalizeImageUrl(order.first_product_image),
    return_status: order.return_status ? normalizeReturnStatus(order.return_status) : null,
  }));

  return success(res, "Orders fetched", {
    orders: normalizedOrders,
    total_items: Number(itemsRow.total_items),
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
    [req.params.id, user_id],
  );

  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [req.params.id],
  );

  // Get tracking timeline
  const trackingHistory = await query(
    `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY timestamp ASC`,
    [req.params.id],
  );

  const trackingSteps = getTrackingSteps(order.status);

  // Include the customer's own return request (if one exists).
  const [returnRequest] = await query("SELECT * FROM order_returns WHERE order_id = ?", [req.params.id]);

  return success(res, "Order fetched", {
    order: {
      ...order,
      items: normalizeOrderItemImages(items),
      trackingHistory,
      trackingSteps,
      returnRequest: returnRequest
        ? {
            ...returnRequest,
            status: normalizeReturnStatus(returnRequest.status),
            status_label: RETURN_STATUS_META[normalizeReturnStatus(returnRequest.status)]?.label || returnRequest.status,
            refund_status_label: REFUND_STATUS_META[returnRequest.refund_status]?.label || null,
            requested_amount: Number(returnRequest.requested_amount ?? order.total_amount ?? 0),
            approved_amount: returnRequest.approved_amount != null ? Number(returnRequest.approved_amount) : null,
            timeline: parseReturnTimeline(returnRequest),
          }
        : null,
    },
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
    where +=
      " AND (o.order_number LIKE ? OR o.tracking_number LIKE ? OR o.guest_name LIKE ? OR o.guest_email LIKE ? OR o.guest_phone LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }

  const [totalRow] = await query(
    `SELECT COUNT(*) AS count FROM orders o ${where}`,
    params,
  );

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
    [...params, limit, offset],
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
    [req.params.id],
  );
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [req.params.id],
  );

  // Get tracking timeline
  const trackingHistory = await query(
    `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY timestamp ASC`,
    [req.params.id],
  );

  const trackingSteps = getTrackingSteps(order.status);

  return success(res, "Order fetched", {
    order: {
      ...order,
      items: normalizeOrderItemImages(items),
      trackingHistory,
      trackingSteps,
    },
  });
});

/** PATCH /api/admin/orders/:id/status */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, payment_status, admin_notes, shipping_provider, tracking_number, estimated_delivery } = req.body;

  const validStatuses = [
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
  const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];
  const trackingLabels = {
    confirmed: {
      label: "Confirmed",
      description: "Your order has been confirmed and is being processed",
    },
    processing: {
      label: "Processing",
      description: "Your order is being processed",
    },
    packed: {
      label: "Packed",
      description: "Your items are packed and ready for shipping",
    },
    shipped: {
      label: "Shipped",
      description: "Your package has been shipped and is on its way",
    },
    in_transit: {
      label: "In Transit",
      description: "Your package is on the way to your location",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      description: "Your package is out for delivery today",
    },
    delivered: {
      label: "Delivered",
      description: "Your package has been delivered successfully",
    },
    delivery_failed: {
      label: "Delivery Failed",
      description: "Delivery attempt failed. We will retry or contact you",
    },
    cancelled: {
      label: "Cancelled",
      description: "Your order has been cancelled",
    },
  };

  if (status && !validStatuses.includes(status))
    throw new AppError("Invalid order status", 400, "VALIDATION_ERROR");
  if (payment_status && !validPaymentStatuses.includes(payment_status))
    throw new AppError("Invalid payment status", 400, "VALIDATION_ERROR");

  const existing = await query("SELECT * FROM orders WHERE id = ?", [id]);
  if (!existing.length) throw new AppError("Order not found", 404, "NOT_FOUND");

  // 🔒 LOCK: Delivered is the final status — no status changes allowed
  if (existing[0].status === "delivered" && status) {
    throw new AppError(
      "Delivered orders cannot be modified. This is a final status.",
      400,
      "DELIVERED_LOCK",
    );
  }

  const updates = [];
  const params = [];
  if (status) {
    updates.push("status = ?");
    params.push(status);
  }
  if (payment_status) {
    updates.push("payment_status = ?");
    params.push(payment_status);
  }
  if (admin_notes !== undefined) {
    updates.push("admin_notes = ?");
    params.push(admin_notes);
  }

  if (!updates.length)
    throw new AppError("No update fields provided", 400, "VALIDATION_ERROR");

  // Handle timestamp columns and shipping fields based on status
  const timestampUpdates = [];
  if (status === "shipped") {
    timestampUpdates.push("shipped_at = CURRENT_TIMESTAMP");
    if (shipping_provider) {
      updates.push("shipping_provider = ?");
      params.push(shipping_provider);
    }
    if (tracking_number) {
      updates.push("tracking_number = ?");
      params.push(tracking_number);
    }
    if (estimated_delivery) {
      updates.push("estimated_delivery = ?");
      params.push(estimated_delivery);
    }
  } else if (status === "out_for_delivery") {
    timestampUpdates.push("out_for_delivery_at = CURRENT_TIMESTAMP");
  } else if (status === "delivered") {
    timestampUpdates.push("delivered_at = CURRENT_TIMESTAMP");
  } else if (status === "delivery_failed") {
    timestampUpdates.push("failed_at = CURRENT_TIMESTAMP");
  } else if (status === "cancelled") {
    timestampUpdates.push("cancelled_at = CURRENT_TIMESTAMP");
  }

  if (timestampUpdates.length) {
    updates.push(...timestampUpdates);
  }

  params.push(id);
  await query(
    `UPDATE orders SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    params,
  );

  // Add tracking entry if status changed
  if (status && status !== existing[0].status && trackingLabels[status]) {
    await query(
      `INSERT INTO order_tracking (order_id, status, label, description)
       VALUES (?, ?, ?, ?)`,
      [
        id,
        status,
        trackingLabels[status].label,
        trackingLabels[status].description,
      ],
    );
    const [updatedForNotification] = await query("SELECT id, user_id, order_number, tracking_number FROM orders WHERE id = ?", [id]);
    await notifyOrderStatus(updatedForNotification, status);
  }

  // Restore coupon when an online order's payment is marked failed.
  if (
    payment_status === "failed" &&
    existing[0].payment_status !== "paid" &&
    existing[0].coupon_coupon_id
  ) {
    try {
      const { restoreCouponOnOrderFailure } = require("../services/couponService");
      await restoreCouponOnOrderFailure(id);
    } catch (error) {
      console.warn("[ORDER] Coupon restore on payment failure failed:", error.message);
    }
  }

  const [updated] = await query("SELECT * FROM orders WHERE id = ?", [id]);

  // 📧 Refund email — the existing refund process is the admin marking the
  // order payment as refunded. Send exactly once per refund transition.
  if (payment_status === "refunded" && existing[0].payment_status !== "refunded") {
    try {
      const { sendEmailTemplate } = require("../services/mailService");
      let customerName = updated.guest_name || updated.user_email || "Customer";
      if (updated.user_id) {
        const [profile] = await query(
          "SELECT CONCAT_WS(' ', first_name, last_name) AS name FROM user_profiles WHERE user_id = ?",
          [updated.user_id],
        );
        if (profile?.name?.trim()) customerName = profile.name.trim();
      }
      await sendEmailTemplate({
        templateKey: "refund",
        emailKey: `REFUND:${id}`,
        to: updated.user_email,
        variables: {
          user_name: customerName,
          user_email: updated.user_email,
          order_id: updated.order_number || String(id),
          refund_amount: Number(updated.total_amount || 0).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          }),
          date: formatEmailDate(new Date()),
        },
      });
    } catch (refundEmailError) {
      console.warn(`[EMAIL] Refund email failed for order #${updated.order_number || id}:`, refundEmailError.message);
    }
  }

  return success(res, "Order updated", { order: updated });
});

// ---------------------------------------------------------------------------
// RETURNS & REFUNDS
// ---------------------------------------------------------------------------

/** Allowed return request statuses (keep Return and Refund as separate concepts). */
const RETURN_STATUS_FLOW = ["pending", "approved", "rejected", "refund_processing", "refunded", "cancelled", "product_received"];
const REFUND_STATUS_FLOW = ["pending", "processing", "completed", "failed"];

/** Map legacy statuses onto the current lifecycle so old rows stay compatible. */
const normalizeReturnStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();
  if (value === "requested") return "pending";
  if (value === "in_transit" || value === "received") return "product_received";
  if (value === "completed") return "refunded";
  return value;
};

const RETURN_STATUS_META = {
  pending: { label: "Pending Review" },
  approved: { label: "Approved" },
  rejected: { label: "Rejected" },
  product_received: { label: "Product Received" },
  refund_processing: { label: "Refund Processing" },
  refunded: { label: "Refunded" },
  cancelled: { label: "Cancelled" },
};

const REFUND_STATUS_META = {
  pending: { label: "Refund Pending" },
  processing: { label: "Refund Processing" },
  completed: { label: "Refund Completed" },
  failed: { label: "Refund Failed" },
};

const formatINRAmount = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const parseReturnTimeline = (row) => {
  if (!row) return [];
  if (Array.isArray(row.timeline)) return row.timeline;
  if (typeof row.timeline === "string" && row.timeline.trim()) {
    try {
      const parsed = JSON.parse(row.timeline);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const appendReturnTimeline = async (row, event) => {
  const timeline = parseReturnTimeline(row);
  timeline.push({
    at: event.at || new Date().toISOString(),
    type: event.type,
    label: event.label,
    actor: event.actor || null,
    note: event.note || null,
  });
  await query("UPDATE order_returns SET timeline = ? WHERE id = ?", [JSON.stringify(timeline), row.id]);
  return timeline;
};

const getReturnRow = async (id) => {
  const [row] = await query("SELECT * FROM order_returns WHERE id = ?", [id]);
  return row || null;
};

const getReturnCustomerIdentity = async (order) => {
  if (!order) return { customer_name: "Guest", customer_email: "", customer_phone: "" };
  const userId = order.user_id;
  let name = "";
  let phone = "";
  let email = "";
  if (userId) {
    const [profile] = await query(
      `SELECT CONCAT_WS(' ', up.first_name, up.last_name) AS full_name, up.phone, u.email
       FROM user_profiles up
       LEFT JOIN users u ON u.id = up.user_id
       WHERE up.user_id = ?`,
      [userId],
    );
    if (profile?.full_name?.trim()) name = profile.full_name.trim();
    phone = profile?.phone || "";
    email = profile?.email || "";
  }
  return {
    customer_name: name || order.guest_name || "Guest",
    customer_email: email || order.user_email || order.guest_email || "",
    customer_phone: phone || order.guest_phone || "",
  };
};

/** Route a return/refund status notification to the user's notification bell. */
const notifyReturnUser = async ({ userId, orderId, type, title, message, eventKey, data = {} }) => {
  if (!userId) return;
  try {
    await createNotification({
      userId,
      type,
      title,
      message,
      data: { orderId, ...data },
      actionUrl: `/orders/${orderId}`,
      eventKey,
      entityType: "orders",
      entityId: orderId || null,
    });
  } catch (error) {
    console.warn("[NOTIFICATION] Return notification failed:", error.message);
  }
};

/** Send a return/refund status update email through the existing template system. */
const sendReturnStatusEmail = async ({ templateKey, returnReq, order, variables = {} }) => {
  const to = order?.user_email || order?.guest_email;
  if (!to) return;
  try {
    const { sendEmailTemplate } = require("../services/mailService");
    await sendEmailTemplate({
      templateKey,
      emailKey: `RETURN:${returnReq.id}:${templateKey}`,
      to,
      variables,
    });
  } catch (error) {
    console.warn(`[EMAIL] Return status email failed for return #${returnReq.id}:`, error.message);
  }
};

/** Shared email/notification payload for a return request. */
const buildReturnEmailContext = async ({ returnReq, order }) => {
  const identity = await getReturnCustomerIdentity(order);
  return {
    user_name: identity.customer_name,
    user_email: identity.customer_email,
    order_id: order?.order_number || String(order?.id || ""),
    reason: returnReq.reason || "",
    refund_amount: formatINRAmount(returnReq.approved_amount ?? returnReq.requested_amount ?? order?.total_amount ?? 0),
    date: formatEmailDate(new Date()),
  };
};

/**
 * Attempt a REAL refund through Razorpay when the order was paid online.
 * Never fabricates success: returns { attempted, succeeded, ... }.
 */
const tryRazorpayRefund = async (order, amount) => {
  const paymentId = order?.razorpay_payment_id || null;
  const method = String(order?.payment_method || "").toLowerCase();
  const nonOnline = ["cod", "cash_on_delivery", ""].includes(method);
  if (!paymentId || nonOnline) {
    return {
      attempted: false,
      succeeded: false,
      reason: "not_online_payment",
      message: "This order was not paid online, so no automatic gateway refund is possible. The refund must be completed manually (bank transfer / cash).",
    };
  }
  try {
    const settingsService = require("../config/settingsService");
    const [keyId, keySecret] = await Promise.all([
      settingsService.get("payment.razorpayKeyId"),
      settingsService.get("payment.razorpayKeySecret"),
    ]);
    if (!keyId || !keySecret) {
      return {
        attempted: false,
        succeeded: false,
        reason: "razorpay_not_configured",
        message: "Razorpay is not configured, so an automatic refund cannot be initiated. Complete the refund manually after transferring the money.",
      };
    }
    const Razorpay = require("razorpay");
    const razorpay = new Razorpay({ key_id: String(keyId), key_secret: String(keySecret) });
    const amountPaise = Math.round(Number(amount || order?.total_amount || 0) * 100);
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountPaise > 0 ? amountPaise : undefined,
      notes: {
        order_id: String(order.id || ""),
        order_number: order.order_number || "",
        reason: "Return / refund",
      },
    });
    const succeeded = Boolean(refund?.id) && refund?.status !== "failed";
    return {
      attempted: true,
      succeeded,
      refundId: refund?.id || null,
      gatewayStatus: refund?.status || null,
      message: refund?.id
        ? `Razorpay refund ${refund.status} (${refund.id})`
        : "Razorpay accepted the refund request.",
    };
  } catch (error) {
    return {
      attempted: true,
      succeeded: false,
      reason: "razorpay_error",
      message: `Automatic Razorpay refund failed: ${error.message}`,
    };
  }
};

/** Mark the order's own payment/refund fields as refunded (single source of truth). */
const markOrderRefunded = async (orderId, refundReference = null, refundedBy = "admin") => {
  await query(
    `UPDATE orders SET
       payment_status = 'refunded',
       refund_status = 'refunded',
       refunded_at = COALESCE(refunded_at, CURRENT_TIMESTAMP),
       refunded_by = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [refundedBy, orderId],
  );
  if (refundReference) {
    await query("UPDATE orders SET refund_reference = ? WHERE id = ?", [refundReference, orderId]);
  }
};

/**
 * POST /api/user/orders/:id/return-request
 * Customer submits a return request for their own order. One request per
 * order (unique constraint on order_id) → exactly one return email.
 */
const createReturnRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const reason = String(req.body?.reason || "").trim();
  const details = String(req.body?.details || "").trim();

  if (!userId) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

  const [order] = await query("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const hasAccess =
    order.user_id === userId ||
    (order.guest_email && String(order.guest_email).toLowerCase() === String(req.user?.email || "").toLowerCase());
  if (!hasAccess) {
    throw new AppError("You can only request a return for your own orders", 403, "FORBIDDEN");
  }

  const [existingReturn] = await query("SELECT id FROM order_returns WHERE order_id = ?", [id]);
  if (existingReturn) {
    throw new AppError("A return request for this order already exists", 409, "RETURN_ALREADY_EXISTS");
  }

  if (!reason) throw new AppError("Return reason is required", 400, "VALIDATION_ERROR");

  const requestedAmount = Math.round(parseFloat(order.total_amount || 0) * 100) / 100;
  const initialTimeline = [
    { at: new Date().toISOString(), type: "created", label: "Return request submitted", actor: null, note: reason.slice(0, 200) },
  ];

  const result = await query(
    `INSERT INTO order_returns (order_id, user_id, order_number, reason, details, requested_amount, status, request_type, timeline)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 'return', ?)`,
    [id, userId, order.order_number || String(id), reason.slice(0, 255), details.slice(0, 2000), requestedAmount, JSON.stringify(initialTimeline)],
  );
  const returnId = result.insertId;

  // 📧 Return confirmation email — admin-editable template, once per request.
  try {
    const context = await buildReturnEmailContext({ returnReq: { id: returnId, reason }, order });
    await sendReturnStatusEmail({ templateKey: "return_request", returnReq: { id: returnId }, order, variables: context });
  } catch (returnEmailError) {
    console.warn(`[EMAIL] Return email failed for order #${order.order_number || id}:`, returnEmailError.message);
  }

  // 🔔 In-app notification for the customer.
  await notifyReturnUser({
    userId,
    orderId: id,
    type: NOTIFICATION_TYPES.RETURN_REQUESTED,
    title: "Return request received",
    message: `We received your return request for order #${order.order_number || id}. Our team will review it shortly.`,
    eventKey: `RETURN_REQUESTED:${returnId}`,
    data: { returnId },
  });

  // Admin activity: return requested.
  await pushReturnActivity({
    userId,
    type: ACTIVITY_TYPES.RETURN_REQUESTED,
    returnId,
    orderId: id,
    orderNumber: order.order_number,
    message: `Return requested for order #${order.order_number || id}`,
    metadata: { reason },
  });

  const [created] = await query("SELECT * FROM order_returns WHERE id = ?", [returnId]);
  created.timeline = parseReturnTimeline(created);
  return success(res, "Return request submitted. Our team will contact you shortly.", { returnRequest: created }, 201);
});

/** Admin activity helper for return/refund lifecycle events. */
const pushReturnActivity = async ({ userId = null, type, returnId, orderId, orderNumber, message = "", metadata = {} }) => {
  try {
    await createActivity({
      userId,
      activityType: type,
      entityType: "orders",
      entityId: orderId || null,
      metadata: { returnId, orderNumber, message, ...metadata },
      eventKey: `${type}:${returnId}`,
    });
  } catch (activityError) {
    console.warn("[ACTIVITY] Return activity failed:", activityError.message);
  }
};

/** Shared query used by the admin list & detail endpoints. */
const RETURN_DETAIL_FIELDS = `
    r.id, r.order_id, r.user_id, r.order_number, r.reason, r.details,
    r.status, r.request_type, r.admin_notes, r.rejection_reason,
    r.requested_amount, r.approved_amount, r.refund_status, r.refund_reference,
    r.requested_at, r.resolved_at, r.created_at, r.updated_at,
    r.refund_initiated_at, r.refund_completed_at, r.processed_by, r.timeline,
    COALESCE(CONCAT_WS(' ', up.first_name, up.last_name), o.guest_name, u.username, 'Guest') AS customer_name,
    COALESCE(u.email, o.guest_email, o.user_email) AS customer_email,
    COALESCE(up.phone, o.guest_phone) AS customer_phone,
    o.created_at AS order_date,
    o.total_amount AS order_total,
    o.payment_method, o.payment_status, o.status AS order_status, o.order_number AS order_no,
    o.refund_status AS order_refund_status,
    (SELECT COUNT(*) FROM order_items WHERE order_id = r.order_id) AS item_count,
    (SELECT GROUP_CONCAT(
        DISTINCT CONCAT(oi.product_name, '|', oi.quantity, '|', oi.final_price, '|', oi.price)
        ORDER BY oi.id ASC SEPARATOR ';;'
     ) FROM order_items oi WHERE oi.order_id = r.order_id) AS products_brief`;

const RETURN_JOINS = `
  FROM order_returns r
  LEFT JOIN orders o ON o.id = r.order_id
  LEFT JOIN users u ON u.id = r.user_id
  LEFT JOIN user_profiles up ON up.user_id = r.user_id`;

/** GET /api/admin/order-returns - List return requests (admin) with summary. */
const listReturnRequests = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const status = String(req.query.status || "").trim();
  const search = String(req.query.search || "").trim();
  const tab = String(req.query.tab || "").trim();
  const requestType = String(req.query.request_type || "").trim();
  const dateFrom = String(req.query.date_from || "").trim();
  const dateTo = String(req.query.date_to || "").trim();

  const filters = ["1=1"];
  const params = [];

  if (status) {
    filters.push("r.status = ?");
    params.push(normalizeReturnStatus(status));
  }
  if (requestType) {
    filters.push("r.request_type = ?");
    params.push(requestType);
  }
  if (tab) {
    if (tab === "online") {
      filters.push("o.payment_method NOT IN ('cod', 'cash_on_delivery')");
    } else if (tab === "cod") {
      filters.push("o.payment_method IN ('cod', 'cash_on_delivery')");
    } else if (tab === "returns") {
      filters.push("r.request_type = 'return'");
    } else if (tab === "refunds") {
      filters.push("r.refund_status IS NOT NULL");
    } else if (tab === "pending_action") {
      filters.push("r.status IN ('pending', 'approved', 'refund_processing', 'product_received')");
    } else if (tab === "completed") {
      filters.push("r.status IN ('refunded', 'rejected', 'cancelled')");
    }
  }
  if (search) {
    filters.push(
      "(r.order_number LIKE ? OR o.order_number LIKE ? OR o.guest_name LIKE ? OR o.guest_email LIKE ? OR o.user_email LIKE ? OR up.first_name LIKE ? OR up.last_name LIKE ? OR CONCAT_WS(' ', up.first_name, up.last_name) LIKE ? OR u.email LIKE ?)"
    );
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like, like, like, like);
  }
  if (dateFrom) {
    filters.push("DATE(r.created_at) >= ?");
    params.push(dateFrom);
  }
  if (dateTo) {
    filters.push("DATE(r.created_at) <= ?");
    params.push(dateTo);
  }

  const where = filters.join(" AND ");

  const [[countRow], [summaryRow]] = await Promise.all([
    query(`SELECT COUNT(DISTINCT r.id) AS count ${RETURN_JOINS} WHERE ${where}`, params),
    query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'pending') AS pending_review,
         SUM(status = 'approved') AS approved,
         SUM(status = 'rejected') AS rejected,
         SUM(status = 'refund_processing') AS refund_processing,
         SUM(status = 'refunded') AS refunded
       FROM order_returns`,
    ),
  ]);

  const rows = await query(
    `SELECT ${RETURN_DETAIL_FIELDS} ${RETURN_JOINS} WHERE ${where}
     GROUP BY r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const returnRequests = rows.map((row) => {
    const products = (row.products_brief || "")
      .split(";;")
      .filter(Boolean)
      .map((part) => {
        const [name, quantity, final_price, price] = part.split("|");
        return { name, quantity: Number(quantity || 1), final_price: Number(final_price || 0), price: Number(price || final_price || 0) };
      });
    const first = products[0] || null;
    return {
      id: row.id,
      order_id: row.order_id,
      user_id: row.user_id,
      order_number: row.order_no || row.order_number,
      reason: row.reason,
      details: row.details,
      status: normalizeReturnStatus(row.status),
      status_label: RETURN_STATUS_META[normalizeReturnStatus(row.status)]?.label || row.status,
      request_type: row.request_type || "return",
      admin_notes: row.admin_notes,
      rejection_reason: row.rejection_reason,
      requested_amount: Number(row.requested_amount ?? row.order_total ?? 0),
      approved_amount: row.approved_amount != null ? Number(row.approved_amount) : null,
      refund_status: row.refund_status,
      refund_status_label: REFUND_STATUS_META[row.refund_status]?.label || null,
      refund_reference: row.refund_reference,
      requested_at: row.requested_at,
      resolved_at: row.resolved_at,
      created_at: row.created_at,
      refund_initiated_at: row.refund_initiated_at,
      refund_completed_at: row.refund_completed_at,
      processed_by: row.processed_by,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      order_date: row.order_date,
      order_total: Number(row.order_total || 0),
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      order_status: row.order_status,
      product_name: first?.name || null,
      product_quantity: first?.quantity || 0,
      product_price: first?.final_price != null ? Number(first.final_price) : null,
      product_count: Number(row.item_count || 0),
      products: products.length ? products : [],
      timeline: parseReturnTimeline(row),
    };
  });

  return success(res, "Return requests", {
    returnRequests,
    pagination: {
      total: Number(countRow.count),
      page,
      limit,
      pages: Math.ceil(Number(countRow.count) / limit),
    },
    summary: {
      total: Number(summaryRow.total || 0),
      pending_review: Number(summaryRow.pending_review || 0),
      approved: Number(summaryRow.approved || 0),
      rejected: Number(summaryRow.rejected || 0),
      refund_processing: Number(summaryRow.refund_processing || 0),
      refunded: Number(summaryRow.refunded || 0),
    },
  });
});

/** GET /api/admin/order-returns/:id - Full detail for a return request (admin). */
const getReturnRequestDetails = asyncHandler(async (req, res) => {
  const [row] = await query(
    `SELECT ${RETURN_DETAIL_FIELDS} ${RETURN_JOINS} WHERE r.id = ? GROUP BY r.id`,
    [req.params.id],
  );
  if (!row) throw new AppError("Return request not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.id, oi.product_id, oi.product_name, oi.price, oi.original_price,
            oi.quantity, oi.final_price, oi.discount_amount, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [row.order_id],
  );

  const products = items.map((item) => ({
    ...item,
    product_image: normalizeImageUrl(item.product_image),
  }));

  const detail = {
    id: row.id,
    order_id: row.order_id,
    user_id: row.user_id,
    order_number: row.order_no || row.order_number,
    reason: row.reason,
    details: row.details,
    status: normalizeReturnStatus(row.status),
    status_label: RETURN_STATUS_META[normalizeReturnStatus(row.status)]?.label || row.status,
    request_type: row.request_type || "return",
    admin_notes: row.admin_notes,
    rejection_reason: row.rejection_reason,
    requested_amount: Number(row.requested_amount ?? row.order_total ?? 0),
    approved_amount: row.approved_amount != null ? Number(row.approved_amount) : null,
    refund_status: row.refund_status,
    refund_status_label: REFUND_STATUS_META[row.refund_status]?.label || null,
    refund_reference: row.refund_reference,
    requested_at: row.requested_at,
    resolved_at: row.resolved_at,
    created_at: row.created_at,
    refund_initiated_at: row.refund_initiated_at,
    refund_completed_at: row.refund_completed_at,
    processed_by: row.processed_by,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    order: {
      id: row.order_id,
      order_number: row.order_no || row.order_number,
      order_date: row.order_date,
      total: Number(row.order_total || 0),
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      refund_status: row.order_refund_status,
      order_status: row.order_status,
      items: products,
    },
    timeline: parseReturnTimeline(row),
  };

  return success(res, "Return request details", { returnRequest: detail });
});

/** GET /api/user/orders/:id/return-request - User sees their own return request. */
const getUserReturnRequest = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

  const [order] = await query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const hasAccess =
    order.user_id === userId ||
    (order.guest_email && String(order.guest_email).toLowerCase() === String(req.user?.email || "").toLowerCase());
  if (!hasAccess) throw new AppError("You can only view returns for your own orders", 403, "FORBIDDEN");

  const [returnReq] = await query("SELECT * FROM order_returns WHERE order_id = ?", [req.params.id]);

  return success(res, "Return request", {
    returnRequest: returnReq
      ? {
          ...returnReq,
          status: normalizeReturnStatus(returnReq.status),
          status_label: RETURN_STATUS_META[normalizeReturnStatus(returnReq.status)]?.label || returnReq.status,
          refund_status_label: REFUND_STATUS_META[returnReq.refund_status]?.label || null,
          requested_amount: Number(returnReq.requested_amount ?? order.total_amount ?? 0),
          approved_amount: returnReq.approved_amount != null ? Number(returnReq.approved_amount) : null,
          timeline: parseReturnTimeline(returnReq),
        }
      : null,
  });
});

/** Validate that a transition is legal within the return process. */
const assertReturnTransition = (current, action) => {
  const map = {
    approve: ["pending"],
    reject: ["pending", "approved", "product_received", "refund_processing"],
    start_refund: ["approved", "product_received"],
    complete_refund: ["refund_processing"],
  };
  const allowed = map[action] || [];
  if (!allowed.includes(current)) {
    throw new AppError(`This action is not allowed while the request is in "${RETURN_STATUS_META[current]?.label || current}" status`, 400, "INVALID_RETURN_TRANSITION");
  }
};

/** POST /api/admin/order-returns/:id/approve */
const approveReturnRequest = asyncHandler(async (req, res) => {
  const returnReq = await getReturnRow(req.params.id);
  if (!returnReq) throw new AppError("Return request not found", 404, "NOT_FOUND");
  const current = normalizeReturnStatus(returnReq.status);
  assertReturnTransition(current, "approve");

  const adminActor = req.admin?.email || "admin";
  const [order] = await query("SELECT * FROM orders WHERE id = ?", [returnReq.order_id]);
  const identity = await getReturnCustomerIdentity(order);

  const approvedAmount = returnReq.approved_amount != null
    ? returnReq.approved_amount
    : Math.round(parseFloat(returnReq.requested_amount ?? order?.total_amount ?? 0) * 100) / 100;

  await query(
    `UPDATE order_returns SET
       status = 'approved', approved_amount = ?, refund_status = 'pending',
       processed_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [approvedAmount, adminActor, returnReq.id],
  );

  const [updated] = await query("SELECT * FROM order_returns WHERE id = ?", [returnReq.id]);
  await appendReturnTimeline(updated, {
    type: "approved",
    label: "Return approved",
    actor: adminActor,
    note: `Refund of ${formatINRAmount(approvedAmount)} authorised.`,
  });

  const context = await buildReturnEmailContext({ returnReq: updated, order });
  await sendReturnStatusEmail({ templateKey: "return_approved", returnReq: updated, order, variables: context });
  await notifyReturnUser({
    userId: returnReq.user_id,
    orderId: returnReq.order_id,
    type: NOTIFICATION_TYPES.RETURN_APPROVED,
    title: "Return approved",
    message: `Your return request for order #${returnReq.order_number} was approved. We'll start your refund of ${formatINRAmount(approvedAmount)} soon.`,
    eventKey: `RETURN_APPROVED:${returnReq.id}`,
    data: { returnId: returnReq.id, approvedAmount },
  });
  await pushReturnActivity({
    type: ACTIVITY_TYPES.RETURN_APPROVED,
    returnId: returnReq.id,
    orderId: returnReq.order_id,
    orderNumber: returnReq.order_number,
    message: `Return approved (${formatINRAmount(approvedAmount)}) by ${identity.customer_name || "customer"}`,
  });

  updated.timeline = parseReturnTimeline(updated);
  return success(res, "Return request approved", { returnRequest: updated });
});

/** POST /api/admin/order-returns/:id/reject — requires a rejection reason. */
const rejectReturnRequest = asyncHandler(async (req, res) => {
  const returnReq = await getReturnRow(req.params.id);
  if (!returnReq) throw new AppError("Return request not found", 404, "NOT_FOUND");
  const current = normalizeReturnStatus(returnReq.status);
  assertReturnTransition(current, "reject");

  const rejectionReason = String(req.body?.rejection_reason || req.body?.reason || "").trim();
  if (rejectionReason.length < 3) {
    throw new AppError("A rejection reason is required", 400, "REJECTION_REASON_REQUIRED");
  }

  const adminActor = req.admin?.email || "admin";
  const [order] = await query("SELECT * FROM orders WHERE id = ?", [returnReq.order_id]);

  await query(
    `UPDATE order_returns SET
       status = 'rejected', rejection_reason = ?, resolved_at = CURRENT_TIMESTAMP,
       processed_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [rejectionReason.slice(0, 2000), adminActor, returnReq.id],
  );

  const [updated] = await query("SELECT * FROM order_returns WHERE id = ?", [returnReq.id]);
  await appendReturnTimeline(updated, {
    type: "rejected",
    label: "Return rejected",
    actor: adminActor,
    note: rejectionReason,
  });

  const context = await buildReturnEmailContext({ returnReq: updated, order });
  context.reason = rejectionReason;
  await sendReturnStatusEmail({ templateKey: "return_rejected", returnReq: updated, order, variables: context });
  await notifyReturnUser({
    userId: returnReq.user_id,
    orderId: returnReq.order_id,
    type: NOTIFICATION_TYPES.RETURN_REJECTED,
    title: "Return request rejected",
    message: `Your return request for order #${returnReq.order_number} was rejected. Reason: ${rejectionReason}`,
    eventKey: `RETURN_REJECTED:${returnReq.id}`,
    data: { returnId: returnReq.id, rejectionReason },
  });
  await pushReturnActivity({
    type: ACTIVITY_TYPES.RETURN_REJECTED,
    returnId: returnReq.id,
    orderId: returnReq.order_id,
    orderNumber: returnReq.order_number,
    message: `Return rejected: ${rejectionReason}`,
  });

  updated.timeline = parseReturnTimeline(updated);
  return success(res, "Return request rejected", { returnRequest: updated });
});

/** POST /api/admin/order-returns/:id/start-refund */
const startReturnRefund = asyncHandler(async (req, res) => {
  const returnReq = await getReturnRow(req.params.id);
  if (!returnReq) throw new AppError("Return request not found", 404, "NOT_FOUND");
  const current = normalizeReturnStatus(returnReq.status);
  assertReturnTransition(current, "start_refund");

  const adminActor = req.admin?.email || "admin";
  const [order] = await query("SELECT * FROM orders WHERE id = ?", [returnReq.order_id]);
  const refundAmount = returnReq.approved_amount != null
    ? returnReq.approved_amount
    : Math.round(parseFloat(returnReq.requested_amount ?? order?.total_amount ?? 0) * 100) / 100;

  await query(
    `UPDATE order_returns SET
       status = 'refund_processing', refund_status = 'processing',
       approved_amount = ?, refund_initiated_at = CURRENT_TIMESTAMP,
       processed_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [refundAmount, adminActor, returnReq.id],
  );

  const [updated] = await query("SELECT * FROM order_returns WHERE id = ?", [returnReq.id]);
  await appendReturnTimeline(updated, {
    type: "refund_started",
    label: "Refund started",
    actor: adminActor,
    note: `Refund of ${formatINRAmount(refundAmount)} initiated.`,
  });

  // 🔄 Real refund attempt through the payment gateway when applicable.
  const refundResult = await tryRazorpayRefund(order, refundAmount);
  const autoCompleted = Boolean(refundResult.attempted && refundResult.succeeded);

  await appendReturnTimeline(updated, {
    type: autoCompleted ? "refund_completed" : "refund_status",
    label: autoCompleted ? "Refund completed via payment gateway" : "Refund is processing",
    actor: adminActor,
    note: refundResult.message,
  });

  const context = await buildReturnEmailContext({ returnReq: updated, order });
  context.refund_amount = formatINRAmount(refundAmount);

  let final;
  if (autoCompleted) {
    await query(
      `UPDATE order_returns SET
         status = 'refunded', refund_status = 'completed',
         refund_reference = ?, refund_completed_at = CURRENT_TIMESTAMP,
         resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [refundResult.refundId, returnReq.id],
    );
    await markOrderRefunded(returnReq.order_id, refundResult.refundId, adminActor);
    final = await getReturnRow(returnReq.id);
    await sendReturnStatusEmail({ templateKey: "refund", returnReq: final, order, variables: context });
    await notifyReturnUser({
      userId: returnReq.user_id,
      orderId: returnReq.order_id,
      type: NOTIFICATION_TYPES.REFUND_COMPLETED,
      title: "Refund completed",
      message: `The refund of ${formatINRAmount(refundAmount)} for order #${returnReq.order_number} was completed via ${String(order?.payment_method || "the payment gateway").toUpperCase()}.`,
      eventKey: `REFUND_COMPLETED:${returnReq.id}`,
      data: { returnId: returnReq.id, refundAmount, reference: refundResult.refundId },
    });
    await pushReturnActivity({
      type: ACTIVITY_TYPES.REFUND_COMPLETED,
      returnId: returnReq.id,
      orderId: returnReq.order_id,
      orderNumber: returnReq.order_number,
      message: `Refund of ${formatINRAmount(refundAmount)} completed (${refundResult.message})`,
    });
  } else {
    final = await getReturnRow(returnReq.id);
    await sendReturnStatusEmail({ templateKey: "refund_started", returnReq: final, order, variables: context });
    await notifyReturnUser({
      userId: returnReq.user_id,
      orderId: returnReq.order_id,
      type: NOTIFICATION_TYPES.REFUND_PROCESSING,
      title: "Refund processing",
      message: `Your refund of ${formatINRAmount(refundAmount)} for order #${returnReq.order_number} is being processed.${refundResult.message ? ` Note: ${refundResult.message}` : ""}`,
      eventKey: `REFUND_PROCESSING:${returnReq.id}`,
      data: { returnId: returnReq.id, refundAmount },
    });
    await pushReturnActivity({
      type: ACTIVITY_TYPES.REFUND_STARTED,
      returnId: returnReq.id,
      orderId: returnReq.order_id,
      orderNumber: returnReq.order_number,
      message: `Refund of ${formatINRAmount(refundAmount)} started — ${refundResult.message}`,
    });
  }

  final.timeline = parseReturnTimeline(final);
  return success(res, autoCompleted ? "Refund completed" : "Refund started", {
    returnRequest: final,
    refund: { attempted: refundResult.attempted, auto_completed: autoCompleted, message: refundResult.message, reason: refundResult.reason || null, reference: refundResult.refundId || null },
  });
});

/** POST /api/admin/order-returns/:id/complete-refund — admin confirms the money is actually back with the customer. */
const completeReturnRefund = asyncHandler(async (req, res) => {
  const returnReq = await getReturnRow(req.params.id);
  if (!returnReq) throw new AppError("Return request not found", 404, "NOT_FOUND");
  const current = normalizeReturnStatus(returnReq.status);
  assertReturnTransition(current, "complete_refund");

  const adminActor = req.admin?.email || "admin";
  const reference = String(req.body?.refund_reference || returnReq.refund_reference || "").trim() || null;
  const [order] = await query("SELECT * FROM orders WHERE id = ?", [returnReq.order_id]);
  const refundAmount = returnReq.approved_amount != null
    ? returnReq.approved_amount
    : Math.round(parseFloat(returnReq.requested_amount ?? order?.total_amount ?? 0) * 100) / 100;

  await query(
    `UPDATE order_returns SET
       status = 'refunded', refund_status = 'completed',
       refund_reference = ?, refund_completed_at = CURRENT_TIMESTAMP,
       resolved_at = CURRENT_TIMESTAMP, processed_by = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [reference, adminActor, returnReq.id],
  );
  await markOrderRefunded(returnReq.order_id, reference, adminActor);

  const [updated] = await query("SELECT * FROM order_returns WHERE id = ?", [returnReq.id]);
  await appendReturnTimeline(updated, {
    type: "refund_completed",
    label: "Refund marked as completed",
    actor: adminActor,
    note: `Refund of ${formatINRAmount(refundAmount)} confirmed completed${reference ? ` (${reference})` : ""}.`,
  });

  const context = await buildReturnEmailContext({ returnReq: updated, order });
  context.refund_amount = formatINRAmount(refundAmount);
  await sendReturnStatusEmail({ templateKey: "refund", returnReq: updated, order, variables: context });
  await notifyReturnUser({
    userId: returnReq.user_id,
    orderId: returnReq.order_id,
    type: NOTIFICATION_TYPES.REFUND_COMPLETED,
    title: "Refund completed",
    message: `The refund of ${formatINRAmount(refundAmount)} for order #${returnReq.order_number} has been completed.`,
    eventKey: `REFUND_COMPLETED:${returnReq.id}`,
    data: { returnId: returnReq.id, refundAmount, reference },
  });
  await pushReturnActivity({
    type: ACTIVITY_TYPES.REFUND_COMPLETED,
    returnId: returnReq.id,
    orderId: returnReq.order_id,
    orderNumber: returnReq.order_number,
    message: `Refund of ${formatINRAmount(refundAmount)} marked completed${reference ? ` (${reference})` : ""}`,
  });

  updated.timeline = parseReturnTimeline(updated);
  return success(res, "Refund marked as completed", { returnRequest: updated });
});

/** POST /api/user/orders/:id/cod-refund-details - User submits COD refund details (UPI/Bank) */
const submitCodRefundDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const refundMethod = String(req.body?.refund_method || "").trim().toLowerCase();
  const upiId = String(req.body?.upi_id || "").trim();
  const accountHolderName = String(req.body?.account_holder_name || "").trim();
  const accountNumber = String(req.body?.account_number || "").trim();
  const ifscCode = String(req.body?.ifsc_code || "").trim().toUpperCase();
  const bankName = String(req.body?.bank_name || "").trim();

  if (!userId) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

  const [order] = await query("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const hasAccess =
    order.user_id === userId ||
    (order.guest_email && String(order.guest_email).toLowerCase() === String(req.user?.email || "").toLowerCase());
  if (!hasAccess) throw new AppError("You can only submit refund details for your own orders", 403, "FORBIDDEN");

  const [returnReq] = await query("SELECT * FROM order_returns WHERE order_id = ?", [id]);
  if (!returnReq) throw new AppError("No return request found for this order", 404, "NOT_FOUND");

  const normalizedStatus = normalizeReturnStatus(returnReq.status);
  if (normalizedStatus !== "approved") {
    throw new AppError("Refund details can only be submitted after return is approved", 400, "INVALID_RETURN_STATUS");
  }

  const method = String(order.payment_method || "").toLowerCase();
  const isCod = ["cod", "cash_on_delivery"].includes(method);
  if (!isCod) {
    throw new AppError("COD refund details are only for Cash on Delivery orders", 400, "NOT_COD_ORDER");
  }

  if (returnReq.refund_method) {
    throw new AppError("Refund details already submitted", 409, "REFUND_DETAILS_EXIST");
  }

  if (!refundMethod || !["upi", "bank"].includes(refundMethod)) {
    throw new AppError("Refund method must be 'upi' or 'bank'", 400, "VALIDATION_ERROR");
  }

  if (refundMethod === "upi") {
    if (!upiId) throw new AppError("UPI ID is required", 400, "VALIDATION_ERROR");
    if (!upiId.includes("@")) throw new AppError("Invalid UPI ID format", 400, "VALIDATION_ERROR");
  } else {
    if (!accountHolderName) throw new AppError("Account holder name is required", 400, "VALIDATION_ERROR");
    if (!accountNumber) throw new AppError("Account number is required", 400, "VALIDATION_ERROR");
    if (!ifscCode) throw new AppError("IFSC code is required", 400, "VALIDATION_ERROR");
    if (!bankName) throw new AppError("Bank name is required", 400, "VALIDATION_ERROR");
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) throw new AppError("Invalid IFSC code format", 400, "VALIDATION_ERROR");
  }

  await query(
    `UPDATE order_returns SET
       refund_method = ?,
       upi_id = ?,
       account_holder_name = ?,
       account_number = ?,
       ifsc_code = ?,
       bank_name = ?,
       refund_status = 'details_submitted',
       refund_details_submitted_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      refundMethod,
      refundMethod === "upi" ? upiId : null,
      refundMethod === "bank" ? accountHolderName : null,
      refundMethod === "bank" ? accountNumber : null,
      refundMethod === "bank" ? ifscCode : null,
      refundMethod === "bank" ? bankName : null,
      returnReq.id,
    ],
  );

  const [updated] = await query("SELECT * FROM order_returns WHERE id = ?", [returnReq.id]);
  await appendReturnTimeline(updated, {
    type: "refund_details_submitted",
    label: "Refund details submitted",
    actor: req.user?.email || "customer",
    note: `Refund method: ${refundMethod.toUpperCase()}${refundMethod === "upi" ? `, UPI: ${upiId}` : `, Bank: ${bankName}, A/C: ${accountNumber.slice(-4)}`}`,
  });

  const adminActor = "customer";
  const [orderFull] = await query("SELECT * FROM orders WHERE id = ?", [id]);
  await sendReturnStatusEmail({ templateKey: "cod_refund_details_required", returnReq: updated, order: orderFull, variables: {} });
  await notifyReturnUser({
    userId: returnReq.user_id,
    orderId: id,
    type: NOTIFICATION_TYPES.REFUND_PROCESSING,
    title: "Refund details submitted",
    message: `Your refund details for order #${returnReq.order_number} have been submitted. Our team will process the refund shortly.`,
    eventKey: `REFUND_DETAILS_SUBMITTED:${returnReq.id}`,
    data: { returnId: returnReq.id, refundMethod },
  });
  await pushReturnActivity({
    type: ACTIVITY_TYPES.REFUND_STARTED,
    returnId: returnReq.id,
    orderId: id,
    orderNumber: returnReq.order_number,
    message: `COD refund details submitted (${refundMethod.toUpperCase()}) for order #${returnReq.order_number}`,
  });

  updated.timeline = parseReturnTimeline(updated);
  return success(res, "Refund details submitted successfully", { returnRequest: updated });
});

/** GET /api/admin/order-returns/:id/cod-refund-details - Admin views COD refund details */
const getCodRefundDetails = asyncHandler(async (req, res) => {
  const [row] = await query("SELECT * FROM order_returns WHERE id = ?", [req.params.id]);
  if (!row) throw new AppError("Return request not found", 404, "NOT_FOUND");

  const method = row.refund_method;
  const maskedAccount = row.account_number ? `****${String(row.account_number).slice(-4)}` : null;

  return success(res, "COD refund details", {
    returnRequest: {
      ...row,
      refund_method: method,
      upi_id: method === "upi" ? row.upi_id : null,
      account_holder_name: method === "bank" ? row.account_holder_name : null,
      account_number: method === "bank" ? maskedAccount : null,
      ifsc_code: method === "bank" ? row.ifsc_code : null,
      bank_name: method === "bank" ? row.bank_name : null,
      refund_details_submitted_at: row.refund_details_submitted_at,
    },
  });
});

/** POST /api/admin/order-returns/:id/process-cod-refund - Admin processes COD refund (marks completed) */
const processCodRefund = asyncHandler(async (req, res) => {
  const returnReq = await getReturnRow(req.params.id);
  if (!returnReq) throw new AppError("Return request not found", 404, "NOT_FOUND");

  const current = normalizeReturnStatus(returnReq.status);
  if (current !== "approved") {
    throw new AppError("COD refund can only be processed after return is approved", 400, "INVALID_RETURN_STATUS");
  }

  if (!returnReq.refund_method) {
    throw new AppError("Refund details not submitted yet. Cannot process refund.", 400, "REFUND_DETAILS_REQUIRED");
  }

  const adminActor = req.admin?.email || "admin";
  const [order] = await query("SELECT * FROM orders WHERE id = ?", [returnReq.order_id]);

  const refundAmount = returnReq.approved_amount != null
    ? returnReq.approved_amount
    : Math.round(parseFloat(returnReq.requested_amount ?? order?.total_amount ?? 0) * 100) / 100;

  await query(
    `UPDATE order_returns SET
       status = 'refunded',
       refund_status = 'completed',
       refund_completed_at = CURRENT_TIMESTAMP,
       resolved_at = CURRENT_TIMESTAMP,
       processed_by = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [adminActor, returnReq.id],
  );

  await markOrderRefunded(returnReq.order_id, null, adminActor);

  const [updated] = await query("SELECT * FROM order_returns WHERE id = ?", [returnReq.id]);
  await appendReturnTimeline(updated, {
    type: "refund_completed",
    label: "Refund completed",
    actor: adminActor,
    note: `COD refund of ${formatINRAmount(refundAmount)} completed via ${returnReq.refund_method.toUpperCase()}.`,
  });

  const context = await buildReturnEmailContext({ returnReq: updated, order });
  context.refund_amount = formatINRAmount(refundAmount);
  context.refund_method = returnReq.refund_method.toUpperCase();
  await sendReturnStatusEmail({ templateKey: "cod_refund_completed", returnReq: updated, order, variables: context });
  await notifyReturnUser({
    userId: returnReq.user_id,
    orderId: returnReq.order_id,
    type: NOTIFICATION_TYPES.REFUND_COMPLETED,
    title: "Refund completed",
    message: `Your COD refund of ${formatINRAmount(refundAmount)} for order #${returnReq.order_number} has been completed.`,
    eventKey: `REFUND_COMPLETED:${returnReq.id}`,
    data: { returnId: returnReq.id, refundAmount, refundMethod: returnReq.refund_method },
  });
  await pushReturnActivity({
    type: ACTIVITY_TYPES.REFUND_COMPLETED,
    returnId: returnReq.id,
    orderId: returnReq.order_id,
    orderNumber: returnReq.order_number,
    message: `COD refund of ${formatINRAmount(refundAmount)} completed (${returnReq.refund_method.toUpperCase()})`,
  });

  updated.timeline = parseReturnTimeline(updated);
  return success(res, "COD refund processed and marked completed", { returnRequest: updated });
});

/** PATCH /api/admin/order-returns/:id/status - Generic status update (legacy + guard rails). */
const updateReturnRequestStatus = asyncHandler(async (req, res) => {
  const returnReq = await getReturnRow(req.params.id);
  if (!returnReq) throw new AppError("Return request not found", 404, "NOT_FOUND");

  const requested = normalizeReturnStatus(req.body?.status || "");
  if (!returnReq || !RETURN_STATUS_FLOW.includes(requested)) {
    throw new AppError("Invalid return status", 400, "VALIDATION_ERROR");
  }

  if (requested === "rejected") {
    const rejectionReason = String(req.body?.rejection_reason || "").trim();
    if (rejectionReason.length < 3) {
      throw new AppError("A rejection reason is required", 400, "REJECTION_REASON_REQUIRED");
    }
    await query(
      `UPDATE order_returns SET status = 'rejected', rejection_reason = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [rejectionReason.slice(0, 2000), returnReq.id],
    );
  } else {
    const updates = ["status = ?", "updated_at = CURRENT_TIMESTAMP"];
    const params = [requested];
    if (req.body?.admin_notes !== undefined) {
      updates.push("admin_notes = ?");
      params.push(String(req.body.admin_notes || ""));
    }
    if (requested === "approved") {
      updates.push("approved_amount = ?");
      updates.push("refund_status = 'pending'");
      params.push(Number(returnReq.requested_amount ?? returnReq.requested_amount ?? 0));
    }
    if (requested === "refund_processing") {
      updates.push("refund_status = 'processing'");
      updates.push("refund_initiated_at = COALESCE(refund_initiated_at, CURRENT_TIMESTAMP)");
    }
    if (requested === "refunded") {
      updates.push("refund_status = 'completed'");
      updates.push("refund_completed_at = CURRENT_TIMESTAMP");
      updates.push("resolved_at = CURRENT_TIMESTAMP");
      try {
        await markOrderRefunded(returnReq.order_id, null, req.admin?.email || "admin");
      } catch (orderErr) {
        console.warn("[ORDER] Could not sync order refunded state:", orderErr.message);
      }
    }
    params.push(returnReq.id);
    await query(`UPDATE order_returns SET ${updates.join(", ")} WHERE id = ?`, params);
  }

  const [row] = await query("SELECT * FROM order_returns WHERE id = ?", [returnReq.id]);
  if (!row) throw new AppError("Return request not found", 404, "NOT_FOUND");
  row.timeline = parseReturnTimeline(row);
  row.status = normalizeReturnStatus(row.status);
  return success(res, "Return request updated", { returnRequest: row });
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
    [id],
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
    [id],
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

/** GET /api/user/orders/:id/invoice - Download own invoice */
const downloadUserInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const [order] = await query(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?",
    [id, user_id],
  );
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [id],
  );

  const invoiceResult = await generateInvoicePDF(order, items);
  const fileName = `${invoiceResult.invoiceNumber}.pdf`;

  res.download(invoiceResult.filePath, fileName, (err) => {
    if (err) {
      console.error("❌ [Invoice] User download error:", err);
      throw new AppError("Failed to download invoice", 500, "DOWNLOAD_ERROR");
    }
  });
});

/** GET /api/guest/orders/download-invoice?order_number=...&email=... - Download guest invoice securely */
const downloadGuestInvoice = asyncHandler(async (req, res) => {
  const orderNumber = String(
    req.query.order_number || req.params.orderNumber || "",
  ).trim();
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();

  if (!orderNumber || !email) {
    throw new AppError(
      "order number and email are required",
      400,
      "VALIDATION_ERROR",
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new AppError("Please provide a valid email", 400, "VALIDATION_ERROR");
  }

  const [order] = await query(
    `SELECT * FROM orders
     WHERE order_number = ?
       AND (LOWER(guest_email) = ? OR LOWER(user_email) = ?)
     LIMIT 1`,
    [orderNumber, email, email],
  );

  if (!order) {
    throw new AppError("Order not found", 404, "NOT_FOUND");
  }

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [order.id],
  );

  const invoiceResult = await generateInvoicePDF(order, items);
  const fileName = `${invoiceResult.invoiceNumber}.pdf`;

  res.download(invoiceResult.filePath, fileName, (err) => {
    if (err) {
      console.error("❌ [Invoice] Guest download error:", err);
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
      SUM(CASE WHEN status = 'packed' THEN 1 ELSE 0 END) AS packed_count,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped_count,
      SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) AS in_transit_count,
      SUM(CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END) AS out_for_delivery_count,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
      SUM(CASE WHEN status = 'delivery_failed' THEN 1 ELSE 0 END) AS delivery_failed_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
      COALESCE(SUM(total_amount), 0) AS total_revenue,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_revenue,
      COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) AS delivered_revenue
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

  console.log('[STATS] Query result:', stats[0]);
  console.log('[STATS] Delivered revenue raw:', stats[0]?.delivered_revenue, typeof stats[0]?.delivered_revenue);
  console.log('[STATS] Total orders:', stats[0]?.total_orders);
  console.log('[STATS] Delivered count:', stats[0]?.delivered_count);

  const responseData = {
    stats: {
      ...stats[0],
      delivered_revenue: parseFloat(stats[0]?.delivered_revenue || 0),
      total_revenue: parseFloat(stats[0]?.total_revenue || 0),
    },
    recentOrders,
  };
  
  // Log the exact response being sent
  console.log('[STATS] Response data:', JSON.stringify(responseData));

  return success(res, "Order stats fetched", responseData);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;

  const [order] = await query(
    "SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1",
    [orderId, req.user.id],
  );

  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  const allowedStatuses = ["pending", "confirmed", "processing"];
  if (!allowedStatuses.includes(order.status)) {
    throw new AppError(
      "Order can no longer be cancelled because shipment processing has started.",
      400,
      "ORDER_NOT_CANCELLABLE",
    );
  }

  await query(
    "UPDATE orders SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancelled_by = 'customer', cancel_reason = 'Cancelled by customer', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [orderId],
  );

  await notifyOrderStatus(order, "cancelled");

  await query(
    "INSERT INTO order_tracking (order_id, status, label, description) VALUES (?, 'cancelled', 'Order Cancelled', 'Customer cancelled this order')",
    [orderId],
  );

  const items = await query(
    `SELECT oi.*, p.image_url AS product_image
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId],
  );

  // Restore stock for each item
  for (const item of items) {
    const [product] = await query(
      "SELECT * FROM products WHERE id = ?",
      [item.product_id],
    );
    if (product) {
      const newStock = product.stock_quantity + item.quantity;
      await query(
        "UPDATE products SET stock_quantity = ?, stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newStock, newStock, item.product_id],
      );
    }
  }

  // Restore coupon if the cancelled order consumed one (unpaid failure).
  try {
    const { restoreCouponOnOrderFailure } = require("../services/couponService");
    await restoreCouponOnOrderFailure(orderId);
  } catch (error) {
    console.warn("[ORDER] Coupon restore on cancel failed:", error.message);
  }

  const [updated] = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
  return success(res, "Order cancelled", { order: updated });
});

/**
 * POST /api/user/orders/:id/payment-failed
 * Called by checkout when a Razorpay payment is FAILED/CANCELLED before success.
 * Marks the online order's payment as failed and restores any consumed coupon so
 * the user can apply it again on their next attempt.
 */
const markPaymentFailedOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;

  const [order] = await query(
    "SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1",
    [orderId, req.user.id],
  );

  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  if (order.payment_status === "paid") {
    return success(res, "Order already paid", { order });
  }

  // If it's already failed, there's nothing more to restore.
  const alreadyFailed = order.payment_status === "failed";

  await query(
    "UPDATE orders SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [orderId],
  );

  if (!alreadyFailed) {
    try {
      const { restoreCouponOnOrderFailure } = require("../services/couponService");
      await restoreCouponOnOrderFailure(orderId);
    } catch (error) {
      console.warn("[ORDER] Coupon restore on payment failed:", error.message);
    }
  }

  const [updated] = await query("SELECT * FROM orders WHERE id = ?", [orderId]);
  return success(res, "Payment marked failed; coupon restored", { order: updated });
});

module.exports = {
  createOrder,
  trackOrder,
  getUserOrders,
  getUserOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
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
};
