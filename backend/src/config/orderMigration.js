const { query } = require("./db");

const TRACKING_STEPS = [
  {
    status: "pending",
    label: "Order Confirmed",
    description: "Your order has been placed and is awaiting confirmation",
  },
  {
    status: "confirmed",
    label: "Order Confirmed",
    description: "Your order has been confirmed",
  },
  {
    status: "processing",
    label: "Processing",
    description: "Your order is being prepared",
  },
  {
    status: "packed",
    label: "Packed",
    description: "Your order has been packed",
  },
  {
    status: "shipped",
    label: "Shipped",
    description: "Your order has been shipped",
  },
  {
    status: "out_for_delivery",
    label: "Out for Delivery",
    description: "Your order is out for delivery",
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Your order has been delivered",
  },
];

const ensureColumn = async (table, column, definition) => {
  const safeColumn = String(column).replace(/'/g, "''");
  const [existing] = await query(`SHOW COLUMNS FROM ${table} LIKE '${safeColumn}'`);
  if (!existing) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    console.log(`✅ [MIGRATE] Added '${column}' column to ${table} table`);
  }
};

const ensureOrderTrackingTable = async () => {
  try {
    console.log("[MIGRATE] Checking order tracking table and columns...");

    await ensureColumn("orders", "tracking_number", "tracking_number VARCHAR(50) NULL UNIQUE AFTER invoice_number");
    await ensureColumn("orders", "estimated_delivery", "estimated_delivery DATE NULL AFTER user_email");

    await query(
      `CREATE TABLE IF NOT EXISTS order_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        label VARCHAR(100) NOT NULL,
        description TEXT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_tracking_order (order_id),
        INDEX idx_tracking_status (status)
      )`,
    );

    console.log("✅ [MIGRATE] Order tracking table and columns ready");
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure order tracking table:", error.message);
    throw error;
  }
};

const generateTrackingNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRK-${timestamp}-${random}`;
};

const getEstimatedDelivery = (daysFromNow = 5) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
};

const getTrackingSteps = (currentStatus = "pending") => {
  const currentIndex = TRACKING_STEPS.findIndex((step) => step.status === currentStatus);
  return TRACKING_STEPS.map((step, index) => ({
    ...step,
    completed: currentIndex >= index || currentStatus === "delivered",
    current: step.status === currentStatus,
  }));
};

const ensureOrderCancellationColumns = async () => {
  try {
    console.log("[MIGRATE] Checking order cancellation columns...");

    // Check and add cancelled_at
    const [colCancelledAt] = await query("SHOW COLUMNS FROM orders LIKE 'cancelled_at'");
    if (!colCancelledAt) {
      await query(
        "ALTER TABLE orders ADD COLUMN cancelled_at DATETIME NULL AFTER estimated_delivery"
      );
      console.log("✅ [MIGRATE] Added 'cancelled_at' column to orders table");
    }

    // Check and add cancelled_by
    const [colCancelledBy] = await query("SHOW COLUMNS FROM orders LIKE 'cancelled_by'");
    if (!colCancelledBy) {
      await query(
        "ALTER TABLE orders ADD COLUMN cancelled_by VARCHAR(50) NULL AFTER cancelled_at"
      );
      console.log("✅ [MIGRATE] Added 'cancelled_by' column to orders table");
    }

    // Check and add cancel_reason
    const [colCancelReason] = await query("SHOW COLUMNS FROM orders LIKE 'cancel_reason'");
    if (!colCancelReason) {
      await query(
        "ALTER TABLE orders ADD COLUMN cancel_reason TEXT NULL AFTER cancelled_by"
      );
      console.log("✅ [MIGRATE] Added 'cancel_reason' column to orders table");
    }

    console.log("✅ [MIGRATE] Order cancellation columns ready");
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure order cancellation columns:", error.message);
  }
};

module.exports = {
  ensureOrderTrackingTable,
  ensureOrderCancellationColumns,
  getTrackingSteps,
  getEstimatedDelivery,
  generateTrackingNumber,
};
