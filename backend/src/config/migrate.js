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
          order_id INT NOT NULL,
          user_id INT NOT NULL,
          customer_name VARCHAR(200) NULL,
          rating TINYINT(1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
          review_title VARCHAR(500) NULL,
          review_message TEXT NULL,
          review_images JSON NULL,
          review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
          admin_notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approved_at DATETIME NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_review_per_order_product (order_id, product_id),
          INDEX idx_reviews_product (product_id),
          INDEX idx_reviews_status (review_status),
          INDEX idx_reviews_user (user_id),
          INDEX idx_reviews_order (order_id)
        )
      `);
      console.log("✅ [MIGRATE] Created product_reviews table");
    } else {
      console.log("✅ [MIGRATE] product_reviews table exists");

      const missingCols = [];
      const checks = [
        { name: "customer_name", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200) NULL AFTER user_id" },
        { name: "review_images", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS review_images JSON NULL AFTER review_message" },
        { name: "review_status", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER review_images" },
        { name: "admin_notes", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL AFTER review_status" },
        { name: "approved_at", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL AFTER admin_notes" },
        { name: "updated_at", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER approved_at" },
        { name: "website_visibility", sql: "ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS website_visibility ENUM('visible','hidden') NOT NULL DEFAULT 'visible' AFTER updated_at" },
      ];

      for (const col of checks) {
        const [exists] = await query(`SHOW COLUMNS FROM product_reviews LIKE '${col.name}'`);
        if (!exists) {
          await query(col.sql);
          missingCols.push(col.name);
        }
      }

      if (missingCols.length) {
        console.log(`✅ [MIGRATE] Added missing review columns: ${missingCols.join(", ")}`);
      }

      const idxChecks = [
        { name: "idx_reviews_status", sql: "ALTER TABLE product_reviews ADD INDEX IF NOT EXISTS idx_reviews_status (review_status)" },
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

const ensureAdminTables = async () => {
  try {
    // Verify admin-related tables and migrations
    await ensureProductsColumns();
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

module.exports = {
  ensureGuestOrderColumns,
  ensureProductsColumns,
  ensureUsersOtpColumns,
  ensureReviewsTable,
  ensureAdminTables,
  ensureEnquiriesTable,
};