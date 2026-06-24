const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");

const submitContactForm = asyncHandler(async (req, res) => {
  try {
    const { full_name, email, phone, message } = req.body;

    if (!full_name || !email || !message) {
      throw new AppError("Full name, email, and message are required", 400, "VALIDATION_ERROR");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address", 400, "VALIDATION_ERROR");
    }

    // Save to database (using demo_enquiries table which already exists)
    await query(
      `INSERT INTO demo_enquiries (full_name, email, phone, message, status, created_at)
       VALUES (?, ?, ?, ?, 'new', NOW())`,
      [full_name, email, phone || null, message]
    );

    // Try to send email notification (non-blocking)
    try {
      const { createTransporter } = require("../services/mailService");
      const transporter = createTransporter();

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@teknode.com",
        to: "vimleshnew29@gmail.com",
        subject: `New Contact Form Submission from ${full_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f6f8fb; padding: 24px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e6eaf0;">
              <h2 style="margin: 0 0 12px; color: #111827;">New Contact Form Submission</h2>
              <p style="color: #374151; font-size: 15px;">You have received a new enquiry from the website contact form.</p>
              <div style="margin: 24px 0; padding: 16px; background: #f3f4f6; border-radius: 10px;">
                <p style="margin: 0 0 8px;"><strong>Name:</strong> ${full_name}</p>
                <p style="margin: 0 0 8px;"><strong>Email:</strong> ${email}</p>
                ${phone ? `<p style="margin: 0 0 8px;"><strong>Phone:</strong> ${phone}</p>` : ""}
                <p style="margin: 0;"><strong>Message:</strong></p>
                <p style="margin: 8px 0 0; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #6b7280; font-size: 13px;">This enquiry was submitted on ${new Date().toLocaleString("en-IN")}.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("[CONTACT] Failed to send notification email:", emailError.message);
    }

    return success(res, "Message sent successfully! We'll get back to you soon.", null, 201);
  } catch (error) {
    console.error("[CONTACT FORM ERROR]", error);
    if (error.statusCode) throw error;
    throw new AppError(
      error.message || "Failed to send message",
      500,
      "SERVER_ERROR"
    );
  }
});

module.exports = { submitContactForm };