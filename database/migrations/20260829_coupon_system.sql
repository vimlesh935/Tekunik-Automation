-- ============================================================
-- TEKNODE — Coupon System Migration (v1)
-- Mirrors backend/src/config/couponMigration.js (which the app
-- also runs idempotently at startup). Safe to re-run.
-- ============================================================

-- Coupons: a coupon only UNLOCKS an existing Offer (discounts).
-- All discount rules live on the offer; the coupon stores redemption rules.
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  offer_id INT NULL,
  user_id INT NULL,                          -- NULL = shared coupon
  code VARCHAR(60) NOT NULL,
  coupon_type ENUM('shared','personal','welcome') NOT NULL DEFAULT 'shared',
  status ENUM('ACTIVE','USED','EXPIRED','DISABLED') NOT NULL DEFAULT 'ACTIVE',
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  per_user_limit INT NOT NULL DEFAULT 1,
  expires_at DATETIME NULL,
  used_at DATETIME NULL,
  created_order_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_coupons_code (code),
  INDEX idx_coupons_status (status),
  INDEX idx_coupons_expiry (expires_at),
  INDEX idx_coupons_offer (offer_id),
  INDEX idx_coupons_user (user_id),
  CONSTRAINT fk_coupons_offer FOREIGN KEY (offer_id) REFERENCES discounts(id) ON DELETE SET NULL,
  CONSTRAINT fk_coupons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Immutable per-redemption ledger (analytics + per-user limits).
CREATE TABLE IF NOT EXISTS coupon_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupon_usage_coupon (coupon_id),
  INDEX idx_coupon_usage_user (user_id),
  INDEX idx_coupon_usage_order (order_id),
  CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_usage_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Offer-side coupon configuration columns (ensured idempotently by the app
-- at startup; add manually here if provisioning a fresh DB):
-- ALTER TABLE discounts
--   ADD COLUMN audience VARCHAR(20) NULL DEFAULT 'ALL',
--   ADD COLUMN new_user_only TINYINT(1) NOT NULL DEFAULT 0,
--   ADD COLUMN coupon_generation VARCHAR(20) NULL,
--   ADD COLUMN coupon_prefix VARCHAR(30) NULL,
--   ADD COLUMN usage_limit INT NULL,
--   ADD COLUMN used_count INT NOT NULL DEFAULT 0,
--   ADD COLUMN coupon_validity_days INT NULL;

-- Cart-side applied coupon snapshot:
-- ALTER TABLE carts
--   ADD COLUMN applied_coupon_id INT NULL,
--   ADD COLUMN applied_coupon_code VARCHAR(60) NULL,
--   ADD COLUMN applied_coupon_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Order-side historical pricing snapshot:
-- ALTER TABLE orders
--   ADD COLUMN coupon_code VARCHAR(60) NULL,
--   ADD COLUMN coupon_offer_id INT NULL,
--   ADD COLUMN coupon_offer_name VARCHAR(200) NULL,
--   ADD COLUMN coupon_coupon_id INT NULL,
--   ADD COLUMN coupon_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
