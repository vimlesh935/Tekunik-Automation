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
    templateKey: "return_approved",
    templateName: "Return Approved",
    trigger: "When an admin approves a customer's return request",
    defaultSubject: "Return Approved for Order #{{order_id}}",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Return Approved</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Great news! Your return request for Order #{{order_id}} has been approved.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Approved On:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">We'll begin processing your refund shortly. The amount typically appears in your account within 3-7 business days after the refund is initiated.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number being returned", sample: "ORD123456" },
      { key: "date", label: "Date", description: "The date the request was approved", sample: "10 Sep 2026" },
    ],
    protectedVariables: [],
    category: "order",
  },
  {
    templateKey: "return_rejected",
    templateName: "Return Rejected",
    trigger: "When an admin rejects a customer's return request",
    defaultSubject: "Update on Your Return Request for Order #{{order_id}}",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Return Request Update</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">We're sorry, but your return request for Order #{{order_id}} could not be approved.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 10px;color:#111827;font-size:15px;"><strong>Reason:</strong></p>
      <p style="margin:0;color:#b91c1c;font-size:15px;">{{reason}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">If you believe this decision is in error, please reply to this email and our support team will take another look.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "reason", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number being returned", sample: "ORD123456" },
      { key: "reason", label: "Reason", description: "The rejection reason set by the admin", sample: "Return window expired." },
      { key: "date", label: "Date", description: "The date the request was rejected", sample: "10 Sep 2026" },
    ],
    protectedVariables: [],
    category: "order",
  },
  {
    templateKey: "refund_started",
    templateName: "Refund Started",
    trigger: "When a refund is initiated for an approved return",
    defaultSubject: "Refund Initiated for Order #{{order_id}}",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Refund Initiated</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Your refund for Order #{{order_id}} has been initiated.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Refund Amount:</strong> {{refund_amount}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Initiated On:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">The amount usually reflects in your account within 3-7 business days.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "refund_amount", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number being refunded", sample: "ORD123456" },
      { key: "refund_amount", label: "Refund Amount", description: "The amount being refunded to the customer", sample: "₹12,499" },
      { key: "date", label: "Date", description: "The date the refund was initiated", sample: "10 Sep 2026" },
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
    templateKey: "cod_refund_details_required",
    templateName: "COD Refund Details Required",
    trigger: "When a COD return is approved and refund details are needed from the customer",
    defaultSubject: "Action Required: Provide Refund Details for Order #{{order_id}}",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Refund Details Required</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Your return for Order #{{order_id}} has been approved. To process your refund, we need your payment details.</p>
    <p style="color:#374151;font-size:15px;">Please log in to your account and provide your preferred refund method:</p>
    <ul style="color:#374151;font-size:15px;line-height:2;">
      <li><strong>UPI</strong> - Enter your UPI ID</li>
      <li><strong>Bank Transfer</strong> - Enter account holder name, account number, IFSC code, and bank name</li>
    </ul>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Refund Amount:</strong> {{refund_amount}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="{{dashboard_link}}" style="background:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">Submit Refund Details</a>
    </div>
    <p style="color:#6b7280;font-size:13px;">If you have already submitted your details, you can ignore this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "refund_amount", "date", "dashboard_link"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD123456" },
      { key: "refund_amount", label: "Refund Amount", description: "The amount to be refunded", sample: "₹12,499" },
      { key: "date", label: "Date", description: "The date of the email", sample: "10 Sep 2026" },
      { key: "dashboard_link", label: "Dashboard Link", description: "Link to the customer's dashboard", sample: "https://tekunikautomation.com/dashboard" },
    ],
    protectedVariables: [],
    category: "order",
  },
  {
    templateKey: "cod_refund_processing",
    templateName: "COD Refund Processing",
    trigger: "When a COD refund is being processed after details are submitted",
    defaultSubject: "Your COD Refund is Being Processed for Order #{{order_id}}",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Refund Processing</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">We have received your refund details for Order #{{order_id}} and are now processing your refund.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Refund Amount:</strong> {{refund_amount}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Refund Method:</strong> {{refund_method}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">The refund will be completed shortly. You will receive a confirmation once it's done.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "refund_amount", "refund_method", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD123456" },
      { key: "refund_amount", label: "Refund Amount", description: "The amount being refunded", sample: "₹12,499" },
      { key: "refund_method", label: "Refund Method", description: "UPI or Bank", sample: "UPI" },
      { key: "date", label: "Date", description: "The date the refund was initiated", sample: "10 Sep 2026" },
    ],
    protectedVariables: [],
    category: "order",
  },
  {
    templateKey: "cod_refund_completed",
    templateName: "COD Refund Completed",
    trigger: "When a COD refund is completed and money is transferred to the customer",
    defaultSubject: "Your COD Refund has been Completed for Order #{{order_id}}",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Refund Completed</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Your COD refund for Order #{{order_id}} has been completed successfully.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Refund Amount:</strong> {{refund_amount}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Refund Method:</strong> {{refund_method}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Completed On:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">The amount should reflect in your account within 1-3 business days.</p>
    <p style="color:#6b7280;font-size:13px;">If you don't see the refund by then, just reply to this email and we'll look into it.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "refund_amount", "refund_method", "date"],
    variablesMeta: [
      { key: "user_name", label: "Name", description: "The customer's full name", sample: "Rahul Sharma" },
      { key: "user_email", label: "Email", description: "The customer's email address", sample: "rahul.sharma@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD123456" },
      { key: "refund_amount", label: "Refund Amount", description: "The amount refunded", sample: "₹12,499" },
      { key: "refund_method", label: "Refund Method", description: "UPI or Bank", sample: "UPI" },
      { key: "date", label: "Date", description: "The date the refund was completed", sample: "10 Sep 2026" },
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
  {
    templateKey: "order_processing",
    templateName: "Order Processing",
    trigger: "When an order status changes to Processing",
    defaultSubject: "Your Order #{{order_id}} is Being Processed",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Order #{{order_id}} is Being Processed</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">We're now processing your order. Our team is picking and packing your items.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">We'll notify you as soon as your order is packed and ready to ship.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "date"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The customer's name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The customer's email", sample: "rahul@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD-123456" },
      { key: "date", label: "Date", description: "The date of status change", sample: "15 Sep 2026" },
    ],
    protectedVariables: [],
    category: "shipping",
  },
  {
    templateKey: "order_packed",
    templateName: "Order Packed",
    trigger: "When an order status changes to Packed",
    defaultSubject: "Your Order #{{order_id}} Has Been Packed",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Order #{{order_id}} Has Been Packed</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Your order has been packed and is ready for shipping.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">Your package will be handed over to the courier shortly.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "date"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The customer's name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The customer's email", sample: "rahul@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD-123456" },
      { key: "date", label: "Date", description: "The date of status change", sample: "15 Sep 2026" },
    ],
    protectedVariables: [],
    category: "shipping",
  },
  {
    templateKey: "order_shipped",
    templateName: "Order Shipped",
    trigger: "When an order status changes to Shipped",
    defaultSubject: "Your Order #{{order_id}} Has Been Shipped — Track It Now",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Order #{{order_id}} Has Been Shipped</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Great news! Your order is on its way.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Tracking Number:</strong> {{tracking_number}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Courier:</strong> {{shipping_provider}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">You can track your shipment using the tracking number above.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "tracking_number", "shipping_provider", "estimated_delivery", "date"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The customer's name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The customer's email", sample: "rahul@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD-123456" },
      { key: "tracking_number", label: "Tracking Number", description: "Courier tracking number", sample: "TRK-ABC123" },
      { key: "shipping_provider", label: "Shipping Provider", description: "Courier company name", sample: "Delhivery" },
      { key: "estimated_delivery", label: "Estimated Delivery", description: "Expected delivery date", sample: "20 Sep 2026" },
      { key: "date", label: "Date", description: "The date of status change", sample: "15 Sep 2026" },
    ],
    protectedVariables: [],
    category: "shipping",
  },
  {
    templateKey: "order_in_transit",
    templateName: "Order In Transit",
    trigger: "When an order status changes to In Transit",
    defaultSubject: "Your Order #{{order_id}} is In Transit",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Order #{{order_id}} is In Transit</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Your package is on the way to your location.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Tracking Number:</strong> {{tracking_number}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Courier:</strong> {{shipping_provider}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">Estimated delivery: {{estimated_delivery}}</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "tracking_number", "shipping_provider", "estimated_delivery", "date"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The customer's name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The customer's email", sample: "rahul@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD-123456" },
      { key: "tracking_number", label: "Tracking Number", description: "Courier tracking number", sample: "TRK-ABC123" },
      { key: "shipping_provider", label: "Shipping Provider", description: "Courier company name", sample: "Delhivery" },
      { key: "estimated_delivery", label: "Estimated Delivery", description: "Expected delivery date", sample: "20 Sep 2026" },
      { key: "date", label: "Date", description: "The date of status change", sample: "15 Sep 2026" },
    ],
    protectedVariables: [],
    category: "shipping",
  },
  {
    templateKey: "order_out_for_delivery",
    templateName: "Order Out for Delivery",
    trigger: "When an order status changes to Out for Delivery",
    defaultSubject: "Your Order #{{order_id}} is Out for Delivery Today",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Order #{{order_id}} is Out for Delivery</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Your package is out for delivery today! Please ensure someone is available to receive it.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Tracking Number:</strong> {{tracking_number}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Courier:</strong> {{shipping_provider}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">You can track the live status using the tracking number.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "tracking_number", "shipping_provider", "date"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The customer's name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The customer's email", sample: "rahul@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD-123456" },
      { key: "tracking_number", label: "Tracking Number", description: "Courier tracking number", sample: "TRK-ABC123" },
      { key: "shipping_provider", label: "Shipping Provider", description: "Courier company name", sample: "Delhivery" },
      { key: "date", label: "Date", description: "The date of status change", sample: "15 Sep 2026" },
    ],
    protectedVariables: [],
    category: "shipping",
  },
  {
    templateKey: "order_delivered",
    templateName: "Order Delivered",
    trigger: "When an order status changes to Delivered",
    defaultSubject: "Your Order #{{order_id}} Has Been Delivered",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Order #{{order_id}} Has Been Delivered</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Your order has been delivered successfully. We hope you love your purchase!</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">If you have any feedback or need assistance, we're here to help.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "date"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The customer's name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The customer's email", sample: "rahul@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD-123456" },
      { key: "date", label: "Date", description: "The date of delivery", sample: "15 Sep 2026" },
    ],
    protectedVariables: [],
    category: "shipping",
  },
  {
    templateKey: "delivery_failed",
    templateName: "Delivery Failed",
    trigger: "When a delivery attempt fails",
    defaultSubject: "Delivery Failed for Order #{{order_id}} — We'll Retry",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Delivery Attempt Failed for Order #{{order_id}}</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Our courier partner was unable to deliver your order today. We'll schedule a re-attempt or contact you to arrange an alternative.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Tracking Number:</strong> {{tracking_number}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Courier:</strong> {{shipping_provider}}</p>
    </div>
    <p style="color:#374151;font-size:15px;">Please check your tracking for updates or contact us if you need to reschedule.</p>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "tracking_number", "shipping_provider", "date"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The customer's name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The customer's email", sample: "rahul@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD-123456" },
      { key: "tracking_number", label: "Tracking Number", description: "Courier tracking number", sample: "TRK-ABC123" },
      { key: "shipping_provider", label: "Shipping Provider", description: "Courier company name", sample: "Delhivery" },
      { key: "date", label: "Date", description: "The date of delivery failure", sample: "15 Sep 2026" },
    ],
    protectedVariables: [],
    category: "shipping",
  },
  {
    templateKey: "order_cancelled",
    templateName: "Order Cancelled",
    trigger: "When an order is cancelled",
    defaultSubject: "Your Order #{{order_id}} Has Been Cancelled",
    defaultBody: `
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
    <h2 style="margin:0 0 12px;color:#111827;">Your Order #{{order_id}} Has Been Cancelled</h2>
    <p style="color:#374151;font-size:15px;">Hi {{user_name}},</p>
    <p style="color:#374151;font-size:15px;">Your order has been cancelled as requested. If this was a mistake, please contact us.</p>
    <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Order ID:</strong> {{order_id}}</p>
      <p style="margin:0;color:#111827;font-size:15px;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p style="color:#6b7280;font-size:13px;">If you have any questions, just reply to this email.</p>
  </div>
</div>
`.trim(),
    variables: ["user_name", "user_email", "order_id", "date"],
    variablesMeta: [
      { key: "user_name", label: "User Name", description: "The customer's name", sample: "Rahul Sharma" },
      { key: "user_email", label: "User Email", description: "The customer's email", sample: "rahul@example.com" },
      { key: "order_id", label: "Order ID", description: "The order number", sample: "ORD-123456" },
      { key: "date", label: "Date", description: "The date of cancellation", sample: "15 Sep 2026" },
    ],
    protectedVariables: [],
    category: "shipping",
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