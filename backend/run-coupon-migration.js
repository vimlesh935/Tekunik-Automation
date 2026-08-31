/**
 * Run the coupon system migration (STEP 1).
 *
 * Creates the `coupons` and `coupon_usage` MySQL tables.
 *
 * Run: node run-coupon-migration.js
 */
const { testConnection, pool } = require("./src/config/db");
const { ensureCouponTables } = require("./src/config/migrate");

(async () => {
  console.log("=== COUPON SYSTEM MIGRATION ===");
  try {
    await testConnection();
    console.log("✅ MySQL connected");
    await ensureCouponTables();
    console.log("\n✅ Coupon migration completed successfully");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();