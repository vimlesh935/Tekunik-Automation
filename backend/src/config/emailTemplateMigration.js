const { query } = require("./db");

const EMAIL_TEMPLATE_KEYS = [
  {
    templateKey: "forgot_password_otp",
    templateName: "Forgot Password OTP",
    trigger: "When a user requests to reset a forgotten password",
    defaultSubject: "Password Reset OTP",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Password Reset OTP</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Use this 6-digit OTP to reset your password. It is valid for 5 minutes.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;border-radius:10px;padding:16px;text-align:center;margin:24px 0;">
      {{otp}}
    </div>
    <p style="color:#6b7280;font-size:13px;">If you did not request a password reset, you can safely ignore this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "otp"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The user's first name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The email address receiving this code", sample: "rahul.sharma@example.com" },
      { key: "otp", label: "OTP / Verification Code", description: "6-digit code (always generated securely by the system)", sample: "583214" },
    ],
    protectedVariables: ["otp"],
    category: "auth",
  },
  {
    templateKey: "change_password_otp",
    templateName: "Change Password OTP",
    trigger: "When a logged-in user requests to change their password",
    defaultSubject: "Change Password OTP",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Change Password OTP</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Use this 6-digit OTP to change your password. It is valid for 5 minutes.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;border-radius:10px;padding:16px;text-align:center;margin:24px 0;">
      {{otp}}
    </div>
    <p style="color:#6b7280;font-size:13px;">If you did not request a password change, you can safely ignore this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "otp"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The user's first name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The email address receiving this code", sample: "rahul.sharma@example.com" },
      { key: "otp", label: "OTP / Verification Code", description: "6-digit code (always generated securely by the system)", sample: "583214" },
    ],
    protectedVariables: ["otp"],
    category: "auth",
  },
  {
    templateKey: "welcome",
    templateName: "Welcome",
    trigger: "When a new customer successfully registers",
    defaultSubject: "Welcome to Tekunik Automation, {{user_name}}!",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Welcome to Tekunik Automation, {{user_name}}!</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Thank you for joining Tekunik Automation. We're excited to help you build smarter, more comfortable living spaces with automation that works for you.</p>
    <p style="color:#374151;font-size:15px;">Explore our smart home range and find everything you need — devices, installation support and more. Your account is ready, so you can start shopping right away.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email — we're always happy to help.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
    ],
    protectedVariables: [],
    category: "customer",
  },
  {
    templateKey: "order_placed",
    templateName: "Order Placed",
    trigger: "When a customer successfully places an order",
    defaultSubject: "Order #{{order_id}} Confirmed — Thank You, {{user_name}}!",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Order #{{order_id}} is Confirmed</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Thank you for your order! We've received it and are getting everything ready for you.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order Total:</strong> {{order_total}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">You can track your order anytime from your account. We'll keep you updated as it ships.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions about this order, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "order_total", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number or ID", sample: "ORD123456" },
      { key: "order_total", label: "Order Total", description: "The total amount charged for the order", sample: "₹12,499" },
      { key: "date", label: "Date", description: "The order date", sample: "10 Sep 2026" },
    ],
    protectedVariables: [],
    category: "order",
  },
  {
    templateKey: "return_request",
    templateName: "Return Request",
    trigger: "When a customer successfully submits a return request",
    defaultSubject: "Return Request Received for Order #{{order_id}}",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Return Request Received</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">We've received your return request for Order #{{order_id}}. Our team will review it and get back to you within 1-2 business days.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">If approved, you'll receive the return instructions and any details you need to send the item back.</p>
    <p style="color:#6b7280;font-size:13px;">Need help in the meantime? Just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number being returned", sample: "ORD123456" },
      { key: "date", label: "Date", description: "The date the request was submitted", sample: "10 Sep 2026" },
    ],
    protectedVariables: [],
    category: "order",
  },
  {
    templateKey: "refund",
    templateName: "Refund",
    trigger: "When an order's payment is marked as refunded",
    defaultSubject: "Refund Processed for Order #{{order_id}}",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Refund Processed</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">The refund for your Order #{{order_id}} has been processed.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Refund Amount:</strong> {{refund_amount}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">Depending on your bank or payment method, the amount usually appears in your account within 3-7 business days.</p>
    <p style="color:#6b7280;font-size:13px;">If the refund hasn't arrived by then, just reply to this email and we'll look into it.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "refund_amount", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number being refunded", sample: "ORD123456" },
      { key: "refund_amount", label: "Refund Amount", description: "The amount refunded to the customer", sample: "₹12,499" },
      { key: "date", label: "Date", description: "The date the refund was processed", sample: "10 Sep 2026" },
    ],
    protectedVariables: [],
    category: "order",
  },
  {
    templateKey: "abandoned_cart",
    templateName: "Abandoned Cart",
    trigger: "When a cart with items is left inactive for over 30 minutes",
    defaultSubject: "You Left Something Behind, {{user_name}}!",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Cart is Waiting, {{user_name}}!</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">You left some items in your cart — they're still waiting for you! Complete your purchase before they go out of stock.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="{{cart_link}}" style="background:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">Return to Your Cart</a>
    </div>
    <p style="color:#6b7280;font-size:13px;">If you already completed your purchase, you can ignore this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "cart_link", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "cart_link", label: "Cart Link", description: "A link back to the customer's cart", sample: "https://tekunikautomation.com/cart" },
      { key: "date", label: "Date", description: "The date the reminder was sent", sample: "10 Sep 2026" },
    ],
    protectedVariables: [],
    category: "cart",
  },
];

