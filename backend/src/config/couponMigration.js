/**
 * COUPON SYSTEM MIGRATION
 *
 * Ensures all columns for standalone and offer-linked coupons exist safely and idempotently.
 * Supports:
 *   - Direct coupon attributes: discount_type, discount_value, minimum_cart_value,
 *     maximum_discount, starts_at, expires_at, usage_limit, per_user_limit,
 *     applicable_products, applicable_categories, stack_with_offer, is_active
 *   - Legacy/offer-linked fields: offer_id, user_id, coupon_type, status
 *   - Ledger & snapshot: coupon_usage table, carts coupon columns, orders coupon snapshot
 */

const { query } = require("./db");

const COUPON_STATUSES = ["ACTIVE", "USED", "EXPIRED", "DISABLED"];
const COUPON_TYPES = ["shared", "personal", "welcome"];

const ensureColumn = async (table, column, definition) => {
  try {
    const safeColumn = String(column).replace(/'/g, "''");
    const [existing] = await query(`SHOW COLUMNS FROM ${table} LIKE '${safeColumn}'`);
    if (!existing) {
      await query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
      console.log(`✅ [COUPON-MIGRATION] Added '${column}' to ${table}`);
    }
  } catch (err) {
    console.warn(`⚠️ [COUPON-MIGRATION] Could not ensure column ${table}.${column}:`, err.message);
  }
};

const ensureCouponsTable = async () => {
  const tables = await query("SHOW TABLES LIKE 'coupons'");

  if (!tables.length) {
    console.log("[COUPON-MIGRATION] Creating coupons table...");
    await query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(60) NOT NULL,
        description TEXT NULL,
        discount_type ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        minimum_cart_value DECIMAL(10,2) NULL DEFAULT 0.00,
        maximum_discount DECIMAL(10,2) NULL,
        starts_at DATETIME NULL,
        expires_at DATETIME NULL,
        usage_limit INT NULL,
        used_count INT NOT NULL DEFAULT 0,
        per_user_limit INT NOT NULL DEFAULT 1,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        applicable_products JSON NULL,
        applicable_categories JSON NULL,
        stack_with_offer TINYINT(1) NOT NULL DEFAULT 1,
        offer_id INT NULL,
        user_id INT NULL,
        coupon_type ENUM('shared','personal','welcome') NOT NULL DEFAULT 'shared',
        status ENUM('ACTIVE','USED','EXPIRED','DISABLED') NOT NULL DEFAULT 'ACTIVE',
        created_by INT NULL,
        used_at DATETIME NULL,
        created_order_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_coupons_code (code),
        INDEX idx_coupons_offer (offer_id),
        INDEX idx_coupons_user (user_id),
        INDEX idx_coupons_status (status),
        INDEX idx_coupons_active (is_active),
        INDEX idx_coupons_expires (expires_at),
        INDEX idx_coupons_starts (starts_at),
        FOREIGN KEY (offer_id) REFERENCES discounts(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ [COUPON-MIGRATION] Coupons table created");
    return;
  }

  // Table exists: ensure all new/existing columns are present
  await ensureColumn("coupons", "code", "code VARCHAR(60) NOT NULL");
  await ensureColumn("coupons", "description", "description TEXT NULL AFTER code");
  await ensureColumn("coupons", "discount_type", "discount_type ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage' AFTER description");
  await ensureColumn("coupons", "discount_value", "discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_type");
  await ensureColumn("coupons", "minimum_cart_value", "minimum_cart_value DECIMAL(10,2) NULL DEFAULT 0.00 AFTER discount_value");
  await ensureColumn("coupons", "maximum_discount", "maximum_discount DECIMAL(10,2) NULL AFTER minimum_cart_value");
  await ensureColumn("coupons", "starts_at", "starts_at DATETIME NULL AFTER maximum_discount");
  await ensureColumn("coupons", "expires_at", "expires_at DATETIME NULL AFTER starts_at");
  await ensureColumn("coupons", "usage_limit", "usage_limit INT NULL AFTER expires_at");
  await ensureColumn("coupons", "used_count", "used_count INT NOT NULL DEFAULT 0 AFTER usage_limit");
  await ensureColumn("coupons", "per_user_limit", "per_user_limit INT NOT NULL DEFAULT 1 AFTER used_count");
  await ensureColumn("coupons", "is_active", "is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER per_user_limit");
  await ensureColumn("coupons", "applicable_products", "applicable_products JSON NULL AFTER is_active");
  await ensureColumn("coupons", "applicable_categories", "applicable_categories JSON NULL AFTER applicable_products");
  await ensureColumn("coupons", "stack_with_offer", "stack_with_offer TINYINT(1) NOT NULL DEFAULT 1 AFTER applicable_categories");
  await ensureColumn("coupons", "offer_id", "offer_id INT NULL AFTER stack_with_offer");
  await ensureColumn("coupons", "user_id", "user_id INT NULL AFTER offer_id");
  await ensureColumn("coupons", "coupon_type", "coupon_type ENUM('shared','personal','welcome') NOT NULL DEFAULT 'shared' AFTER user_id");
  await ensureColumn("coupons", "status", "status ENUM('ACTIVE','USED','EXPIRED','DISABLED') NOT NULL DEFAULT 'ACTIVE' AFTER coupon_type");
  await ensureColumn("coupons", "created_by", "created_by INT NULL AFTER status");
  await ensureColumn("coupons", "used_at", "used_at DATETIME NULL AFTER created_by");
  await ensureColumn("coupons", "created_order_id", "created_order_id INT NULL AFTER used_at");
};

const ensureCouponUsageTable = async () => {
  const found = await query("SHOW TABLES LIKE 'coupon_usage'");
  if (found.length) return;
  await query(`
    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INT AUTO_INCREMENT PRIMARY KEY,
      coupon_id INT NOT NULL,
      user_id INT NULL,
      order_id INT NULL,
      discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_coupon_usage_coupon_user (coupon_id, user_id),
      INDEX idx_coupon_usage_coupon (coupon_id),
      INDEX idx_coupon_usage_user (user_id),
      INDEX idx_coupon_usage_order (order_id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log("✅ [COUPON-MIGRATION] coupon_usage table ready");
};

const ensureCartCouponColumns = async () => {
  await ensureColumn("carts", "applied_coupon_id", "applied_coupon_id INT NULL");
  await ensureColumn("carts", "applied_coupon_code", "applied_coupon_code VARCHAR(60) NULL");
  await ensureColumn("carts", "applied_coupon_discount", "applied_coupon_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00");
};

const ensureOrderCouponColumns = async () => {
  await ensureColumn("orders", "subtotal", "subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00");
  await ensureColumn("orders", "offer_discount", "offer_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00");
  await ensureColumn("orders", "coupon_code", "coupon_code VARCHAR(80) NULL");
  await ensureColumn("orders", "coupon_offer_id", "coupon_offer_id INT NULL");
  await ensureColumn("orders", "coupon_offer_name", "coupon_offer_name VARCHAR(255) NULL");
  await ensureColumn("orders", "coupon_coupon_id", "coupon_coupon_id INT NULL");
  await ensureColumn("orders", "coupon_discount", "coupon_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00");
  await ensureColumn("orders", "shipping", "shipping DECIMAL(10,2) NOT NULL DEFAULT 0.00");
  await ensureColumn("orders", "tax", "tax DECIMAL(10,2) NOT NULL DEFAULT 0.00");
  await ensureColumn("orders", "total_savings", "total_savings DECIMAL(10,2) NOT NULL DEFAULT 0.00");
};

const ensureOfferCouponColumns = async () => {
  await ensureColumn("discounts", "audience", "audience VARCHAR(20) NULL DEFAULT 'ALL'");
  await ensureColumn("discounts", "new_user_only", "new_user_only TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("discounts", "coupon_generation", "coupon_generation VARCHAR(20) NULL");
  await ensureColumn("discounts", "coupon_prefix", "coupon_prefix VARCHAR(30) NULL");
  await ensureColumn("discounts", "usage_limit", "usage_limit INT NULL");
  await ensureColumn("discounts", "used_count", "used_count INT NOT NULL DEFAULT 0");
  await ensureColumn("discounts", "coupon_validity_days", "coupon_validity_days INT NULL");
};

const ensureOfferLinkedCouponTables = async () => {
  try {
    await ensureOfferCouponColumns();
    await ensureCouponsTable();
    await ensureCouponUsageTable();
    await ensureCartCouponColumns();
    await ensureOrderCouponColumns();
    console.log("✅ [COUPON-MIGRATION] Coupon schema ready\n");
  } catch (error) {
    console.warn("⚠️ [COUPON-MIGRATION] Could not ensure coupon tables:", error.message);
    throw error;
  }
};

module.exports = {
  ensureOfferLinkedCouponTables,
  runCouponMigration: ensureOfferLinkedCouponTables,
  COUPON_STATUSES,
  COUPON_TYPES,
};