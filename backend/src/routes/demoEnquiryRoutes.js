const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { createTransporter } = require("../services/mailService");
const env = require("../config/env");

const ADMIN_EMAIL = "vimleshnew29@gmail.com";

const normalizeDemoPayload = (body = {}) => ({
  full_name: body.full_name || body.name || "",
  email: body.email || "",
  phone: body.phone || "",
  preferred_date: body.preferred_date || body.preferredDate || "",
  preferred_time: body.preferred_time || body.preferredTime || "",
  message: body.message || "",
});

// ──────────────────────────────────────────────
// POST /api/demo-enquiry — Submit a demo booking
// ──────────────────────────────────────────────
router.post("/api/demo-enquiry", async (req, res) => {
  console.log("\n═══════════════════════════════════");
  console.log("[DEMO] ⚡ Route Hit");
  console.log("[DEMO] Method:", req.method);
  console.log("[DEMO] Path:", req.path);
  console.log("[DEMO] Original URL:", req.originalUrl);
  console.log("[DEMO] Body:", JSON.stringify(req.body));
  console.log("═══════════════════════════════════\n");

  try {
    const { full_name, email, phone, preferred_date, preferred_time, message } = normalizeDemoPayload(req.body);

    // ── VALIDATION ──
    const validationErrors = [];

    if (!full_name || !full_name.trim()) {
      validationErrors.push("Full Name is required");
    }
    if (!email || !email.trim()) {
      validationErrors.push("Email is required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
      if (!emailRegex.test(email.trim())) {
        validationErrors.push("Invalid email format");
      }
    }
    if (!phone || !phone.trim()) {
      validationErrors.push("Phone is required");
    } else {
      const digitsOnly = phone.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        validationErrors.push("Phone must be at least 10 digits");
      }
    }
    if (!preferred_date || !preferred_date.trim()) {
      validationErrors.push("Preferred Date is required");
    }

    if (validationErrors.length > 0) {
      console.log("[DEMO] ❌ Validation Error:", validationErrors);
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Validation Error",
        errors: validationErrors,
        details: { errors: validationErrors },
      });
    }

    console.log("[DEMO] ✅ Validation Passed");

    // ── SANITIZE ──
    const sanitized = {
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, "").trim(),
      preferred_date: preferred_date.trim() || null,
      preferred_time: preferred_time ? preferred_time.trim() : null,
      message: message ? message.trim() : null,
    };

    // ── MYSQL INSERT ──
    console.log("[DEMO] MySQL Connected - Executing INSERT...");
    let insertResult;
    try {
      [insertResult] = await pool.query(
        `INSERT INTO demo_enquiries (full_name, email, phone, preferred_date, preferred_time, message, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [sanitized.full_name, sanitized.email, sanitized.phone, sanitized.preferred_date, sanitized.preferred_time, sanitized.message]
      );
      console.log("[DEMO] ✅ Record Saved. ID:", insertResult.insertId);
    } catch (dbError) {
      console.error("[DEMO] ❌ Database Error:", dbError.message);
      console.error("[DEMO] ❌ Database Error Code:", dbError.code);
      return res.status(500).json({
        success: false,
        code: "DATABASE_ERROR",
        message: "Database error. Please try again later.",
        details: { error: dbError.code === "ER_NO_SUCH_TABLE" ? "Table not found" : "Database operation failed" },
      });
    }

    // ── EMAIL SENDING ──
    console.log("[DEMO] Email Sent - Sending notification...");
    let emailSent = false;
    let emailErrorMsg = null;

    try {
      const smtp = createTransporter();

      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">
        <style>
          body{font-family:Arial,sans-serif;background:#f4f4f4;padding:20px}
          .container{max-width:600px;margin:auto;background:#fff;border-radius:8px;padding:24px}
          h2{color:#1a1a2e;border-bottom:2px solid #06b6d4;padding-bottom:8px}
          .field{margin:12px 0;padding:12px;background:#f9f9f9;border-left:3px solid #06b6d4}
          .label{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px}
          .value{font-size:16px;color:#1a1a2e;font-weight:600;margin-top:4px}
          .footer{margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center}
        </style>
        </head>
        <body>
          <div class="container">
            <h2>📩 New Demo Booking Request</h2>
            <p style="color:#666">A new demo enquiry has been received from <strong>${sanitized.full_name}</strong>.</p>
            <div class="field"><div class="label">Full Name</div><div class="value">${sanitized.full_name}</div></div>
            <div class="field"><div class="label">Email</div><div class="value">${sanitized.email}</div></div>
            <div class="field"><div class="label">Phone</div><div class="value">${sanitized.phone}</div></div>
            <div class="field"><div class="label">Preferred Date</div><div class="value">${sanitized.preferred_date || "Not specified"}</div></div>
            <div class="field"><div class="label">Preferred Time</div><div class="value">${sanitized.preferred_time || "Not specified"}</div></div>
            ${sanitized.message ? `<div class="field"><div class="label">Message</div><div class="value">${sanitized.message}</div></div>` : ""}
            <div class="footer">
              <p>This is an automated notification from Tek Node</p>
              <p>Enquiry ID: ${insertResult.insertId} | Status: Pending</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await smtp.sendMail({
        from: `"Tek Node Demos" <${env.smtp.user}>`,
        to: ADMIN_EMAIL,
        subject: "New Demo Booking Request",
        html: emailHTML,
        replyTo: sanitized.email,
      });

      console.log("[DEMO] ✅ Email Sent Successfully to:", ADMIN_EMAIL);
      emailSent = true;
    } catch (emailErr) {
      emailErrorMsg = emailErr.message;
      console.error("[DEMO] ❌ Email Error:", emailErr.message);
      console.error("[DEMO] ❌ Email Error Code:", emailErr.code);

      try {
        await pool.query("UPDATE demo_enquiries SET status = 'Email Failed' WHERE id = ?", [insertResult.insertId]);
        console.log("[DEMO] Updated status to 'Email Failed'");
      } catch (updateErr) {
        console.error("[DEMO] Status update error:", updateErr.message);
      }

      return res.status(200).json({
        success: true,
        code: "EMAIL_ERROR",
        message: "Demo request submitted successfully but email notification failed. Our team will still review your request.",
        data: {
          id: insertResult.insertId,
          email_sent: false,
          email_error: emailErr.message,
        },
      });
    }

    // ── SUCCESS RESPONSE ──
    console.log("[DEMO] ✅ Success Response");
    return res.status(200).json({
      success: true,
      code: "SUCCESS",
      message: "Demo request submitted successfully. Our team will contact you shortly.",
      data: {
        id: insertResult.insertId,
        email_sent: emailSent,
      },
    });

  } catch (error) {
    console.error("\n❌ [DEMO ERROR]");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    console.error("   Stack:", error.stack);

    let statusCode = 500;
    let errorCode = "API_ERROR";
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error.code === "ER_NO_SUCH_TABLE") {
      errorCode = "DATABASE_ERROR";
      errorMessage = "Database table not found. Please contact support.";
    } else if (error.code === "ECONNREFUSED") {
      errorCode = "DATABASE_ERROR";
      errorMessage = "Database connection failed. Please try again later.";
    } else if (error.code === "ER_DUP_ENTRY") {
      errorCode = "DATABASE_ERROR";
      errorMessage = "Duplicate entry detected.";
    }

    return res.status(statusCode).json({
      success: false,
      code: errorCode,
      message: errorMessage,
    });
  }
});

// ──────────────────────────────────────────────
// POST /api/enquiry/demo — Legacy alias
// ──────────────────────────────────────────────
router.post("/api/enquiry/demo", async (req, res) => {
  console.log("[DEMO] ⚡ Legacy Route Hit (/api/enquiry/demo)");
  // Forward to the main handler by calling the route handler manually
  // Use the same normalized payload
  const normalized = normalizeDemoPayload(req.body);
  req.body = normalized;
  // Redirect to the main handler by re-issuing
  const { full_name, email, phone, preferred_date, preferred_time, message } = normalized;
  
  // Reuse the same DB/email logic inline
  try {
    const validationErrors = [];
    if (!full_name || !full_name.trim()) validationErrors.push("Full Name is required");
    if (!email || !email.trim()) validationErrors.push("Email is required");
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
      if (!emailRegex.test(email.trim())) validationErrors.push("Invalid email format");
    }
    if (!phone || !phone.trim()) validationErrors.push("Phone is required");
    else {
      const digitsOnly = phone.replace(/\D/g, "");
      if (digitsOnly.length < 10) validationErrors.push("Phone must be at least 10 digits");
    }
    if (!preferred_date || !preferred_date.trim()) validationErrors.push("Preferred Date is required");

    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Validation Error", errors: validationErrors });
    }

    const sanitized = {
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, "").trim(),
      preferred_date: preferred_date.trim() || null,
      preferred_time: preferred_time ? preferred_time.trim() : null,
      message: message ? message.trim() : null,
    };

    const [insertResult] = await pool.query(
      `INSERT INTO demo_enquiries (full_name, email, phone, preferred_date, preferred_time, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [sanitized.full_name, sanitized.email, sanitized.phone, sanitized.preferred_date, sanitized.preferred_time, sanitized.message]
    );

    console.log("[DEMO] Legacy Route - Record Saved. ID:", insertResult.insertId);

    let emailSent = false;
    try {
      const smtp = createTransporter();
      await smtp.sendMail({
        from: `"Tek Node Demos" <${env.smtp.user}>`,
        to: ADMIN_EMAIL,
        subject: "New Demo Booking Request",
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px">
            <h2>New Demo Booking Request</h2>
            <p><strong>Name:</strong> ${sanitized.full_name}</p>
            <p><strong>Email:</strong> ${sanitized.email}</p>
            <p><strong>Phone:</strong> ${sanitized.phone}</p>
            <p><strong>Date:</strong> ${sanitized.preferred_date || "Not specified"}</p>
            <p><strong>Time:</strong> ${sanitized.preferred_time || "Not specified"}</p>
            ${sanitized.message ? `<p><strong>Message:</strong> ${sanitized.message}</p>` : ""}
          </div>
        `,
        replyTo: sanitized.email,
      });
      emailSent = true;
      console.log("[DEMO] Legacy Route - Email Sent");
    } catch (emailErr) {
      console.error("[DEMO] Legacy Route - Email Error:", emailErr.message);
      await pool.query("UPDATE demo_enquiries SET status = 'Email Failed' WHERE id = ?", [insertResult.insertId]);
    }

    return res.status(200).json({
      success: true,
      message: "Demo request submitted successfully.",
      data: { id: insertResult.insertId, email_sent: emailSent },
    });
  } catch (error) {
    console.error("[DEMO] Legacy Route - Error:", error.message);
    return res.status(500).json({ success: false, code: "API_ERROR", message: "An unexpected error occurred." });
  }
});

// ──────────────────────────────────────────────
// GET /api/admin/demo-enquiries — List all enquiries
// ──────────────────────────────────────────────
router.get("/api/admin/demo-enquiries", async (req, res) => {
  console.log("[DEMO ADMIN] ⚡ Route Hit - List Enquiries");
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query("SELECT COUNT(*) AS total FROM demo_enquiries");
    const total = countResult[0].total;

    const [rows] = await pool.query(
      "SELECT * FROM demo_enquiries ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    console.log("[DEMO ADMIN] Fetched", rows.length, "enquiries (total:", total, ")");

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[DEMO ADMIN] ❌ Database Error:", error.message);
    return res.status(500).json({
      success: false,
      code: "DATABASE_ERROR",
      message: "Failed to fetch demo enquiries.",
    });
  }
});

// ──────────────────────────────────────────────
// PUT /api/admin/demo-enquiries/:id — Update status
// ──────────────────────────────────────────────
router.put("/api/admin/demo-enquiries/:id", async (req, res) => {
  console.log("[DEMO ADMIN] ⚡ Route Hit - Update Status ID:", req.params.id);
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Contacted", "Scheduled", "Completed", "Cancelled", "Email Failed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const [result] = await pool.query("UPDATE demo_enquiries SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Enquiry not found.",
      });
    }

    console.log("[DEMO ADMIN] ✅ Status updated: ID", id, "→", status);

    return res.json({
      success: true,
      message: "Status updated successfully.",
    });
  } catch (error) {
    console.error("[DEMO ADMIN] ❌ Update Error:", error.message);
    return res.status(500).json({
      success: false,
      code: "DATABASE_ERROR",
      message: "Failed to update enquiry status.",
    });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/admin/demo-enquiries/:id — Delete enquiry
// ──────────────────────────────────────────────
router.delete("/api/admin/demo-enquiries/:id", async (req, res) => {
  console.log("[DEMO ADMIN] ⚡ Route Hit - Delete ID:", req.params.id);
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM demo_enquiries WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Enquiry not found.",
      });
    }

    console.log("[DEMO ADMIN] ✅ Deleted enquiry ID:", id);

    return res.json({
      success: true,
      message: "Enquiry deleted successfully.",
    });
  } catch (error) {
    console.error("[DEMO ADMIN] ❌ Delete Error:", error.message);
    return res.status(500).json({
      success: false,
      code: "DATABASE_ERROR",
      message: "Failed to delete enquiry.",
    });
  }
});

module.exports = router;