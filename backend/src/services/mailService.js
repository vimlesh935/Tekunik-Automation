const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;
const gmailRegex = /^[^\s@]+@gmail\.com$/i;

const normalizeRecipient = (value) => String(value || "").trim().toLowerCase();

const assertGmailRecipient = (to) => {
  const recipient = normalizeRecipient(to);

  if (!gmailRegex.test(recipient)) {
    const error = new Error("Only Gmail addresses are allowed");
    error.statusCode = 400;
    error.code = "GMAIL_ONLY";
    console.error("[mailService] Blocked non-Gmail OTP recipient before SMTP:", {
      attemptedRecipient: to,
    });
    throw error;
  }

  return recipient;
};

const createTransporter = () => {
  console.log("[mailService] Creating transporter...");
  
  if (!env.smtp.user || !env.smtp.pass) {
    const error = `SMTP Configuration Error: SMTP_USER=${env.smtp.user ? "SET" : "NOT SET"}, SMTP_PASS=${env.smtp.pass ? "SET" : "NOT SET"}`;
    console.error("[mailService] " + error);
    throw new Error(error);
  }

  if (!transporter) {
    console.log("[mailService] Initializing Gmail transporter with:");
    console.log(`  - SMTP User: ${env.smtp.user}`);
    console.log(`  - SMTP Pass: ${env.smtp.pass ? `${env.smtp.pass.substring(0, 3)}***` : "NOT SET"}`);
    console.log(`  - OTP From: ${env.smtp.from || "NOT SET"}`);
    console.log(`  - TLS Reject Unauthorized: ${env.smtp.tlsRejectUnauthorized}`);
    
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return transporter;
};

const verifyTransporter = async () => {
  try {
    const smtp = createTransporter();
    console.log("[mailService] Verifying SMTP transporter...");

    await new Promise((resolve, reject) => {
      smtp.verify((error, success) => {
        if (error) {
          console.log("SMTP ERROR:", error);
          reject(error);
        } else {
          console.log("SMTP SERVER READY");
          resolve(success);
        }
      });
    });

    console.log("✅ [mailService] Gmail SMTP transporter verified successfully");
  } catch (error) {
    console.error("❌ [mailService] SMTP Verification Failed:");
    console.error("   Error Message:", error.message);
    console.error("   Error Code:", error.code);
    console.error("   SMTP Response:", error.response);
    console.error("   Common fixes:");
    console.error("   1. Check SMTP_USER and SMTP_PASS in backend/.env");
    console.error("   2. Use a Gmail App Password, not your normal Gmail password");
    console.error("   3. Ensure Gmail 2FA is enabled before creating an App Password");
    throw error;
  }
};

const buildOtpTemplate = (otp, name = "User") => `
  <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
    <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
      <h2 style="margin:0 0 12px;color:#111827;">Your OTP Code</h2>
      <p style="color:#374151;font-size:15px;">Hi ${name},</p>
      <p style="color:#374151;font-size:15px;">Use this 6-digit OTP to verify your email. It is valid for 5 minutes.</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;border-radius:10px;padding:16px;text-align:center;margin:24px 0;">
        ${otp}
      </div>
      <p style="color:#6b7280;font-size:13px;">If you did not request this OTP, you can safely ignore this email.</p>
    </div>
  </div>
`;

const sendOtpEmail = async ({ to, otp, name }) => {
  try {
    const recipient = assertGmailRecipient(to);

    console.log("[mailService] Preparing dynamic OTP email:", {
      to: recipient,
      from: env.smtp.from,
      hasOtp: Boolean(otp),
      name,
    });

    const smtp = createTransporter();

    const mailOptions = {
      from: env.smtp.from || process.env.SMTP_USER,
      to: recipient,
      subject: "Your OTP Code",
      text: `Your OTP Code is ${otp}. This OTP is valid for 5 minutes.`,
      html: buildOtpTemplate(otp, name),
    };

    console.log("[mailService] Sending OTP email via Gmail SMTP...");
    const info = await smtp.sendMail(mailOptions);

    console.log("✅ [mailService] OTP email delivered:", {
      recipient,
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
      response: info.response,
    });

    if (!info.accepted || !info.accepted.length) {
      const error = new Error("Gmail SMTP did not accept the recipient");
      error.code = "SMTP_RECIPIENT_REJECTED";
      error.response = info.response;
      throw error;
    }

    return info;
  } catch (error) {
    console.error(`❌ [mailService] Failed to send OTP email to ${to}`);
    console.error("   Error Message:", error.message);
    console.error("   Error Code:", error.code);
    console.error("   SMTP Response:", error.response);
    console.error("   Full Error:", error);

    if (error.code === "EAUTH") {
      console.error("   Likely cause: Gmail rejected SMTP_USER/SMTP_PASS.");
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("   Likely cause: dotenv did not load SMTP_USER/SMTP_PASS.");
    }

    throw error;
  }
};

module.exports = {
  verifyTransporter,
  sendOtpEmail,
  createTransporter,
};
