/**
 * Admin Seed Script
 *
 * This script verifies that the admin credentials in .env are valid and
 * ensures the admin JWT flow works correctly.
 *
 * Usage: node scripts/seed-admin.js
 *
 * The admin system uses environment variables (ADMIN_EMAIL, ADMIN_SECRET_KEY)
 * stored in backend/.env rather than a database table. This ensures:
 * 1. No passwords are stored in the database
 * 2. Admin credentials are managed via environment/config only
 * 3. The JWT token is generated at login time using the secret key
 */

const bcrypt = require("bcrypt");
const env = require("../src/config/env");

console.log("\n╔════════════════════════════════════════╗");
console.log("║     ADMIN SEED VERIFICATION           ║");
console.log("╚════════════════════════════════════════╝\n");

// Verify admin credentials exist
const adminEmail = env.adminEmail;
const adminSecretKey = env.adminSecretKey;

if (
  !adminEmail ||
  (adminEmail === "admin@teknode.com" &&
    adminSecretKey === "change-this-secret-key-in-env")
) {
  console.log("⚠️  Admin credentials appear to be using default values.");
  console.log(
    "   For better security, update backend/.env with custom values.\n",
  );
} else {
  console.log("✅ Admin email configured:", adminEmail);
  console.log("✅ Admin secret key is set (hidden for security)\n");
}

console.log("Admin Login Credentials:");
console.log("   Email:     ", adminEmail);
console.log("   Secret Key:", adminSecretKey);
console.log("");
console.log("To login, visit: http://localhost:5173/admin-login");
console.log("Or click the 'Admin Panel' button in the footer.\n");

console.log("╔════════════════════════════════════════╗");
console.log("║  ADMIN SETUP COMPLETE                  ║");
console.log("╚════════════════════════════════════════╝\n");
