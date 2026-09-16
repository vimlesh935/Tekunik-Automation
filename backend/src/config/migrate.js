const { query } = require("./db");
const bcrypt = require("bcrypt");
const { ensureEmailTemplatesTable } = require("./emailTemplateMigration");

const BCRYPT_ROUNDS = 12;

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

const ensureOrderShippingColumns = async () => {
  try {
    console.log("[MIGRATE] Checking order shipping columns...");

    const shippingColumns = [
      { name: "shipping_method", sql: "ALTER TABLE orders ADD COLUMN shipping_method VARCHAR(50) NULL DEFAULT 'standard' AFTER payment_method" },
      { name: "shipping_provider", sql: "ALTER TABLE orders ADD COLUMN shipping_provider VARCHAR(100) NULL AFTER shipping_method" },
      { name: "shipping_charge", sql: "ALTER TABLE orders ADD COLUMN shipping_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER shipping_provider" },
      { name: "shipped_at", sql: "ALTER TABLE orders ADD COLUMN shipped_at DATETIME NULL AFTER shipping_charge" },
      { name: "out_for_delivery_at", sql: "ALTER TABLE orders ADD COLUMN out_for_delivery_at DATETIME NULL AFTER shipped_at" },
      { name: "delivered_at", sql: "ALTER TABLE orders ADD COLUMN delivered_at DATETIME NULL AFTER out_for_delivery_at" },
      { name: "failed_at", sql: "ALTER TABLE orders ADD COLUMN failed_at DATETIME NULL AFTER delivered_at" },
      { name: "cancelled_at", sql: "ALTER TABLE orders ADD COLUMN cancelled_at DATETIME NULL AFTER failed_at" },
      { name: "cancelled_by", sql: "ALTER TABLE orders ADD COLUMN cancelled_by ENUM('USER','ADMIN') NULL AFTER cancelled_at" },
      { name: "cancel_reason", sql: "ALTER TABLE orders ADD COLUMN cancel_reason TEXT NULL AFTER cancelled_by" },
    ];

    for (const col of shippingColumns) {
      const [exists] = await query(`SHOW COLUMNS FROM orders LIKE '${col.name}'`);
      if (!exists) {
        await query(col.sql);
        console.log(`✅ [MIGRATE] Added '${col.name}' column to orders table`);
      }
    }

    // Extend orders.status ENUM with new shipping lifecycle statuses
    const [statusCol] = await query("SHOW COLUMNS FROM orders LIKE 'status'");
    if (statusCol && statusCol.Type && !statusCol.Type.includes("in_transit")) {
      await query(
        "ALTER TABLE orders MODIFY COLUMN status ENUM('pending','confirmed','processing','packed','shipped','in_transit','out_for_delivery','delivered','delivery_failed','cancelled') NOT NULL DEFAULT 'pending'"
      );
      console.log("✅ [MIGRATE] Extended orders.status enum with in_transit/delivery_failed");
    }

    console.log("✅ [MIGRATE] Order shipping columns ready");
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure order shipping columns:", error.message);
  }
};

