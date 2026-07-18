const Razorpay = require("razorpay");
const crypto = require("crypto");
const env = require("../config/env");
const { query } = require("../config/db");
const { success, failure } = require("../utils/response");

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret,
});

exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return failure(res, "Order ID required", 400);

    const orders = await query("SELECT id, total_amount, order_number FROM orders WHERE id = ?", [order_id]);
    if (!orders || !orders.length) return failure(res, "Order not found", 404);
    const order = orders[0];

    const amount = Math.round(parseFloat(order.total_amount) * 100);
    if (amount <= 0) return failure(res, "Invalid order amount", 400);

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
      key_id: env.razorpay.keyId,
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

    const expectedSignature = crypto
      .createHmac("sha256", env.razorpay.keySecret)
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
