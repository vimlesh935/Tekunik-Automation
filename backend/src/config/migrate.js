const { query } = require("./db");

const ensureGuestOrderColumns = async () => {
  try {
    // Check if guest_name column exists in orders table
    const [columns] = await query("SHOW COLUMNS FROM orders LIKE 'guest_name'");
    if (!columns) {
      await query(`
        ALTER TABLE orders
        ADD COLUMN guest_name VARCHAR(200) NULL AFTER user_id,
        ADD COLUMN guest_email VARCHAR(150) NULL AFTER guest_name,
        ADD COLUMN guest_phone VARCHAR(20) NULL AFTER guest_email,
        ADD COLUMN delivery_address TEXT NULL AFTER total_amount,
        ADD COLUMN guest_city VARCHAR(100) NULL AFTER delivery_address,
        ADD COLUMN guest_state VARCHAR(100) NULL AFTER guest_city,
        ADD COLUMN guest_pincode VARCHAR(20) NULL AFTER guest_state,
        ADD COLUMN payment_method VARCHAR(50) NULL DEFAULT 'cod' AFTER payment_status,
        ADD INDEX idx_orders_guest_email (guest_email),
        ADD INDEX idx_orders_guest_phone (guest_phone),
        ADD INDEX idx_orders_order_number (order_number)
      `);
      console.log("✅ [MIGRATE] Added guest order columns to orders table");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not add guest columns:", error.message);
  }
};

const ensureProductsColumns = async () => {
  try {
    console.log("[MIGRATE] Checking products table columns...");
    
    // Check and add brand column
    const [brandCol] = await query("SHOW COLUMNS FROM products LIKE 'brand'");
    if (!brandCol) {
      console.log("[MIGRATE] Adding 'brand' column to products table...");
      await query(`ALTER TABLE products ADD COLUMN brand VARCHAR(100) NULL DEFAULT '' AFTER price`);
      console.log("✅ [MIGRATE] Added 'brand' column to products table");
    }
    
    // Check and add features column
    const [featuresCol] = await query("SHOW COLUMNS FROM products LIKE 'features'");
    if (!featuresCol) {
      console.log("[MIGRATE] Adding 'features' column to products table...");
      await query(`ALTER TABLE products ADD COLUMN features TEXT NULL AFTER brand`);
      console.log("✅ [MIGRATE] Added 'features' column to products table");
    }
    
  } catch (error) {
    console.error("❌ [MIGRATE] Error ensuring products columns:", error.message);
  }
};

const ensureUsersOtpColumns = async () => {
  try {
    // Verify email_otps table exists and has correct columns
    const tables = await query("SHOW TABLES LIKE 'email_otps'");
    if (!tables.length) {
      console.warn("⚠️ [MIGRATE] email_otps table not found");
      return;
    }
    console.log("✅ [MIGRATE] email_otps table verified");
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not verify OTP columns:", error.message);
  }
};

const ensureAdminTables = async () => {
  try {
    // Verify admin-related tables and migrations
    await ensureProductsColumns();
    console.log("✅ [MIGRATE] All admin migrations completed");
  } catch (error) {
    console.error("❌ [MIGRATE] Error in admin migrations:", error.message);
  }
};

module.exports = {
  ensureGuestOrderColumns,
  ensureProductsColumns,
  ensureUsersOtpColumns,
  ensureAdminTables,
};