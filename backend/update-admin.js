const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const env = require("./src/config/env");

const BCRYPT_ROUNDS = 12;

async function updateAdmin() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });

  try {
    console.log("[UPDATE-ADMIN] Connecting to MySQL database...");

    // Check if admins table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'admins'");
    if (!tables.length) {
      console.log("[UPDATE-ADMIN] Creating admins table...");
      await connection.query(`
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
      console.log("[UPDATE-ADMIN] ✅ admins table created");
    } else {
      console.log("[UPDATE-ADMIN] ✅ admins table exists");
    }

    // New credentials
    const newEmail = "admin@teknode.com";
    const newPassword = "Admin@12345";

    // Hash the new password
    console.log("[UPDATE-ADMIN] Hashing new password...");
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Check if admin exists
    const [existing] = await connection.query(
      "SELECT id, email FROM admins WHERE email = ? LIMIT 1",
      [newEmail]
    );

    if (existing.length) {
      // Update existing admin
      console.log(`[UPDATE-ADMIN] Updating existing admin: ${newEmail}`);
      await connection.query(
        "UPDATE admins SET password = ?, email = ?, status = 'active', role = 'admin' WHERE id = ?",
        [passwordHash, newEmail, existing[0].id]
      );
      console.log(`[UPDATE-ADMIN] ✅ Admin updated successfully`);
    } else {
      // Insert new admin
      console.log(`[UPDATE-ADMIN] Creating new admin: ${newEmail}`);
      await connection.query(
        "INSERT INTO admins (email, password, role, status) VALUES (?, ?, 'admin', 'active')",
        [newEmail, passwordHash]
      );
      console.log(`[UPDATE-ADMIN] ✅ Admin created successfully`);
    }

    // Verify
    const [verify] = await connection.query(
      "SELECT id, email, role, status, created_at FROM admins WHERE email = ? LIMIT 1",
      [newEmail]
    );

    if (verify.length) {
      const admin = verify[0];
      console.log("\n[UPDATE-ADMIN] ===== VERIFICATION =====");
      console.log(`[UPDATE-ADMIN] Admin ID: ${admin.id}`);
      console.log(`[UPDATE-ADMIN] Email: ${admin.email}`);
      console.log(`[UPDATE-ADMIN] Role: ${admin.role}`);
      console.log(`[UPDATE-ADMIN] Status: ${admin.status}`);
      console.log(`[UPDATE-ADMIN] Created: ${admin.created_at}`);
      console.log("[UPDATE-ADMIN] ===========================\n");
    } else {
      console.error("[UPDATE-ADMIN] ❌ Verification failed - admin not found after update");
    }

    // Test password comparison
    console.log("[UPDATE-ADMIN] Testing password comparison...");
    const [testAdmin] = await connection.query(
      "SELECT password FROM admins WHERE email = ? LIMIT 1",
      [newEmail]
    );

    if (testAdmin.length) {
      const match = await bcrypt.compare(newPassword, testAdmin[0].password);
      console.log(`[UPDATE-ADMIN] Password test: ${match ? "✅ MATCH" : "❌ NO MATCH"}`);
      if (!match) {
        console.error("[UPDATE-ADMIN] ❌ CRITICAL: Password hash does not match!");
        process.exit(1);
      }
    }

    console.log("\n[UPDATE-ADMIN] ✅ Admin credentials updated successfully");
    console.log(`[UPDATE-ADMIN] Email: ${newEmail}`);
    console.log(`[UPDATE-ADMIN] Password: ${newPassword}`);
    console.log("\n[UPDATE-ADMIN] Next steps:");
    console.log("1. Restart the backend server (node server.js)");
    console.log("2. Go to /admin-login");
    console.log(`3. Login with: ${newEmail} / ${newPassword}`);

  } catch (error) {
    console.error("[UPDATE-ADMIN] ❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updateAdmin();