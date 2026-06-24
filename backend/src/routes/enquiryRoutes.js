const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { createTransporter } = require("../services/mailService");
const env = require("../config/env");

// Build enquiry notification email HTML
const buildEnquiryEmailHTML = (data) => {
  const { name, email, phone, message, preferredDate, preferredTime } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 32px 20px; }
        .card { background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; margin-bottom: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .header-accent { background: linear-gradient(90deg, #06b6d4, #2563eb); height: 4px; border-radius: 2px; margin-bottom: 28px; }
        .logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -1px; }
        .logo span { color: #06b6d4; }
        .badge { display: inline-block; background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(37,99,235,0.15)); border: 1px solid rgba(6,182,212,0.25); border-radius: 100px; padding: 6px 16px; font-size: 11px; font-weight: 600; color: #22d3ee; text-transform: uppercase; letter-spacing: 1.5px; }
        .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #06b6d4; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .detail-row { display: flex; padding: 12px 16px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.06); }
        .detail-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; min-width: 120px; }
        .detail-value { font-size: 15px; font-weight: 600; color: #f1f5f9; }
        .message-box { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); margin-top: 12px; }
        .message-box p { font-size: 14px; color: #cbd5e1; line-height: 1.7; }
        .footer { text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 24px; }
        .footer p { font-size: 12px; color: #64748b; line-height: 1.8; }
        .timestamp { font-size: 11px; color: #475569; text-align: center; margin-top: 8px; }
        @media only screen and (max-width: 480px) {
          .card { padding: 20px; }
          .detail-row { flex-direction: column; gap: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card" style="text-align: center;">
          <div class="header-accent"></div>
          <div class="logo">TEKU<span>NIK</span></div>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase;">Premium IoT Solutions</p>
          <div style="margin-top: 20px;">
            <span class="badge">📩 New Demo Enquiry</span>
          </div>
          <h1 style="font-size: 28px; font-weight: 800; color: #ffffff; margin-top: 16px;">Free Demo Request</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">A customer has requested a free smart home demo</p>
        </div>

        <div class="card">
          <div class="section-title">Contact Information</div>
          <div class="detail-row">
            <span class="detail-label">Full Name</span>
            <span class="detail-value">${name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">${email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">${phone}</span>
          </div>
          ${preferredDate ? `
          <div class="detail-row">
            <span class="detail-label">Preferred Date</span>
            <span class="detail-value">${preferredDate}</span>
          </div>
          ` : ''}
          ${preferredTime ? `
          <div class="detail-row">
            <span class="detail-label">Preferred Time</span>
            <span class="detail-value">${preferredTime}</span>
          </div>
          ` : ''}
        </div>

        ${message ? `
        <div class="card">
          <div class="section-title">Message / Requirements</div>
          <div class="message-box">
            <p>${message}</p>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p style="font-size: 14px; color: #94a3b8;">This is an automated enquiry notification from <strong style="color: #06b6d4;">Tek Node</strong>.</p>
          <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Please respond to this lead as soon as possible.</p>
          <p class="timestamp">Enquiry received on ${new Date().toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// POST /api/enquiry/demo - Submit a demo enquiry
router.post("/api/enquiry/demo", async (req, res) => {
  console.log("\n═══════════════════════════════════════════════");
  console.log("[ENQUIRY] Request received at:", new Date().toISOString());
  console.log("[ENQUIRY] Body:", JSON.stringify(req.body, null, 2));
  console.log("═══════════════════════════════════════════════");

  try {
    const { name, email, phone, message, preferredDate, preferredTime } = req.body;

    // ── VALIDATION ──
    const errors = [];
    if (!name || !name.trim()) errors.push("Name is required");
    if (!email || !email.trim()) errors.push("Email is required");
    if (!phone || !phone.trim()) errors.push("Phone number is required");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    if (email && !emailRegex.test(email.trim())) errors.push("Invalid email format");
    if (phone && phone.trim().length < 10) errors.push("Phone number must be at least 10 digits");

    if (errors.length > 0) {
      console.log("[ENQUIRY] ❌ Validation failed:", errors);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors,
        code: "VALIDATION_ERROR",
      });
    }

    console.log("[ENQUIRY] ✅ Validation passed");

    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      message: message ? message.trim() : "",
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
    };

    // ── MYSQL INSERT ──
    console.log("[ENQUIRY] Inserting into demo_enquiries table...");
    const [insertResult] = await pool.query(
      `INSERT INTO demo_enquiries (name, email, phone, message, preferred_date, preferred_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        sanitizedData.name,
        sanitizedData.email,
        sanitizedData.phone,
        sanitizedData.message || null,
        sanitizedData.preferredDate || null,
        sanitizedData.preferredTime || null,
      ]
    );
    console.log("[ENQUIRY] ✅ Database insert successful. Insert ID:", insertResult.insertId);

    // ── EMAIL SENDING ──
    console.log("[ENQUIRY] Sending email notification...");
    let emailSent = false;
    let emailError = null;

    try {
      const smtp = createTransporter();
      const htmlContent = buildEnquiryEmailHTML(sanitizedData);
      const adminEmail = env.smtp.from || env.smtp.user || "vimleshnew29@gmail.com";

      const mailOptions = {
        from: `"Tek Node Enquiries" <${env.smtp.user}>`,
        to: adminEmail,
        subject: `📩 New Demo Enquiry from ${sanitizedData.name}`,
        html: htmlContent,
        replyTo: sanitizedData.email,
      };

      console.log("[ENQUIRY] Mail options:", {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        replyTo: mailOptions.replyTo,
      });

      const info = await smtp.sendMail(mailOptions);
      console.log("[ENQUIRY] ✅ Email sent successfully. Message ID:", info.messageId);
      console.log("[ENQUIRY]    Accepted:", info.accepted);
      console.log("[ENQUIRY]    Response:", info.response);
      emailSent = true;
    } catch (emailErr) {
      emailError = emailErr.message;
      console.error("[ENQUIRY] ❌ Email sending failed:", emailErr.message);
      console.error("[ENQUIRY]    Full error:", emailErr);

      // Update DB status to reflect email failure but don't block the response
      try {
        await pool.query(
          "UPDATE demo_enquiries SET status = 'email_failed' WHERE id = ?",
          [insertResult.insertId]
        );
        console.log("[ENQUIRY] Updated DB status to 'email_failed'");
      } catch (updateErr) {
        console.error("[ENQUIRY] Failed to update email status:", updateErr.message);
      }
    }

    // ── RESPONSE ──
    console.log("[ENQUIRY] ✅ Flow complete. Sending response...");
    return res.status(200).json({
      success: true,
      message: "Your demo enquiry has been submitted successfully! We will contact you shortly.",
      data: {
        enquiryId: insertResult.insertId,
        emailSent,
      },
    });

  } catch (error) {
    console.error("\n═[ENQUIRY ERROR]══════════════════════════════");
    console.error("[ENQUIRY] ❌ Unhandled error:", error.message);
    console.error("[ENQUIRY]    Stack:", error.stack);
    console.error("[ENQUIRY]    Code:", error.code);
    console.error("═══════════════════════════════════════════════\n");

    // Determine if it's a known error type
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    let errorMessage = "An unexpected error occurred. Please try again later.";

    if (error.code === "ER_BAD_DB_ERROR" || error.code === "ECONNREFUSED") {
      statusCode = 503;
      errorCode = "DATABASE_ERROR";
      errorMessage = "Database connection failed. Please try again later.";
    } else if (error.code === "EAUTH" || error.code === "EENVELOPE") {
      statusCode = 500;
      errorCode = "EMAIL_ERROR";
      errorMessage = "Email service is temporarily unavailable. Your enquiry has been saved.";
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      code: errorCode,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;