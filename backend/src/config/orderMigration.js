const { query } = require("./db");

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

module.exports = { ensureOrderCancellationColumns };