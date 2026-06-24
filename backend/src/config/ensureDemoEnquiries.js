const { query } = require("./db");

const ensureDemoEnquiriesTable = async () => {
  try {
    console.log("[DEMO ENQUIRIES] Checking demo_enquiries table...");
    
    // Create table if it doesn't exist
    const tables = await query("SHOW TABLES LIKE 'demo_enquiries'");
    if (!tables.length) {
      console.log("[DEMO ENQUIRIES] Creating demo_enquiries table...");
      await query(`
        CREATE TABLE IF NOT EXISTS demo_enquiries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(200) NOT NULL,
          email VARCHAR(200) NOT NULL,
          phone VARCHAR(30) NOT NULL,
          preferred_date DATE NULL,
          preferred_time VARCHAR(20) NULL,
          message TEXT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_demo_enquiries_email (email),
          INDEX idx_demo_enquiries_status (status),
          INDEX idx_demo_enquiries_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ [DEMO ENQUIRIES] Created demo_enquiries table");
      return;
    }
    
    console.log("✅ [DEMO ENQUIRIES] demo_enquiries table exists");
    
    // Check and add missing columns if needed
    const columns = await query("SHOW COLUMNS FROM demo_enquiries");
    const columnNames = columns.map(c => c.Field);
    
    // Add full_name if missing
    if (!columnNames.includes("full_name")) {
      console.log("[DEMO ENQUIRIES] Adding missing full_name column...");
      await query("ALTER TABLE demo_enquiries ADD COLUMN full_name VARCHAR(200) NULL AFTER id");
      if (columnNames.includes("name")) {
        await query("UPDATE demo_enquiries SET full_name = name WHERE full_name IS NULL");
        console.log("[DEMO ENQUIRIES] Migrated data from 'name' to 'full_name'");
      }
      console.log("✅ [DEMO ENQUIRIES] full_name column added");
    }
    
    // Add updated_at if missing
    if (!columnNames.includes("updated_at")) {
      console.log("[DEMO ENQUIRIES] Adding missing updated_at column...");
      await query("ALTER TABLE demo_enquiries ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
      console.log("✅ [DEMO ENQUIRIES] updated_at column added");
    }
    
    console.log("✅ [DEMO ENQUIRIES] Schema verified successfully");
  } catch (error) {
    console.error("❌ [DEMO ENQUIRIES] Migration error:", error.message);
    console.error("   Code:", error.code);
    throw error;
  }
};

module.exports = { ensureDemoEnquiriesTable };
