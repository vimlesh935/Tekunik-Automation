const { query } = require("./db");
const bcrypt = require("bcrypt");

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

const ensureSystemSettingsTable = async () => {
  try {
    const tableExists = await query("SHOW TABLES LIKE 'system_settings'");
    if (!tableExists.length) {
      await query(`
        CREATE TABLE system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(191) NOT NULL UNIQUE,
          setting_value TEXT NULL,
          setting_type ENUM('string','boolean','number','json','encrypted') NOT NULL DEFAULT 'string',
          category VARCHAR(100) NOT NULL DEFAULT 'general',
          is_encrypted TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_settings_key (setting_key),
          INDEX idx_settings_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ [MIGRATE] system_settings table created");
    }
  } catch (error) {
    console.warn("⚠️ [MIGRATE] Could not ensure system_settings table:", error.message);
  }
};

module.exports = {
  ensureGuestOrderColumns,
  ensureProductsColumns,
  ensureUsersOtpColumns,
  ensureReviewsTable,
  ensureAdminsTable,
  ensureSmartHomeProposalsTables,
  ensureSmartHomeProposalsTable: ensureSmartHomeProposalsTables,
  ensureAdminTables,
  ensureEnquiriesTable,
  ensureSystemSettingsTable,
};
