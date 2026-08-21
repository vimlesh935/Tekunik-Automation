const Razorpay = require("razorpay");
const crypto = require("crypto");
const { query } = require("../config/db");
const { success, failure } = require("../utils/response");
const settingsService = require("../config/settingsService");

// Dynamic Razorpay credentials: database (settingsService) preferred, .env
// fallback. Read at request time so Admin changes apply without restart.
const getRazorpayCredentials = async () => {
  const [keyId, keySecret] = await Promise.all([
    settingsService.get("payment.razorpayKeyId"),
    settingsService.get("payment.razorpayKeySecret"),
  ]);
  return {
    keyId: String(keyId || "").trim(),
    keySecret: String(keySecret || "").trim(),
  };
};

const getRazorpayClient = async () => {
  const { keyId, keySecret } = await getRazorpayCredentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return failure(res, "Order ID required", 400);

    const orders = await query("SELECT id, total_amount, order_number FROM orders WHERE id = ?", [order_id]);
    if (!orders || !orders.length) return failure(res, "Order not found", 404);
    const order = orders[0];

    const amount = Math.round(parseFloat(order.total_amount) * 100);
    if (amount <= 0) return failure(res, "Invalid order amount", 400);

    const { keyId } = await getRazorpayCredentials();
    if (!keyId) return failure(res, "Razorpay is not configured", 400);

    const razorpay = await getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: order.order_number,
      notes: { order_id: String(order.id) },
    });

    await query("UPDATE orders SET razorpay_order_id = ? WHERE id = ?", [razorpayOrder.id, order.id]);

    success(res, "Razorpay order created", {
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: keyId,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return failure(res, "Missing payment verification fields", 400);
    }

    const { keySecret } = await getRazorpayCredentials();
    if (!keySecret) return failure(res, "Razorpay is not configured", 400);

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return failure(res, "Payment verification failed - invalid signature", 400);
    }

    const orders = await query("SELECT id, payment_status FROM orders WHERE razorpay_order_id = ?", [razorpay_order_id]);
    if (!orders || !orders.length) return failure(res, "Order not found", 404);

    const order = orders[0];
    if (order.payment_status === "paid") {
      return success(res, "Payment already verified", { already_paid: true });
    }

    const transaction_id = `TXN${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    await query(
      `UPDATE orders SET
        payment_status = 'paid',
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        transaction_id = ?,
        paid_at = NOW()
      WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, transaction_id, order.id]
    );

    success(res, "Payment verified successfully", {
      transaction_id,
      razorpay_payment_id,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    const orders = await query(
      `SELECT id, order_number, total_amount, payment_method, payment_status,
        razorpay_order_id, razorpay_payment_id, transaction_id, paid_at
      FROM orders WHERE id = ?`,
      [req.params.id]
    );
    if (!orders || !orders.length) return failure(res, "Order not found", 404);
    success(res, "Payment details fetched", orders[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Real Razorpay configuration check: performs an authenticated API call
 * (list orders, count=1). HTTP 200 => credentials valid; 401 => invalid;
 * 400/network => other problem. Never a fake success.
 */
exports.testRazorpayConfiguration = async (req, res, next) => {
  try {
    const { keyId, keySecret } = await getRazorpayCredentials();
    if (!keyId || !keySecret) {
      return success(res, "Razorpay is not configured", {
        configured: false,
        result: "not_configured",
        message: "No Razorpay credentials configured.",
      });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    let response;
    try {
      response = await fetch("https://api.razorpay.com/v1/orders?count=1&skip=0", {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 10000,
      });
    } catch (fetchError) {
      return success(res, "Razorpay test connection failed", {
        configured: true,
        result: "error",
        message: `Could not reach Razorpay API: ${fetchError.message}`,
      });
    }

    if (response.status === 200) {
      return success(res, "Razorpay configuration is valid", {
        configured: true,
        result: "connected",
        message: "Razorpay API accepted the configured credentials.",
      });
    }

    if (response.status === 401) {
      return success(res, "Razorpay credentials are invalid", {
        configured: true,
        result: "invalid_credentials",
        message: "Razorpay rejected the configured credentials (401 Unauthorized).",
      });
    }

    return success(res, "Razorpay test returned an unexpected status", {
      configured: true,
      result: "error",
      message: `Razorpay API responded with HTTP ${response.status}.`,
    });
  } catch (err) {
    next(err);
  }
};