const ensureEmailTemplatesTable = async () => {
  try {
    const tables = await query("SHOW TABLES LIKE 'email_templates'");
    if (!tables.length) {
      console.log("[MIGRATE] Creating email_templates table...");
      await query(`
        CREATE TABLE email_templates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          template_key VARCHAR(100) NOT NULL,
          template_name VARCHAR(200) NOT NULL,
          subject VARCHAR(500) NOT NULL,
          body LONGTEXT NOT NULL,
          default_subject VARCHAR(500) NOT NULL,
          default_body LONGTEXT NOT NULL,
          variables JSON NOT NULL,
          variables_meta JSON NULL,
          protected_variables JSON NULL,
          trigger_event VARCHAR(255) NOT NULL DEFAULT '',
          category VARCHAR(50) NOT NULL DEFAULT 'general',
          is_enabled TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_template_key (template_key),
          INDEX idx_category (category),
          INDEX idx_enabled (is_enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log("✅ [MIGRATE] Created email_templates table");
    } else {
      console.log("✅ [MIGRATE] email_templates table exists");

      // Ensure all columns exist
      const columnChecks = [
        { name: "template_key", sql: "ALTER TABLE email_templates ADD COLUMN template_key VARCHAR(100) NOT NULL AFTER id" },
        { name: "template_name", sql: "ALTER TABLE email_templates ADD COLUMN template_name VARCHAR(200) NOT NULL AFTER template_key" },
        { name: "subject", sql: "ALTER TABLE email_templates ADD COLUMN subject VARCHAR(500) NOT NULL AFTER template_name" },
        { name: "body", sql: "ALTER TABLE email_templates ADD COLUMN body LONGTEXT NOT NULL AFTER subject" },
        { name: "default_subject", sql: "ALTER TABLE email_templates ADD COLUMN default_subject VARCHAR(500) NOT NULL AFTER body" },
        { name: "default_body", sql: "ALTER TABLE email_templates ADD COLUMN default_body LONGTEXT NOT NULL AFTER default_subject" },
        { name: "variables", sql: "ALTER TABLE email_templates ADD COLUMN variables JSON NOT NULL AFTER default_body" },
        { name: "variables_meta", sql: "ALTER TABLE email_templates ADD COLUMN variables_meta JSON NULL AFTER variables" },
        { name: "protected_variables", sql: "ALTER TABLE email_templates ADD COLUMN protected_variables JSON NULL AFTER variables_meta" },
        { name: "trigger_event", sql: "ALTER TABLE email_templates ADD COLUMN trigger_event VARCHAR(255) NOT NULL DEFAULT '' AFTER protected_variables" },
        { name: "category", sql: "ALTER TABLE email_templates ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'general' AFTER trigger_event" },
        { name: "is_enabled", sql: "ALTER TABLE email_templates ADD COLUMN is_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER category" },
      ];

      for (const col of columnChecks) {
        try {
          const [exists] = await query(`SHOW COLUMNS FROM email_templates LIKE '${col.name}'`);
          if (!exists) {
            await query(col.sql);
            console.log(`✅ [MIGRATE] Added column ${col.name} to email_templates`);
          }
        } catch (err) {
          // Column may already exist
        }
      }

      // Ensure unique index on template_key
      try {
        const indexes = await query(`SHOW INDEX FROM email_templates WHERE Key_name = 'uk_template_key'`);
        if (!indexes.length) {
          await query(`ALTER TABLE email_templates ADD UNIQUE KEY uk_template_key (template_key)`);
        }
      } catch (err) {
        // Index may already exist
      }
    }

    // Seed default templates. Idempotent: existing rows are only refreshed for
    // their *default* columns and metadata — never for subject/body/is_enabled,
    // so an admin's published edits survive every server restart.
    for (const template of EMAIL_TEMPLATE_KEYS) {
      try {
        const rows = await query("SELECT id, template_key FROM email_templates WHERE template_key = ?", [template.templateKey]);
        if (rows.length) {
          await query(
            `UPDATE email_templates SET
               template_name = ?,
               trigger_event = ?,
               default_subject = ?,
               default_body = ?,
               variables = ?,
               variables_meta = ?,
               protected_variables = ?,
               category = ?
             WHERE template_key = ?`,
            [
              template.templateName,
              template.trigger || "",
              template.defaultSubject,
              template.defaultBody,
              JSON.stringify(template.variables),
              JSON.stringify(template.variablesMeta || []),
              JSON.stringify(template.protectedVariables || []),
              template.category,
              template.templateKey,
            ]
          );
        } else {
          await query(
            `INSERT INTO email_templates
               (template_key, template_name, trigger_event, subject, body, default_subject, default_body,
                variables, variables_meta, protected_variables, category, is_enabled)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              template.templateKey,
              template.templateName,
              template.trigger || "",
              template.defaultSubject,
              template.defaultBody,
              template.defaultSubject,
              template.defaultBody,
              JSON.stringify(template.variables),
              JSON.stringify(template.variablesMeta || []),
              JSON.stringify(template.protectedVariables || []),
              template.category,
            ]
          );
        }
      } catch (err) {
        console.error(`⚠️ [MIGRATE] Could not seed template ${template.templateKey}:`, err.message);
      }
    }

    console.log("✅ [MIGRATE] Email templates seeded");
  } catch (error) {
    console.error("❌ [MIGRATE] Error ensuring email_templates table:", error.message);
  }
};

module.exports = {
  ensureEmailTemplatesTable,
  EMAIL_TEMPLATE_KEYS,
};