const ensureShippingZonesTable = async () => {
  try {
    console.log("[MIGRATE] Checking shipping_zones table...");

    const tables = await query("SHOW TABLES LIKE 'shipping_zones'");
    if (!tables.length) {
      await query(`
        CREATE TABLE shipping_zones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          zone_name VARCHAR(100) NOT NULL,
          states JSON NULL,
          pincodes JSON NULL,
          shipping_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          express_charge DECIMAL(10,2) NULL,
          cod_charge DECIMAL(10,2) NULL,
          estimated_delivery_days_min INT NOT NULL DEFAULT 2,
          estimated_delivery_days_max INT NOT NULL DEFAULT 7,
          is_enabled TINYINT(1) NOT NULL DEFAULT 1,
          is_default TINYINT(1) NOT NULL DEFAULT 0,
          priority INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_shipping_zones_enabled (is_enabled),
          INDEX idx_shipping_zones_priority (priority)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log("✅ [MIGRATE] Created shipping_zones table");
    } else {
      console.log("✅ [MIGRATE] shipping_zones table exists");
      const columns = [
        ["zone_name", "VARCHAR(100) NOT NULL"],
        ["states", "JSON NULL"],
        ["pincodes", "JSON NULL"],
        ["shipping_charge", "DECIMAL(10,2) NOT NULL DEFAULT 0.00"],
        ["express_charge", "DECIMAL(10,2) NULL"],
        ["cod_charge", "DECIMAL(10,2) NULL"],
        ["estimated_delivery_days_min", "INT NOT NULL DEFAULT 2"],
        ["estimated_delivery_days_max", "INT NOT NULL DEFAULT 7"],
        ["is_enabled", "TINYINT(1) NOT NULL DEFAULT 1"],
        ["is_default", "TINYINT(1) NOT NULL DEFAULT 0"],
        ["priority", "INT NOT NULL DEFAULT 0"],
      ];
      for (const [name, definition] of columns) {
        const [column] = await query(`SHOW COLUMNS FROM shipping_zones LIKE '${name}'`);
        if (!column) {
          await query(`ALTER TABLE shipping_zones ADD COLUMN ${name} ${definition}`);
          console.log(`✅ [MIGRATE] Added shipping_zones.${name}`);
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure shipping_zones table:", error.message);
  }
};

const ensureShippingMethodsTable = async () => {
  try {
    console.log("[MIGRATE] Checking shipping_methods table...");

    const tables = await query("SHOW TABLES LIKE 'shipping_methods'");
    if (!tables.length) {
      await query(`
        CREATE TABLE shipping_methods (
          id INT AUTO_INCREMENT PRIMARY KEY,
          method_key VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          description TEXT NULL,
          base_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          estimated_days_min INT NOT NULL DEFAULT 2,
          estimated_days_max INT NOT NULL DEFAULT 7,
          is_enabled TINYINT(1) NOT NULL DEFAULT 1,
          is_default TINYINT(1) NOT NULL DEFAULT 0,
          supports_cod TINYINT(1) NOT NULL DEFAULT 1,
          supports_online TINYINT(1) NOT NULL DEFAULT 1,
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_shipping_methods_enabled (is_enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log("✅ [MIGRATE] Created shipping_methods table");
      
      // Insert default shipping methods
      await query(`
        INSERT IGNORE INTO shipping_methods (method_key, name, description, base_charge, estimated_days_min, estimated_days_max, is_enabled, is_default, supports_cod, supports_online, sort_order) VALUES
        ('standard', 'Standard Delivery', 'Regular delivery within 5-7 business days', 50.00, 5, 7, 1, 1, 1, 1, 1),
        ('express', 'Express Delivery', 'Fast delivery within 2-3 business days', 150.00, 2, 3, 1, 0, 1, 1, 2),
        ('free', 'Free Shipping', 'Free shipping on orders above threshold', 0.00, 5, 7, 1, 0, 1, 1, 3)
      `);
      console.log("✅ [MIGRATE] Seeded default shipping methods");
    } else {
      console.log("✅ [MIGRATE] shipping_methods table exists");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure shipping_methods table:", error.message);
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

    const [imageUrlCol] = await query("SHOW COLUMNS FROM products LIKE 'image_url'");
    if (!imageUrlCol) {
      console.log("[MIGRATE] Adding 'image_url' column to products table...");
      await query(`ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL AFTER category_id`);
      console.log("✅ [MIGRATE] Added 'image_url' column to products table");
    }
    
    // Check and add applications column (CRITICAL FIX - missing column causing product creation to fail)
    const [applicationsCol] = await query("SHOW COLUMNS FROM products LIKE 'applications'");
    if (!applicationsCol) {
      console.log("[MIGRATE] Adding 'applications' column to products table...");
      await query(`ALTER TABLE products ADD COLUMN applications JSON NULL AFTER features`);
      console.log("✅ [MIGRATE] Added 'applications' column to products table");
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

/**
 * Add a `token_version` column to the users table (if missing).
 * Every successful password change increments this counter and embeds it in
 * newly-issued JWTs, so previously-issued tokens can be rejected by
 * requireAuth. Existing tokens (no claim -> 0) stay valid until the first
 * password change, which prevents breaking current logged-in sessions.
 */
const ensureUsersTokenVersionColumn = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'users'");
    if (!tables.length) {
      console.warn("⚠️ [MIGRATE] users table not found");
      return;
    }

    const [column] = await query("SHOW COLUMNS FROM users LIKE 'token_version'");
    if (!column) {
      await query(
        "ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER is_verified"
      );
      console.log("✅ [MIGRATE] Added token_version column to users table");
    } else {
      console.log("✅ [MIGRATE] users.token_version column verified");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure users token_version column:", error.message);
  }
};

/**
 * Add a `language_preference` column to the users table (if missing).
 * Stores the user's selected interface language (e.g. 'en', 'hi', 'mr').
 */
const ensureUsersLanguagePreference = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'users'");
    if (!tables.length) {
      console.warn("⚠️ [MIGRATE] users table not found");
      return;
    }

    const [column] = await query("SHOW COLUMNS FROM users LIKE 'language_preference'");
    if (!column) {
      await query(
        "ALTER TABLE users ADD COLUMN language_preference VARCHAR(10) DEFAULT 'en' AFTER is_verified"
      );
      console.log("✅ [MIGRATE] Added language_preference column to users table");
    } else {
      console.log("✅ [MIGRATE] users.language_preference column verified");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure users language_preference column:", error.message);
  }
};

const ensureUserProfileColumns = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'user_profiles'");
    if (!tables.length) return;

    const [pincodeColumn] = await query(
      "SHOW COLUMNS FROM user_profiles LIKE 'pincode'",
    );
    if (!pincodeColumn) {
      await query(
        "ALTER TABLE user_profiles ADD COLUMN pincode VARCHAR(10) NULL AFTER city",
      );
      console.log("✅ [MIGRATE] Added pincode column to user_profiles");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure user profile columns:", error.message);
  }
};

const ensureReviewsTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'product_reviews'");
    if (!tables.length) {
      await query(`
        CREATE TABLE product_reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          order_id INT NULL,
          user_id INT NULL,
          customer_name VARCHAR(200) NULL,
          customer_email VARCHAR(200) NOT NULL,
          rating TINYINT(1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
          review_title VARCHAR(500) NULL,
          review_message TEXT NULL,
          review_images JSON NULL,
          review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
          is_approved BOOLEAN NOT NULL DEFAULT FALSE,
          show_on_website BOOLEAN NOT NULL DEFAULT FALSE,
          admin_notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approved_at DATETIME NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          website_visibility ENUM('visible','hidden') NOT NULL DEFAULT 'hidden',
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_reviews_product (product_id),
          INDEX idx_reviews_status (review_status),
          INDEX idx_reviews_public (is_approved, show_on_website),
          INDEX idx_reviews_user (user_id),
          INDEX idx_reviews_order (order_id),
          INDEX idx_reviews_customer_email (customer_email)
        )
      `);
      console.log("✅ [MIGRATE] Created product_reviews table");
    } else {
      console.log("✅ [MIGRATE] product_reviews table exists");

      const missingCols = [];
      const checks = [
        { name: "customer_name", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200) NULL AFTER user_id" },
        { name: "customer_email", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS customer_email VARCHAR(200) NOT NULL AFTER customer_name" },
        { name: "review_images", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS review_images JSON NULL AFTER review_message" },
        { name: "review_status", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER review_images" },
        { name: "is_approved", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE AFTER review_status" },
        { name: "show_on_website", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS show_on_website BOOLEAN NOT NULL DEFAULT FALSE AFTER is_approved" },
        { name: "admin_notes", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL AFTER show_on_website" },
        { name: "approved_by", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS approved_by INT NULL AFTER admin_notes" },
        { name: "approved_at", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL AFTER approved_by" },
        { name: "updated_at", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER approved_at" },
        { name: "website_visibility", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS website_visibility ENUM('visible','hidden') NOT NULL DEFAULT 'hidden' AFTER updated_at" },
      ];

      for (const col of checks) {
        try {
          const [exists] = await query(`SHOW COLUMNS FROM product_reviews LIKE '${col.name}'`);
          if (!exists) {
            await query(col.sql);
            missingCols.push(col.name);
          }
        } catch (err) {
          // Column already exists or other issue - continue
        }
      }

      if (missingCols.length) {
        console.log(`✅ [MIGRATE] Added missing review columns: ${missingCols.join(", ")}`);
      }

      await query(`
        UPDATE product_reviews
        SET
          is_approved = CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END,
          show_on_website = CASE
            WHEN review_status = 'approved' AND website_visibility = 'visible' THEN 1
            ELSE show_on_website
          END,
          website_visibility = CASE
            WHEN show_on_website = 1 THEN 'visible'
            ELSE website_visibility
          END
      `);
      console.log("✅ [MIGRATE] Synced review approval and website visibility flags");

      const idxChecks = [
        { name: "idx_reviews_status", sql: "ALTER TABLE product_reviews ADD INDEX IF NOT EXISTS idx_reviews_status (review_status)" },
        { name: "idx_reviews_public", sql: "ALTER TABLE product_reviews ADD INDEX IF NOT EXISTS idx_reviews_public (is_approved, show_on_website)" },
        { name: "idx_reviews_order", sql: "ALTER TABLE product_reviews ADD INDEX IF NOT EXISTS idx_reviews_order (order_id)" },
      ];

      for (const idx of idxChecks) {
        try {
          await query(idx.sql);
        } catch {
          // index may already exist under different validation
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure product_reviews table:", error.message);
  }
};

/**
 * Create the `admins` table if it doesn't exist, and seed a default admin
 * if no admin records exist yet. The default credentials come from .env
 * but the password is hashed with bcrypt before storage.
 */
const ensureAdminsTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'admins'");
    if (!tables.length) {
      console.log("[MIGRATE] Creating admins table...");
      await query(`
        CREATE TABLE admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(150) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'admin',
          status ENUM('active','inactive') NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_admins_email (email),
          INDEX idx_admins_status (status)
        )
      `);
      console.log("✅ [MIGRATE] Created admins table");
    } else {
      console.log("✅ [MIGRATE] admins table exists");
      // Add status column if missing
      try {
        const [statusCol] = await query("SHOW COLUMNS FROM admins LIKE 'status'");
        if (!statusCol) {
          await query("ALTER TABLE admins ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER role");
          console.log("✅ [MIGRATE] Added status column to admins table");
        } else {
          console.log("✅ [MIGRATE] status column already exists in admins table");
        }
      } catch (err) {
        console.warn("⚠️ [MIGRATE] Could not verify/add status column:", err.message);
      }
    }

    // Seed default admin if no admins exist
    const env = require("./env");
    const adminEmail = (env.adminEmail || "admin@tekunik.com").toLowerCase().trim();
    const adminPassword = env.adminSecretKey || "AutoAdmin2024!";

    const existing = await query("SELECT id FROM admins WHERE email = ? LIMIT 1", [adminEmail]);
    if (!existing.length) {
      const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
      await query(
        "INSERT INTO admins (email, password, role, status) VALUES (?, ?, 'admin', 'active')",
        [adminEmail, passwordHash]
      );
      console.log(`✅ [MIGRATE] Default admin seeded: ${adminEmail}`);
    } else {
      console.log(`✅ [MIGRATE] Admin already exists: ${adminEmail}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Guaranteed admin account (admin@example.com / Admin@12345 by default,
    // overridable via ADMIN_DEFAULT_EMAIL / ADMIN_DEFAULT_PASSWORD in .env).
    // Created if missing; if present, its password is verified against the
    // bcrypt hash and re-hashed only when it no longer matches, so login
    // with these credentials always works. Uses the existing `admins` table
    // and `role`/`status` columns — no separate auth system.
    // ═══════════════════════════════════════════════════════════════════
    const defaultAdminEmail = (env.adminDefaultEmail || "admin@example.com").toLowerCase().trim();
    const defaultAdminPassword = env.adminDefaultPassword || "Admin@12345";
    const fullPermissions = JSON.stringify({
      dashboard: true, products: true, categories: true, orders: true,
      inventory: true, customers: true, reviews: true, discounts: true,
      coupons: true, analytics: true, reports: true, email_settings: true,
      system_settings: true, user_management: true, admin_management: true,
    });

    const defaultAdminRow = await query("SELECT id, email, password, role, status FROM admins WHERE email = ? LIMIT 1", [defaultAdminEmail]);
    if (!defaultAdminRow.length) {
      const passwordHash = await bcrypt.hash(defaultAdminPassword, BCRYPT_ROUNDS);
      await query(
        `INSERT INTO admins (email, password, name, role, status, is_active, permissions)
         VALUES (?, ?, 'Super Admin', 'super_admin', 'active', 1, ?)`,
        [defaultAdminEmail, passwordHash, fullPermissions]
      );
      console.log(`✅ [MIGRATE] Guaranteed admin created: ${defaultAdminEmail} (super_admin)`);
    } else {
      const matches = await bcrypt.compare(defaultAdminPassword, defaultAdminRow[0].password);
      if (!matches) {
        const passwordHash = await bcrypt.hash(defaultAdminPassword, BCRYPT_ROUNDS);
        await query(
          `UPDATE admins SET password = ?, role = 'super_admin', status = 'active', is_active = 1, permissions = ? WHERE id = ?`,
          [passwordHash, fullPermissions, defaultAdminRow[0].id]
        );
        console.log(`✅ [MIGRATE] Guaranteed admin password synced: ${defaultAdminEmail} (super_admin)`);
      } else if (defaultAdminRow[0].role !== "super_admin" || defaultAdminRow[0].status !== "active") {
        await query(
          `UPDATE admins SET role = 'super_admin', status = 'active', is_active = 1, permissions = ? WHERE id = ?`,
          [fullPermissions, defaultAdminRow[0].id]
        );
        console.log(`✅ [MIGRATE] Guaranteed admin role/status synced: ${defaultAdminEmail} (super_admin)`);
      } else {
        console.log(`✅ [MIGRATE] Guaranteed admin ready: ${defaultAdminEmail} (super_admin)`);
      }
    }
  } catch (error) {
    console.error("❌ [MIGRATE] Error ensuring admins table:", error.message);
  }
};

const ensureSmartHomeProposalsTables = async () => {
  try {
    const proposalsTable = await query("SHOW TABLES LIKE 'smart_home_proposals'");
    if (!proposalsTable.length) {
      await query(`
        CREATE TABLE smart_home_proposals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          proposal_number VARCHAR(50) NOT NULL UNIQUE,
          user_id INT NULL,
          full_name VARCHAR(200) NOT NULL,
          email VARCHAR(200) NOT NULL,
          phone VARCHAR(30) NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          pincode VARCHAR(10) NULL,
          address TEXT NULL,
          home_type VARCHAR(50) NULL,
          total_rooms INT NOT NULL DEFAULT 0,
          rooms_json JSON NULL,
          devices_json JSON NULL,
          estimated_products_json JSON NULL,
          estimated_cost DECIMAL(12,2) NULL DEFAULT 0,
          additional_notes TEXT NULL,
          remarks TEXT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'New',
          assigned_admin INT NULL,
          admin_notes TEXT NULL,
          quotation_amount DECIMAL(10,2) NULL,
          quotation_file VARCHAR(500) NULL,
          site_visit_date DATE NULL,
          converted_order_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_proposals_number (proposal_number),
          INDEX idx_proposals_email (email),
          INDEX idx_proposals_status (status),
          INDEX idx_proposals_created_at (created_at)
        )
      `);
      console.log("✅ [MIGRATE] Created smart_home_proposals table");
    } else {
      console.log("✅ [MIGRATE] smart_home_proposals table exists");
        // Add missing columns if table already exists
      const missingCols = [
        ["state", "VARCHAR(100) NULL AFTER city"],
        ["pincode", "VARCHAR(10) NULL AFTER state"],
        ["address", "TEXT NULL AFTER pincode"],
        ["total_rooms", "INT NOT NULL DEFAULT 0 AFTER home_type"],
        ["additional_notes", "TEXT NULL AFTER estimated_products_json"],
        ["assigned_admin", "INT NULL AFTER status"],
        ["admin_notes", "TEXT NULL AFTER assigned_admin"],
        ["quotation_amount", "DECIMAL(10,2) NULL AFTER admin_notes"],
        ["quotation_file", "VARCHAR(500) NULL AFTER quotation_amount"],
        ["site_visit_date", "DATE NULL AFTER quotation_file"],
        ["current_step", "TINYINT NOT NULL DEFAULT 0 AFTER total_rooms"],
        ["wizard_status", "VARCHAR(20) NULL DEFAULT NULL AFTER current_step"],
      ];
      for (const [col, def] of missingCols) {
        try {
          const exists = await query(`SHOW COLUMNS FROM smart_home_proposals LIKE '${col}'`);
          if (!exists.length) {
            await query(`ALTER TABLE smart_home_proposals ADD COLUMN ${col} ${def}`);
            console.log(`✅ [MIGRATE] Added column ${col} to smart_home_proposals`);
          }
        } catch (err) {
          console.warn(`⚠️ [MIGRATE] Could not add ${col}: ${err.message}`);
        }
      }
    }

    // Create proposal_status_history table
    const historyTable = await query("SHOW TABLES LIKE 'proposal_status_history'");
    if (!historyTable.length) {
      await query(`
        CREATE TABLE proposal_status_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          proposal_id INT NOT NULL,
          from_status VARCHAR(50) NULL,
          to_status VARCHAR(50) NOT NULL,
          changed_by INT NULL,
          notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_status_proposal (proposal_id),
          INDEX idx_status_created (created_at)
        )
      `);
      console.log("✅ [MIGRATE] Created proposal_status_history table");
    } else {
      console.log("✅ [MIGRATE] proposal_status_history table exists");
    }

    const countersTable = await query("SHOW TABLES LIKE 'proposal_counters'");
    if (!countersTable.length) {
      await query(`
        CREATE TABLE proposal_counters (
          id INT AUTO_INCREMENT PRIMARY KEY,
          prefix VARCHAR(10) NOT NULL UNIQUE,
          last_number INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await query(
        "INSERT INTO proposal_counters (prefix, last_number) VALUES ('SHP', 0) ON DUPLICATE KEY UPDATE last_number = last_number"
      );
      console.log("✅ [MIGRATE] Created proposal_counters table");
    } else {
      console.log("✅ [MIGRATE] proposal_counters table exists");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure smart home proposals tables:", error.message);
  }
};

const ensureAdminTables = async () => {
  try {
    await ensureUserProfileColumns();
    // Verify admin-related tables and migrations
    await ensureAdminsTable();
    await ensureProductsColumns();
    await ensureReviewsTable();
    await ensureSmartHomeProposalsTables();
    console.log("✅ [MIGRATE] All admin migrations completed");
  } catch (error) {
    console.error("❌ [MIGRATE] Error in admin migrations:", error.message);
  }
};

const ensureEnquiriesTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'demo_enquiries'");
    if (!tables.length) {
      console.log("[MIGRATE] Creating demo_enquiries table...");
      await query(`
        CREATE TABLE IF NOT EXISTS demo_enquiries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(200) NOT NULL,
          email VARCHAR(200) NOT NULL,
          phone VARCHAR(30) NOT NULL,
          message TEXT NULL,
          preferred_date DATE NULL,
          preferred_time VARCHAR(20) NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_demo_enquiries_email (email),
          INDEX idx_demo_enquiries_status (status),
          INDEX idx_demo_enquiries_created_at (created_at)
        )
      `);
      console.log("✅ [MIGRATE] Created demo_enquiries table");
    } else {
      console.log("✅ [MIGRATE] demo_enquiries table exists");
    }

    const fullNameColumns = await query("SHOW COLUMNS FROM demo_enquiries LIKE 'full_name'");
    if (!fullNameColumns.length) {
      await query("ALTER TABLE demo_enquiries ADD COLUMN full_name VARCHAR(200) NULL AFTER id");

      const legacyNameColumns = await query("SHOW COLUMNS FROM demo_enquiries LIKE 'name'");
      if (legacyNameColumns.length) {
        await query("UPDATE demo_enquiries SET full_name = name WHERE full_name IS NULL");
      }

      console.log("✅ [MIGRATE] Added full_name to demo_enquiries table");
    }

    const legacyNameColumns = await query("SHOW COLUMNS FROM demo_enquiries LIKE 'name'");
    if (legacyNameColumns.length) {
      await query("ALTER TABLE demo_enquiries MODIFY COLUMN name VARCHAR(200) NULL");
    }

    const updatedAtColumns = await query("SHOW COLUMNS FROM demo_enquiries LIKE 'updated_at'");
    if (!updatedAtColumns.length) {
      await query(
        "ALTER TABLE demo_enquiries ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
      );
      console.log("✅ [MIGRATE] Added updated_at to demo_enquiries table");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure demo_enquiries table:", error.message);
  }
};

const ensureWebsiteFrontendInformationTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'website_frontend_information'");
    if (!tables.length) {
      console.log("[MIGRATE] Creating website_frontend_information table...");
      await query(`
        CREATE TABLE website_frontend_information (
          id INT AUTO_INCREMENT PRIMARY KEY,
          company_name VARCHAR(200) DEFAULT 'Tekunik Automation',
          hero_heading VARCHAR(500) DEFAULT 'Smart Living Starts Here',
          hero_image VARCHAR(500) DEFAULT '',
          company_tagline VARCHAR(500) DEFAULT '',
          company_description TEXT DEFAULT '',
          company_logo VARCHAR(500) DEFAULT '',
          company_favicon VARCHAR(500) DEFAULT '',
          company_email VARCHAR(200) DEFAULT '',
          company_phone VARCHAR(50) DEFAULT '',
          company_whatsapp VARCHAR(50) DEFAULT '',
          company_address TEXT DEFAULT '',
          city VARCHAR(100) DEFAULT '',
          state VARCHAR(100) DEFAULT '',
          country VARCHAR(100) DEFAULT '',
          postal_code VARCHAR(20) DEFAULT '',
          google_maps_url TEXT DEFAULT '',
          support_email VARCHAR(200) DEFAULT '',
          sales_email VARCHAR(200) DEFAULT '',
          website_url VARCHAR(500) DEFAULT '',
          facebook_url VARCHAR(500) DEFAULT '',
          instagram_url VARCHAR(500) DEFAULT '',
          linkedin_url VARCHAR(500) DEFAULT '',
          youtube_url VARCHAR(500) DEFAULT '',
          twitter_url VARCHAR(500) DEFAULT '',
          copyright_text VARCHAR(500) DEFAULT '',
          footer_about TEXT DEFAULT '',
          business_hours VARCHAR(500) DEFAULT '',
          privacy_policy_url VARCHAR(500) DEFAULT '',
          terms_conditions_url VARCHAR(500) DEFAULT '',
          refund_policy_url VARCHAR(500) DEFAULT '',
          shipping_policy_url VARCHAR(500) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      // Insert default record
      await query(`
        INSERT INTO website_frontend_information (id, company_name)
        VALUES (1, 'Tekunik Automation')
      `);
      console.log("✅ [MIGRATE] Created website_frontend_information table with default record");
    } else {
      console.log("✅ [MIGRATE] website_frontend_information table exists");

      // Ensure default record exists
      const [existing] = await query("SELECT id FROM website_frontend_information WHERE id = 1");
      if (!existing) {
        await query(`
          INSERT INTO website_frontend_information (id, company_name)
          VALUES (1, 'Tekunik Automation')
        `);
        console.log("✅ [MIGRATE] Inserted default website_frontend_information record");
      }

      // Add any missing columns
      const missingCols = [];
      const checks = [
        { name: "hero_heading", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS hero_heading VARCHAR(500) DEFAULT 'Smart Living Starts Here' AFTER company_name" },
        { name: "hero_image", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS hero_image VARCHAR(500) DEFAULT '' AFTER hero_heading" },
        { name: "company_tagline", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_tagline VARCHAR(500) DEFAULT '' AFTER company_name" },
        { name: "company_description", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_description TEXT DEFAULT '' AFTER company_tagline" },
        { name: "company_logo", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_logo VARCHAR(500) DEFAULT '' AFTER company_description" },
        { name: "company_favicon", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_favicon VARCHAR(500) DEFAULT '' AFTER company_logo" },
        { name: "company_email", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_email VARCHAR(200) DEFAULT '' AFTER company_favicon" },
        { name: "company_phone", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50) DEFAULT '' AFTER company_email" },
        { name: "company_whatsapp", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_whatsapp VARCHAR(50) DEFAULT '' AFTER company_phone" },
        { name: "company_address", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_address TEXT DEFAULT '' AFTER company_whatsapp" },
        { name: "city", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT '' AFTER company_address" },
        { name: "state", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT '' AFTER city" },
        { name: "country", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT '' AFTER state" },
        { name: "postal_code", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) DEFAULT '' AFTER country" },
        { name: "google_maps_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS google_maps_url TEXT DEFAULT '' AFTER postal_code" },
        { name: "support_email", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS support_email VARCHAR(200) DEFAULT '' AFTER google_maps_link" },
        { name: "sales_email", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS sales_email VARCHAR(200) DEFAULT '' AFTER support_email" },
        { name: "website_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS website_url VARCHAR(500) DEFAULT '' AFTER sales_email" },
        { name: "facebook_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500) DEFAULT '' AFTER website_url" },
        { name: "instagram_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500) DEFAULT '' AFTER facebook_url" },
        { name: "linkedin_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500) DEFAULT '' AFTER instagram_url" },
        { name: "youtube_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500) DEFAULT '' AFTER linkedin_url" },
        { name: "twitter_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500) DEFAULT '' AFTER youtube_url" },
        { name: "copyright_text", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS copyright_text VARCHAR(500) DEFAULT '' AFTER twitter_url" },
        { name: "footer_about", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS footer_about TEXT DEFAULT '' AFTER copyright_text" },
        { name: "business_hours", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS business_hours VARCHAR(500) DEFAULT '' AFTER footer_about" },
        { name: "privacy_policy_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS privacy_policy_url VARCHAR(500) DEFAULT '' AFTER business_hours" },
        { name: "terms_conditions_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS terms_conditions_url VARCHAR(500) DEFAULT '' AFTER privacy_policy_url" },
        { name: "refund_policy_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS refund_policy_url VARCHAR(500) DEFAULT '' AFTER terms_url" },
        { name: "shipping_policy_url", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS shipping_policy_url VARCHAR(500) DEFAULT '' AFTER refund_policy_url" },
        { name: "hero_heading_hi", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS hero_heading_hi VARCHAR(500) DEFAULT '' AFTER hero_heading" },
        { name: "hero_heading_mr", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS hero_heading_mr VARCHAR(500) DEFAULT '' AFTER hero_heading_hi" },
        { name: "company_tagline_hi", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_tagline_hi VARCHAR(500) DEFAULT '' AFTER company_tagline" },
        { name: "company_tagline_mr", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_tagline_mr VARCHAR(500) DEFAULT '' AFTER company_tagline_hi" },
        { name: "company_description_hi", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_description_hi TEXT DEFAULT '' AFTER company_description" },
        { name: "company_description_mr", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS company_description_mr TEXT DEFAULT '' AFTER company_description_hi" },
        { name: "footer_about_hi", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS footer_about_hi TEXT DEFAULT '' AFTER footer_about" },
        { name: "footer_about_mr", sql: "ALTER TABLE website_frontend_information ADD COLUMN IF NOT EXISTS footer_about_mr TEXT DEFAULT '' AFTER footer_about_hi" },
      ];
      for (const col of checks) {
        try {
          const [exists] = await query(`SHOW COLUMNS FROM website_frontend_information LIKE '${col.name}'`);
          if (!exists) {
            await query(col.sql);
            missingCols.push(col.name);
          }
        } catch (err) {
          // ignore
        }
      }
      if (missingCols.length) {
        console.log(`✅ [MIGRATE] Added missing website_frontend_information columns: ${missingCols.join(", ")}`);
      }
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure website_frontend_information table:", error.message);
  }
};

const ensureOffersTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'discounts'");
    if (!tables.length) {
      console.log("[MIGRATE] Creating discounts table for offers...");
      await query(`
        CREATE TABLE discounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          type ENUM('percentage','fixed','bogo') NOT NULL DEFAULT 'percentage',
          value DECIMAL(10,2) NOT NULL,
          product_id INT NULL,
          min_order_value DECIMAL(10,2) NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          starts_at DATETIME NULL,
          expires_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
          INDEX idx_discounts_active_dates (is_active, starts_at, expires_at),
          INDEX idx_discounts_product (product_id)
        )
      `);
      console.log("✅ [MIGRATE] discounts offer table ready");
      return;
    }

    const checks = [
      { name: "name", sql: "ALTER TABLE discounts ADD COLUMN name VARCHAR(200) NOT NULL AFTER id" },
      { name: "title", sql: "ALTER TABLE discounts ADD COLUMN title VARCHAR(200) NULL AFTER name" },
      { name: "description", sql: "ALTER TABLE discounts ADD COLUMN description TEXT NULL AFTER title" },
      { name: "type", sql: "ALTER TABLE discounts ADD COLUMN type ENUM('percentage','fixed','bogo') NOT NULL DEFAULT 'percentage' AFTER description" },
      { name: "value", sql: "ALTER TABLE discounts ADD COLUMN value DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER type" },
      { name: "apply_to", sql: "ALTER TABLE discounts ADD COLUMN apply_to ENUM('all','selected_products','selected_category') NOT NULL DEFAULT 'all' AFTER value" },
      { name: "product_id", sql: "ALTER TABLE discounts ADD COLUMN product_id INT NULL AFTER apply_to" },
      { name: "min_order_value", sql: "ALTER TABLE discounts ADD COLUMN min_order_value DECIMAL(10,2) NULL AFTER product_id" },
      { name: "maximum_discount", sql: "ALTER TABLE discounts ADD COLUMN maximum_discount DECIMAL(10,2) NULL AFTER min_order_value" },
      { name: "banner_image", sql: "ALTER TABLE discounts ADD COLUMN banner_image VARCHAR(500) NULL AFTER maximum_discount" },
      { name: "alt_text", sql: "ALTER TABLE discounts ADD COLUMN alt_text VARCHAR(255) NULL AFTER banner_image" },
      { name: "cta_text", sql: "ALTER TABLE discounts ADD COLUMN cta_text VARCHAR(100) NULL AFTER alt_text" },
      { name: "cta_type", sql: "ALTER TABLE discounts ADD COLUMN cta_type ENUM('product','category','offers','custom') NOT NULL DEFAULT 'offers' AFTER cta_text" },
      { name: "cta_target", sql: "ALTER TABLE discounts ADD COLUMN cta_target VARCHAR(500) NULL AFTER cta_type" },
      { name: "display_order", sql: "ALTER TABLE discounts ADD COLUMN display_order INT NOT NULL DEFAULT 0 AFTER cta_target" },
      { name: "is_active", sql: "ALTER TABLE discounts ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER display_order" },
      { name: "starts_at", sql: "ALTER TABLE discounts ADD COLUMN starts_at DATETIME NULL AFTER is_active" },
      { name: "expires_at", sql: "ALTER TABLE discounts ADD COLUMN expires_at DATETIME NULL AFTER starts_at" },
      { name: "created_at", sql: "ALTER TABLE discounts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER expires_at" },
      { name: "updated_at", sql: "ALTER TABLE discounts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at" },
      { name: "title_hi", sql: "ALTER TABLE discounts ADD COLUMN IF NOT EXISTS title_hi VARCHAR(200) NULL AFTER title" },
      { name: "title_mr", sql: "ALTER TABLE discounts ADD COLUMN IF NOT EXISTS title_mr VARCHAR(200) NULL AFTER title_hi" },
      { name: "description_hi", sql: "ALTER TABLE discounts ADD COLUMN IF NOT EXISTS description_hi TEXT NULL AFTER description" },
      { name: "description_mr", sql: "ALTER TABLE discounts ADD COLUMN IF NOT EXISTS description_mr TEXT NULL AFTER description_hi" },
    ];

    const added = [];
    for (const column of checks) {
      const [exists] = await query(`SHOW COLUMNS FROM discounts LIKE '${column.name}'`);
      if (!exists) {
        await query(column.sql);
        added.push(column.name);
      }
    }

    if (added.length) {
      console.log(`✅ [MIGRATE] Added missing discounts columns: ${added.join(", ")}`);
    } else {
      console.log("✅ [MIGRATE] discounts offer table exists");
    }

    const offerProductsTable = await query("SHOW TABLES LIKE 'offer_products'");
    if (!offerProductsTable.length) {
      await query(`
        CREATE TABLE offer_products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          offer_id INT NOT NULL,
          product_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (offer_id) REFERENCES discounts(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE KEY unique_offer_product (offer_id, product_id)
        )
      `);
      console.log("✅ [MIGRATE] Created offer_products table");
    }

    const offerCategoriesTable = await query("SHOW TABLES LIKE 'offer_categories'");
    if (!offerCategoriesTable.length) {
      await query(`
        CREATE TABLE offer_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          offer_id INT NOT NULL,
          category_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (offer_id) REFERENCES discounts(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE,
          UNIQUE KEY unique_offer_category (offer_id, category_id)
        )
      `);
      console.log("✅ [MIGRATE] Created offer_categories table");
    }

  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure discounts offer table:", error.message);
  }
};

// The `system_settings` table already exists in this project (key/value store
// with category + encrypted-type support). It is reused here — no duplicate
// settings system is created. See `backend/src/config/settingsService.js` for
// the runtime layer.
const ensureSystemSettingsTable = async () => {
  try {
    const env = require("./env");
    const settingsService = require("./settingsService");

    const tables = await query("SHOW TABLES LIKE 'system_settings'");
    if (!tables.length) {
      console.log("[MIGRATE] Creating system_settings table...");
      await query(`
        CREATE TABLE system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(100) NOT NULL,
          setting_value LONGTEXT NULL,
          setting_type ENUM('string','text','number','boolean','json','encrypted') NOT NULL DEFAULT 'string',
          category VARCHAR(50) NULL,
          is_encrypted TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY setting_key (setting_key),
          INDEX idx_settings_key (setting_key),
          INDEX idx_settings_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log("✅ [MIGRATE] Created system_settings table");
    } else {
      console.log("✅ [MIGRATE] system_settings table exists (reused)");
    }

    // Seed dynamic settings from the current .env VALUES so existing
    // configuration is preserved. INSERT IGNORE means rows already in the
    // database are never overwritten at boot — the database is the source of
    // truth once seeded (see settingsService for the precedence model).
    const envSmtpPort =
      Number(env.smtp.port || 0) || (env.smtp.host ? 465 : 465);
    const envSecure =
      typeof env.smtp.secure === "boolean"
        ? String(env.smtp.secure)
        : String(envSmtpPort === 465);

    const seeds = [
      { key: "smtp.host", value: String(env.smtp.host || "smtp.gmail.com").trim(), type: "string", category: "email" },
      { key: "smtp.port", value: String(envSmtpPort), type: "number", category: "email" },
      { key: "smtp.user", value: String(env.smtp.user || "").trim(), type: "string", category: "email" },
      {
        key: "smtp.pass",
        value: env.smtp.pass ? settingsService.encryptSecret(env.smtp.pass) : "",
        type: "encrypted",
        category: "email",
        encrypted: 1,
      },
      { key: "smtp.from", value: String(env.smtp.from || "").trim(), type: "string", category: "email" },
      { key: "smtp.secure", value: envSecure, type: "boolean", category: "email" },
      { key: "smtp.tlsRejectUnauthorized", value: String(env.smtp.tlsRejectUnauthorized !== false), type: "boolean", category: "email" },
      { key: "smtp.allowSelfSignedFallback", value: String(Boolean(env.smtp.allowSelfSignedFallback)), type: "boolean", category: "email" },
      { key: "jwt.expiresIn", value: String(env.jwtExpiresIn || "1d").trim(), type: "string", category: "security" },
      { key: "payment.razorpayKeyId", value: String(env.razorpay.keyId || "").trim(), type: "string", category: "payment" },
      {
        key: "payment.razorpayKeySecret",
        value: env.razorpay.keySecret ? settingsService.encryptSecret(env.razorpay.keySecret) : "",
        type: "encrypted",
        category: "payment",
        encrypted: 1,
      },
      {
        key: "emailValidation.abstractApiKey",
        value: process.env.ABSTRACT_EMAIL_API_KEY
          ? settingsService.encryptSecret(process.env.ABSTRACT_EMAIL_API_KEY)
          : "",
        type: "encrypted",
        category: "emailvalidation",
        encrypted: 1,
      },
    ];

    let seeded = 0;
    for (const seed of seeds) {
      const result = await query(
        `INSERT IGNORE INTO system_settings
          (setting_key, setting_value, setting_type, category, is_encrypted)
         VALUES (?, ?, ?, ?, ?)`,
        [
          seed.key,
          seed.value,
          seed.type,
          seed.category,
          seed.encrypted ? 1 : 0,
        ]
      );
      if (result.affectedRows > 0) seeded += 1;
    }
    if (seeded > 0) {
      console.log(
        `✅ [MIGRATE] Seeded ${seeded} system settings from .env defaults`
      );
    }

    await settingsService.invalidateCache();
  } catch (error) {
    console.warn(
      "⚠️ [MIGRATE] Could not ensure system_settings table:",
      error.message
    );
  }
};

const ensureWishlistTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'wishlist'");
    if (!tables.length) {
      await query(`
        CREATE TABLE wishlist (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_product (user_id, product_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          INDEX idx_wishlist_user (user_id)
        )
      `);
      console.log("✅ [MIGRATE] Created wishlist table");
    } else {
      console.log("✅ [MIGRATE] wishlist table exists");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure wishlist table:", error.message);
  }
};

const ensureNotificationsTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'notifications'");
    if (!tables.length) {
      await query(`
        CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          data JSON NULL,
          action_url VARCHAR(500) NULL,
          event_key VARCHAR(150) NULL,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          read_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_notification_event (user_id, event_key),
          INDEX idx_notifications_user (user_id),
          INDEX idx_notifications_read (is_read),
          INDEX idx_notifications_created (created_at),
          INDEX idx_notifications_user_read (user_id, is_read),
          INDEX idx_notifications_user_created (user_id, created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log("✅ [MIGRATE] Created notifications table");
    } else {
      console.log("✅ [MIGRATE] notifications table exists");
      const columns = [
        ["priority", "ENUM('LOW','NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL' AFTER event_key"],
        ["entity_type", "VARCHAR(50) NULL AFTER priority"],
        ["entity_id", "INT NULL AFTER entity_type"],
      ];
      for (const [name, definition] of columns) {
        const [column] = await query(`SHOW COLUMNS FROM notifications LIKE '${name}'`);
        if (!column) await query(`ALTER TABLE notifications ADD COLUMN ${name} ${definition}`);
      }
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure notifications table:", error.message);
  }
};

const ensureRecentlyViewedTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'recently_viewed_products'");
    if (!tables.length) {
      await query(`
        CREATE TABLE recently_viewed_products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_recently_viewed_user_product (user_id, product_id),
          INDEX idx_recently_viewed_user (user_id),
          INDEX idx_recently_viewed_product (product_id),
          INDEX idx_recently_viewed_viewed_at (viewed_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `);
      console.log("✅ [MIGRATE] Created recently_viewed_products table");
    } else {
      console.log("✅ [MIGRATE] recently_viewed_products table exists");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure recently viewed table:", error.message);
  }
};

const ensureProductPriceHistoryTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'product_price_history'");
    if (!tables.length) {
      await query(`CREATE TABLE product_price_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        old_price DECIMAL(10,2) NULL,
        new_price DECIMAL(10,2) NOT NULL,
        old_sale_price DECIMAL(10,2) NULL,
        new_sale_price DECIMAL(10,2) NULL,
        change_type ENUM('PRICE_INCREASE','PRICE_DECREASE','SALE_PRICE_CREATED','SALE_PRICE_UPDATED','SALE_PRICE_REMOVED','NO_CHANGE') NOT NULL DEFAULT 'NO_CHANGE',
        drop_percentage DECIMAL(5,2) NULL,
        changed_by INT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_price_history_product (product_id),
        INDEX idx_price_history_created (created_at),
        INDEX idx_price_history_type (change_type)
      )`);
      console.log("✅ [MIGRATE] Created product_price_history table");
    } else {
      console.log("✅ [MIGRATE] product_price_history table exists");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure product price history table:", error.message);
  }
};

const ensureBackInStockTables = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'back_in_stock_alerts'");
    if (!tables.length) {
      await query(`CREATE TABLE back_in_stock_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT NULL,
        status ENUM('ACTIVE','NOTIFIED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
        notified_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_bis_user_product (user_id, product_id),
        INDEX idx_bis_product_status (product_id, status),
        INDEX idx_bis_status (status),
        INDEX idx_bis_notified_at (notified_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`);
      console.log("✅ [MIGRATE] Created back_in_stock_alerts table");
    } else console.log("✅ [MIGRATE] back_in_stock_alerts table exists");
  } catch (error) { console.warn("⚠️ [MIGRATE] Could not ensure back-in-stock alerts table:", error.message); }
};

const ensureCouponTables = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'coupons'");
    if (!tables.length) {
      console.log("[MIGRATE] Creating coupons table...");
      await query(`
        CREATE TABLE IF NOT EXISTS coupons (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(50) NOT NULL,
          description TEXT NULL,
          discount_type ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
          discount_value DECIMAL(10,2) NOT NULL,
          max_discount DECIMAL(10,2) NULL,
          minimum_order_value DECIMAL(10,2) NULL DEFAULT 0.00,
          start_date DATETIME NULL,
          expiry_date DATETIME NULL,
          usage_limit INT NULL,
          used_count INT NOT NULL DEFAULT 0,
          per_user_limit INT NOT NULL DEFAULT 1,
          first_order_only TINYINT(1) NOT NULL DEFAULT 0,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          free_shipping TINYINT(1) NOT NULL DEFAULT 0,
          created_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_coupons_code (code),
          CONSTRAINT chk_coupons_discount_value CHECK (discount_value >= 0),
          CONSTRAINT chk_coupons_max_discount CHECK (max_discount IS NULL OR max_discount >= 0),
          CONSTRAINT chk_coupons_minimum_order CHECK (minimum_order_value IS NULL OR minimum_order_value >= 0),
          CONSTRAINT chk_coupons_usage_limit CHECK (usage_limit IS NULL OR usage_limit >= 0),
          CONSTRAINT chk_coupons_used_count CHECK (used_count >= 0),
          CONSTRAINT chk_coupons_per_user_limit CHECK (per_user_limit >= 0),
          CONSTRAINT chk_coupons_dates CHECK (expiry_date IS NULL OR start_date IS NULL OR expiry_date >= start_date),
          INDEX idx_coupons_code (code),
          INDEX idx_coupons_active_dates (is_active, start_date, expiry_date),
          INDEX idx_coupons_created_by (created_by),
          FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log("✅ [MIGRATE] Created coupons table");
    } else {
      console.log("✅ [MIGRATE] coupons table exists");
    }

    const usageTables = await query("SHOW TABLES LIKE 'coupon_usage'");
    if (!usageTables.length) {
      console.log("[MIGRATE] Creating coupon_usage table...");
      await query(`
        CREATE TABLE IF NOT EXISTS coupon_usage (
          id INT AUTO_INCREMENT PRIMARY KEY,
          coupon_id INT NOT NULL,
          user_id INT NULL,
          order_id INT NULL,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT chk_coupon_usage_discount CHECK (discount_amount >= 0),
          INDEX idx_coupon_usage_coupon_user (coupon_id, user_id),
          INDEX idx_coupon_usage_coupon (coupon_id),
          INDEX idx_coupon_usage_user (user_id),
          INDEX idx_coupon_usage_order (order_id),
          FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log("✅ [MIGRATE] Created coupon_usage table");
    } else {
      console.log("✅ [MIGRATE] coupon_usage table exists");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure coupon tables:", error.message);
  }
};

const ensureAdminActivityTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'admin_activity_logs'");
    if (!tables.length) {
      await query(`CREATE TABLE admin_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        activity_type VARCHAR(60) NOT NULL,
        entity_type VARCHAR(50) NULL,
        entity_id INT NULL,
        metadata JSON NULL,
        priority ENUM('LOW','NORMAL','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
        is_actionable BOOLEAN NOT NULL DEFAULT FALSE,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at DATETIME NULL,
        event_key VARCHAR(180) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_activity_event (event_key),
        INDEX idx_activity_type (activity_type), INDEX idx_activity_user (user_id),
        INDEX idx_activity_priority (priority), INDEX idx_activity_read (is_read),
        INDEX idx_activity_created (created_at), INDEX idx_activity_user_created (user_id, created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )`);
      console.log("✅ [MIGRATE] Created admin_activity_logs table");
    } else console.log("✅ [MIGRATE] admin_activity_logs table exists");
  } catch (error) { console.warn("⚠️ [MIGRATE] Could not ensure admin activity table:", error.message); }
};

const ensureEmailSendLogsTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'email_send_logs'");
    if (!tables.length) {
      await query(`CREATE TABLE email_send_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email_key VARCHAR(255) NOT NULL,
        template_key VARCHAR(100) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        event_signature JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_email_send_key (email_key),
        INDEX idx_email_send_template (template_key),
        INDEX idx_email_send_recipient (recipient),
        INDEX idx_email_send_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log("✅ [MIGRATE] Created email_send_logs table");
    } else {
      console.log("✅ [MIGRATE] email_send_logs table exists");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure email_send_logs table:", error.message);
  }
};

const ensureOrderReturnsTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'order_returns'");
    if (!tables.length) {
      await query(`CREATE TABLE order_returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        user_id INT NOT NULL,
        order_number VARCHAR(100) NOT NULL,
        reason VARCHAR(255) NOT NULL DEFAULT '',
        details TEXT NULL,
        requested_amount DECIMAL(10,2) NULL,
        approved_amount DECIMAL(10,2) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        admin_notes VARCHAR(500) NULL,
        rejection_reason TEXT NULL,
        refund_status VARCHAR(50) NULL,
        refund_reference VARCHAR(255) NULL,
        refund_initiated_at DATETIME NULL,
        refund_completed_at DATETIME NULL,
        processed_by VARCHAR(100) NULL,
        timeline JSON NULL,
        refund_method VARCHAR(20) NULL,
        upi_id VARCHAR(100) NULL,
        account_holder_name VARCHAR(150) NULL,
        account_number VARCHAR(50) NULL,
        ifsc_code VARCHAR(20) NULL,
        bank_name VARCHAR(100) NULL,
        refund_details_submitted_at DATETIME NULL,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_return_order (order_id),
        INDEX idx_return_user (user_id),
        INDEX idx_return_status (status),
        INDEX idx_return_refund_status (refund_status),
        CONSTRAINT fk_return_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_return_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log("✅ [MIGRATE] Created order_returns table");
    } else {
      console.log("✅ [MIGRATE] order_returns table exists");
      const columns = [
        ["requested_amount", "DECIMAL(10,2) NULL AFTER details"],
        ["approved_amount", "DECIMAL(10,2) NULL AFTER requested_amount"],
        ["request_type", "VARCHAR(20) NOT NULL DEFAULT 'return' AFTER approved_amount"],
        ["rejection_reason", "TEXT NULL AFTER admin_notes"],
        ["refund_status", "VARCHAR(50) NULL AFTER status"],
        ["refund_reference", "VARCHAR(255) NULL AFTER refund_status"],
        ["refund_initiated_at", "DATETIME NULL AFTER refund_reference"],
        ["refund_completed_at", "DATETIME NULL AFTER refund_initiated_at"],
        ["processed_by", "VARCHAR(100) NULL AFTER refund_completed_at"],
        ["timeline", "JSON NULL AFTER processed_by"],
        ["refund_method", "VARCHAR(20) NULL AFTER timeline"],
        ["upi_id", "VARCHAR(100) NULL AFTER refund_method"],
        ["account_holder_name", "VARCHAR(150) NULL AFTER upi_id"],
        ["account_number", "VARCHAR(50) NULL AFTER account_holder_name"],
        ["ifsc_code", "VARCHAR(20) NULL AFTER account_number"],
        ["bank_name", "VARCHAR(100) NULL AFTER ifsc_code"],
        ["refund_details_submitted_at", "DATETIME NULL AFTER bank_name"],
      ];
      for (const [name, definition] of columns) {
        const [column] = await query(`SHOW COLUMNS FROM order_returns LIKE '${name}'`);
        if (!column) {
          await query(`ALTER TABLE order_returns ADD COLUMN ${name} ${definition}`);
          console.log(`✅ [MIGRATE] Added order_returns.${name}`);
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure order_returns table:", error.message);
  }
};

/**
 * Standalone storage for the Admin "Custom Email" feature.
 * Completely separate from the automated email_templates table — the custom
 * email feature is manual only and never touches automated template records.
 */
const ensureCustomEmailTables = async () => {
  try {
    const templates = await query("SHOW TABLES LIKE 'custom_email_templates'");
    if (!templates.length) {
      await query(`CREATE TABLE custom_email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        template_name VARCHAR(200) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cet_created_by (created_by),
        INDEX idx_cet_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log("✅ [MIGRATE] Created custom_email_templates table");
    } else {
      console.log("✅ [MIGRATE] custom_email_templates table exists");
    }

    const history = await query("SHOW TABLES LIKE 'custom_email_history'");
    if (!history.length) {
      await query(`CREATE TABLE custom_email_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        recipient_name VARCHAR(200) NULL,
        sent_by_admin INT NULL,
        sent_by_email VARCHAR(255) NULL,
        status ENUM('sent','failed') NOT NULL DEFAULT 'sent',
        error_message VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ceh_recipient (recipient_email),
        INDEX idx_ceh_sent_by (sent_by_admin),
        INDEX idx_ceh_status (status),
        INDEX idx_ceh_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log("✅ [MIGRATE] Created custom_email_history table");
    } else {
      console.log("✅ [MIGRATE] custom_email_history table exists");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure custom email tables:", error.message);
  }
};

/**
 * Abandoned Cart / Recovery tables + default settings.
 * - recovery_records  : one row per tracked activity (user + activity_type + reference_id).
 * - recovery_reminders: reminder history rows linked to a recovery record.
 * Settings are seeded into system_settings with INSERT IGNORE so admin-edited
 * values are never overwritten on restart; they are configurable from Admin →
 * Abandoned Cart → Settings.
 */
const ensureRecoveryTables = async () => {
  try {
    const recordsTable = await query("SHOW TABLES LIKE 'recovery_records'");
    if (!recordsTable.length) {
      await query(`CREATE TABLE recovery_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        activity_type VARCHAR(50) NOT NULL DEFAULT 'CART',
        reference_id VARCHAR(100) NOT NULL DEFAULT '',
        started_at DATETIME NOT NULL,
        last_activity_at DATETIME NOT NULL,
        abandoned_at DATETIME NULL,
        status ENUM('abandoned','reminder_sent','recovered','not_recovered','recovered_late') NOT NULL DEFAULT 'abandoned',
        value DECIMAL(12,2) NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        item_count INT NOT NULL DEFAULT 0,
        product_snapshot JSON NULL,
        reminder_count INT NOT NULL DEFAULT 0,
        cycle_count INT NOT NULL DEFAULT 1,
        recovery_deadline DATETIME NULL,
        recovered_at DATETIME NULL,
        recovery_value DECIMAL(12,2) NULL,
        completion_reference VARCHAR(120) NULL,
        completion_details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_recovery_activity (user_id, activity_type, reference_id),
        INDEX idx_recovery_status (status),
        INDEX idx_recovery_activity_type (activity_type),
        INDEX idx_recovery_abandoned (abandoned_at),
        INDEX idx_recovery_deadline (recovery_deadline),
        INDEX idx_recovery_user (user_id),
        CONSTRAINT fk_recovery_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log("✅ [MIGRATE] Created recovery_records table");
    } else {
      console.log("✅ [MIGRATE] recovery_records table exists");
    }

    // Upgrade existing tables with the `recovered_late` lifecycle status.
    // Idempotent: only alters when the enum is missing the new value.
    try {
      const [statusCol] = await query(
        "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recovery_records' AND COLUMN_NAME = 'status'"
      );
      const colType = String(statusCol?.COLUMN_TYPE || "");
      if (colType.indexOf("recovered_late") === -1) {
        await query(
          "ALTER TABLE recovery_records MODIFY COLUMN status ENUM('abandoned','reminder_sent','recovered','not_recovered','recovered_late') NOT NULL DEFAULT 'abandoned'"
        );
        console.log("✅ [MIGRATE] recovery_records.status upgraded to include recovered_late");
      }
    } catch (err) {
      console.warn("⚠️ [MIGRATE] Could not verify recovery status enum:", err.message);
    }

    const remindersTable = await query("SHOW TABLES LIKE 'recovery_reminders'");
    if (!remindersTable.length) {
      await query(`CREATE TABLE recovery_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recovery_record_id INT NOT NULL,
        reminder_number INT NOT NULL,
        scheduled_at DATETIME NULL,
        sent_at DATETIME NULL,
        status ENUM('scheduled','sent','skipped','failed','cancelled') NOT NULL DEFAULT 'scheduled',
        template_key VARCHAR(100) NULL,
        error_message VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_recovery_reminder_number (recovery_record_id, reminder_number),
        INDEX idx_recovery_reminder_record (recovery_record_id),
        CONSTRAINT fk_recovery_reminder FOREIGN KEY (recovery_record_id) REFERENCES recovery_records(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log("✅ [MIGRATE] Created recovery_reminders table");
    } else {
      console.log("✅ [MIGRATE] recovery_reminders table exists");
    }

    // Default recovery settings (INSERT IGNORE — never overwrite admin values).
    const defaultSettings = [
      { key: "abandonedCart.enabled", value: "true", type: "boolean", category: "abandoned_cart" },
      { key: "abandonedCart.thresholdMinutes", value: "60", type: "number", category: "abandoned_cart" },
      { key: "abandonedCart.firstReminderHours", value: "2", type: "number", category: "abandoned_cart" },
      { key: "abandonedCart.secondReminderHours", value: "24", type: "number", category: "abandoned_cart" },
      { key: "abandonedCart.maxReminders", value: "2", type: "number", category: "abandoned_cart" },
      { key: "abandonedCart.recoveryWindowHours", value: "24", type: "number", category: "abandoned_cart" },
      { key: "abandonedCart.stopRemindersOnRecovery", value: "true", type: "boolean", category: "abandoned_cart" },
    ];
    for (const seed of defaultSettings) {
      await query(
        `INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, is_encrypted)
         VALUES (?, ?, ?, ?, 0)`,
        [seed.key, seed.value, seed.type, seed.category]
      );
    }
    try {
      const settingsService = require("./settingsService");
      await settingsService.invalidateCache();
    } catch (err) {
      console.warn("⚠️ [MIGRATE] Could not refresh settings cache:", err.message);
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure recovery tables:", error.message);
  }
};

/**
 * Fills per-language columns with translations for the known English base
 * values (idempotent: only touches rows whose localized cells are empty).
 */
const HERO_HI = "हर स्थान के लिए स्मार्ट ऑटोमेशन";
const HERO_MR = "प्रत्येक ठिकाणासाठी स्मार्ट ऑटोमेशन";
const COMPANY_DESC_HI = "Teknode IoT उपकरण खरीदने के लिए सबसे अच्छी वेबसाइट है";
const COMPANY_DESC_MR = "Teknode ही IoT उपकरणे खरेदी करण्यासाठी सर्वोत्तम वेबसाइट आहे";
const TAGLINE_HI = "स्मार्ट जीवन, स्मार्ट घर";
const TAGLINE_MR = "स्मार्ट जीवन, स्मार्ट घर";

const CATEGORY_TRANSLATIONS = {
  "DIGITAL LOCK": {
    hi: ["डिजिटल लॉक", "अपने घर को पिन, फिंगरप्रिंट और रिमोट एक्सेस से सुरक्षित करें"],
    mr: ["डिजिटल लॉक", "पिन, फिंगरप्रिंट आणि रिमोट अॅक्सेससह तुमचे घर सुरक्षित करा"],
  },
  "GLASS PANEL SWITCH": {
    hi: ["ग्लास पैनल स्विच", "स्टाइलिश ग्लास पैनल से अपने स्मार्ट डिवाइस नियंत्रित करें"],
    mr: ["ग्लास पॅनेल स्विच", "स्टायलिश ग्लास पॅनेलने तुमची स्मार्ट उपकरणे नियंत्रित करा"],
  },
  "SMART CAMERA": {
    hi: ["स्मार्ट कैमरा", "लाइव व्यू और मोशन अलर्ट के साथ अपने घर की निगरानी करें"],
    mr: ["स्मार्ट कॅमेरा", "लाइव व्यू आणि मोशन अलर्टसह तुमच्या घरावर लक्ष ठेवा"],
  },
  "SMART DIMMER": {
    hi: ["स्मार्ट डिमर", "अपनी पसंद के अनुसार लाइट की चमक समायोजित करें"],
    mr: ["स्मार्ट डिमर", "तुमच्या आवडीनुसार दिव्यांची चमक समायोजित करा"],
  },
  "SMART GATEWAY": {
    hi: ["स्मार्ट गेटवे", "सभी स्मार्ट डिवाइस को जोड़ने वाला केंद्र"],
    mr: ["स्मार्ट गेटवे", "सर्व स्मार्ट उपकरणे जोडणारे केंद्र"],
  },
  "SMART HUB": {
    hi: ["स्मार्ट हब", "सभी IoT उपकरणों का एक ही स्थान पर नियंत्रण"],
    mr: ["स्मार्ट हब", "सर्व IoT उपकरणांवर एकाच ठिकाणाहून नियंत्रण"],
  },
  "SMART KNOB": {
    hi: ["स्मार्ट नॉब", "एक घुमाव से कई डिवाइस नियंत्रित करें"],
    mr: ["स्मार्ट नॉब", "एका वळणाने अनेक उपकरणे नियंत्रित करा"],
  },
  "SMART NODE": {
    hi: ["स्मार्ट नोड", "रिले स्विचिंग के लिए कॉम्पैक्ट स्मार्ट मॉड्यूल"],
    mr: ["स्मार्ट नोड", "रिले स्विचिंगसाठी कॉम्पॅक्ट स्मार्ट मॉड्यूल"],
  },
  "SWITCH": {
    hi: ["स्मार्ट स्विच", "सभी लाइट और उपकरणों के लिए स्मार्ट स्विच"],
    mr: ["स्मार्ट स्विच", "सर्व दिवे आणि उपकरणांसाठी स्मार्ट स्विच"],
  },
  "SMART SENSOR": {
    hi: ["स्मार्ट सेंसर", "गति और पर्यावरणीय गतिविधि पर नज़र रखें"],
    mr: ["स्मार्ट सेन्सर", "हालचाल आणि पर्यावरणीय क्रियाकलापांवर लक्ष ठेवा"],
  },
};

const OFFER_TRANSLATIONS = [
  { match: "10% OFF sitewide", hiT: "साइटवाइड 10% छूट", mrT: "साइटवाइड 10% सूट", hiD: "अपने ऑर्डर पर ₹500 तक 10% छूट पाएं।", mrD: "तुमच्या ऑर्डरवर ₹500 पर्यंत 10% सूट मिळवा." },
  { match: "₹200 OFF on orders above ₹1499", hiT: "₹1499 से अधिक के ऑर्डर पर ₹200 छूट", mrT: "₹1499 पेक्षा जास्त ऑर्डरवर ₹200 सूट", hiD: "₹1499 से अधिक के ऑर्डर पर ₹200 फ्लैट छूट।", mrD: "₹1499 पेक्षा जास्त ऑर्डरवर ₹200 फ्लॅट सूट." },
  { match: "🔥 Smart Home Fest — 20% OFF", hiT: "🔥 स्मार्ट होम फेस्ट — 20% छूट", mrT: "🔥 स्मार्ट होम फेस्ट — 20% सूट", hiD: "सभी स्मार्ट होम उपकरणों पर 20% छूट।", mrD: "सर्व स्मार्ट होम उपकरणांवर 20% सूट." },
  { match: "🎁 Welcome 50 — 50% OFF first purchase", hiT: "🎁 वेलकम 50 — पहली खरीद पर 50% छूट", mrT: "🎁 वेलकम 50 — पहिल्या खरेदीवर 50% सूट", hiD: "अपनी पहली खरीद पर 50% तक की छूट।", mrD: "तुमच्या पहिल्या खरेदीवर 50% पर्यंत सूट." },
  { match: "Future offer", hiT: "भविष्य की पेशकश", mrT: "भविष्यातील ऑफर", hiD: "जल्द आ रहा है।", mrD: "लवकरच येत आहे." },
];

const seedLocalizedContent = async () => {
  try {
    // Settings
    const [settings] = await query("SELECT * FROM website_frontend_information WHERE id = 1");
    if (settings) {
      const updates = [];
      const patch = (col, val) => {
        if (val && isEmpty(settings[col])) updates.push([col, val]);
      };
      patch("hero_heading_hi", HERO_HI);
      patch("hero_heading_mr", HERO_MR);
      patch("company_description_hi", COMPANY_DESC_HI);
      patch("company_description_mr", COMPANY_DESC_MR);
      patch("footer_about_hi", COMPANY_DESC_HI);
      patch("footer_about_mr", COMPANY_DESC_MR);
      patch("company_tagline_hi", TAGLINE_HI);
      patch("company_tagline_mr", TAGLINE_MR);
      for (const [col, val] of updates) {
        await query(`UPDATE website_frontend_information SET \`${col}\` = ? WHERE id = 1`, [val]);
        console.log(`✅ [MIGRATE] Set settings.${col}`);
      }
    }

    // Categories
    const categories = await query("SELECT id, name, name_hi, name_mr FROM product_categories");
    for (const cat of categories) {
      const tr = CATEGORY_TRANSLATIONS[String(cat.name || "").trim().toUpperCase()];
      if (!tr) continue;
      const updates = [];
      const patch = (col, val) => { if (val && isEmpty(cat[col])) updates.push([col, val]); };
      patch("name_hi", tr.hi[0]);
      patch("name_mr", tr.mr[0]);
      patch("description_hi", tr.hi[1]);
      patch("description_mr", tr.mr[1]);
      for (const [col, val] of updates) {
        await query(`UPDATE product_categories SET \`${col}\` = ? WHERE id = ?`, [val, cat.id]);
        console.log(`✅ [MIGRATE] Set category #${cat.id} ${col}`);
      }
    }

    // Offers
    const offers = await query("SELECT id, title, title_hi, title_mr, description_hi, description_mr FROM discounts");
    for (const offer of offers) {
      const tr = OFFER_TRANSLATIONS.find((o) => String(offer.title || "").trim() === o.match);
      if (!tr) continue;
      const updates = [];
      const patch = (col, val) => { if (val && isEmpty(offer[col])) updates.push([col, val]); };
      patch("title_hi", tr.hiT);
      patch("title_mr", tr.mrT);
      patch("description_hi", tr.hiD);
      patch("description_mr", tr.mrD);
      for (const [col, val] of updates) {
        await query(`UPDATE discounts SET \`${col}\` = ? WHERE id = ?`, [val, offer.id]);
        console.log(`✅ [MIGRATE] Set offer #${offer.id} ${col}`);
      }
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not seed localized content:", error.message);
  }
};

const isEmpty = (v) => v == null || String(v).trim() === "";

module.exports = {
  ensureCouponTables,
  ensureRecoveryTables,
  ensureGuestOrderColumns,
  ensureOrderShippingColumns,
  ensureShippingZonesTable,
  ensureShippingMethodsTable,
  ensureProductsColumns,
  ensureUsersOtpColumns,
  ensureUsersTokenVersionColumn,
  ensureUsersLanguagePreference,
  ensureUserProfileColumns,
  ensureReviewsTable,
  ensureAdminsTable,
  ensureSmartHomeProposalsTables,
  ensureSmartHomeProposalsTable: ensureSmartHomeProposalsTables,
  ensureAdminTables,
  ensureEnquiriesTable,
  ensureWebsiteFrontendInformationTable,
  ensureOffersTable,
  ensureSystemSettingsTable,
  ensureWishlistTable,
  ensureRecentlyViewedTable,
  ensureNotificationsTable,
  ensureAdminActivityTable,
  ensureProductPriceHistoryTable,
  ensureBackInStockTables,
  ensureEmailTemplatesTable,
  ensureEmailSendLogsTable,
  ensureOrderReturnsTable,
  ensureCustomEmailTables,
  seedLocalizedContent,
};
