const { query } = require("./db");

const hasColumn = async (tableName, columnName) => {
  const columns = await query(`SHOW COLUMNS FROM ${tableName}`);
  return columns.some((column) => column.Field === columnName);
};

const addColumnIfMissing = async (tableName, columnDefinition, columnName) => {
  if (await hasColumn(tableName, columnName)) {
    return;
  }

  await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
};

const ensureOrderStatusEnum = async () => {
  try {
    await query(`
      ALTER TABLE orders MODIFY COLUMN status 
      ENUM('pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled') 
      NOT NULL DEFAULT 'pending'
    `);
  } catch (e) {
    // Column may already have correct definition
  }
};

const ensureOrderTrackingTable = async () => {
  try {
    await ensureOrderStatusEnum();
    const [trackingTable] = await query("SHOW TABLES LIKE 'order_tracking'");
    if (!trackingTable) {
      await query(`
        CREATE TABLE IF NOT EXISTS order_tracking (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          status VARCHAR(50) NOT NULL,
          label VARCHAR(100) NOT NULL,
          description TEXT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          INDEX idx_tracking_order (order_id),
          INDEX idx_tracking_status (status)
        )
      `);
      console.log("✅ [ORDER MIGRATION] Created order_tracking table");
    }

    await addColumnIfMissing("orders", "estimated_delivery DATE NULL AFTER notes", "estimated_delivery");
    await addColumnIfMissing("orders", "invoice_number VARCHAR(50) NULL UNIQUE AFTER order_number", "invoice_number");
    await addColumnIfMissing("orders", "tracking_number VARCHAR(50) NULL UNIQUE AFTER invoice_number", "tracking_number");
    await addColumnIfMissing("orders", "admin_notes TEXT NULL AFTER notes", "admin_notes");
    await addColumnIfMissing("orders", "guest_name VARCHAR(200) NULL AFTER user_id", "guest_name");
    await addColumnIfMissing("orders", "guest_email VARCHAR(150) NULL AFTER guest_name", "guest_email");
    await addColumnIfMissing("orders", "guest_phone VARCHAR(20) NULL AFTER guest_email", "guest_phone");
    await addColumnIfMissing("orders", "delivery_address TEXT NULL AFTER total_amount", "delivery_address");
    await addColumnIfMissing("orders", "guest_city VARCHAR(100) NULL AFTER delivery_address", "guest_city");
    await addColumnIfMissing("orders", "guest_state VARCHAR(100) NULL AFTER guest_city", "guest_state");
    await addColumnIfMissing("orders", "guest_pincode VARCHAR(20) NULL AFTER guest_state", "guest_pincode");
    await addColumnIfMissing("orders", "user_email VARCHAR(150) NULL AFTER guest_email", "user_email");

    console.log("✅ [ORDER MIGRATION] Order schema verification completed");
  } catch (error) {
    console.error("❌ [ORDER MIGRATION] Error:", error.message);
  }
};

/**
 * Generate a user-friendly tracking number like TEK-1A2B3C
 */
const generateTrackingNumber = () => {
  const prefix = "TEK";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0, O, I to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${code}`;
};

const getTrackingSteps = (status) => {
  const steps = [
    { status: "pending", label: "Order Confirmed", description: "Your order has been placed and is awaiting confirmation", icon: "check" },
    { status: "confirmed", label: "Confirmed", description: "Your order has been confirmed and is being processed", icon: "check" },
    { status: "processing", label: "Packed", description: "Your items are being packed and prepared for shipping", icon: "package" },
    { status: "shipped", label: "Shipped", description: "Your package has been shipped and is on its way", icon: "truck" },
    { status: "out_for_delivery", label: "Out for Delivery", description: "Your package is out for delivery today", icon: "map-pin" },
    { status: "delivered", label: "Delivered", description: "Your package has been delivered successfully", icon: "check-circle" },
  ];

  const statusOrder = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
  const currentIndex = statusOrder.indexOf(status);

  return steps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    active: index === currentIndex,
    stepNumber: index + 1,
  }));
};

const getEstimatedDelivery = () => {
  const date = new Date();
  date.setDate(date.getDate() + 5); // 5 business days
  // Adjust for weekends
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  if (date.getDay() === 6) date.setDate(date.getDate() + 2);
  return date.toISOString().split("T")[0];
};

module.exports = {
  ensureOrderTrackingTable,
  getTrackingSteps,
  getEstimatedDelivery,
  generateTrackingNumber,
};