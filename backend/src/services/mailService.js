const fs = require("node:fs");
const tls = require("node:tls");
const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;
let activeTransportLabel = null;
let cachedCaCert = undefined;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeRecipient = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const normalizeSmtpUser = (value) => String(value || "").trim();
const normalizeSmtpPass = (value) => String(value || "").replace(/\s+/g, "");

const assertValidRecipient = (to) => {
  const recipient = normalizeRecipient(to);

  if (!emailRegex.test(recipient)) {
    const error = new Error("Invalid email address");
    error.statusCode = 400;
    error.code = "INVALID_EMAIL";
    throw error;
  }

  return recipient;
};

const getSmtpCandidates = () => {
  const configuredHost = String(env.smtp.host || "").trim();
  const configuredPort = Number(env.smtp.port || 0);
  const hasCustomConfig = Boolean(configuredHost || configuredPort);

  if (hasCustomConfig) {
    const port = configuredPort || 465;
    const secure =
      typeof env.smtp.secure === "boolean" ? env.smtp.secure : port === 465;

    return [
      {
        label: `${configuredHost || "smtp.gmail.com"}:${port} (custom)`,
        host: configuredHost || "smtp.gmail.com",
        port,
        secure,
        requireTLS: !secure,
      },
    ];
  }

  // Gmail fallback strategy:
  // 1) SMTPS 465 (preferred)
  // 2) STARTTLS 587 (fallback when 465 is blocked)
  return [
    {
      label: "smtp.gmail.com:465 (SSL)",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      requireTLS: false,
    },
    {
      label: "smtp.gmail.com:587 (STARTTLS)",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
    },
  ];
};

const readConfiguredCaCert = () => {
  if (cachedCaCert !== undefined) return cachedCaCert;

  const certPath = String(env.smtp.caCertPath || "").trim();
  if (!certPath) {
    cachedCaCert = null;
    return cachedCaCert;
  }

  try {
    cachedCaCert = fs.readFileSync(certPath, "utf8");
    return cachedCaCert;
  } catch (error) {
    cachedCaCert = null;
    console.warn(
      `[mailService] Could not read SMTP_CA_CERT_PATH (${certPath}): ${error.message}`,
    );
    return cachedCaCert;
  }
};

const createTransportFromConfig = (config, tlsOverrides = {}) => {
  const smtpUser = normalizeSmtpUser(env.smtp.user);
  const smtpPass = normalizeSmtpPass(env.smtp.pass);
  const caCert = readConfiguredCaCert();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTLS,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: Number(env.smtp.connectionTimeout || 10000),
    greetingTimeout: Number(env.smtp.greetingTimeout || 10000),
    socketTimeout: Number(env.smtp.socketTimeout || 15000),
    tls: {
      rejectUnauthorized: env.smtp.tlsRejectUnauthorized,
      ...(caCert ? { ca: caCert } : {}),
      ...tlsOverrides,
    },
  });
};

const assertSmtpCredentials = () => {
  const smtpUser = normalizeSmtpUser(env.smtp.user);
  const smtpPass = normalizeSmtpPass(env.smtp.pass);

  if (!smtpUser || !smtpPass) {
    const error = `SMTP Configuration Error: SMTP_USER=${smtpUser ? "SET" : "NOT SET"}, SMTP_PASS=${smtpPass ? "SET" : "NOT SET"}`;
    console.error("[mailService] " + error);
    throw new Error(error);
  }
};

const createTransporter = () => {
  assertSmtpCredentials();

  if (!transporter) {
    const [primaryConfig] = getSmtpCandidates();

    console.log("[mailService] Initializing SMTP transporter with:");
    console.log(`  - SMTP User: ${normalizeSmtpUser(env.smtp.user)}`);
    console.log(
      `  - SMTP Pass: ${env.smtp.pass ? `${normalizeSmtpPass(env.smtp.pass).substring(0, 3)}***` : "NOT SET"}`,
    );
    console.log(`  - OTP From: ${env.smtp.from || "NOT SET"}`);
    console.log(
      `  - TLS Reject Unauthorized: ${env.smtp.tlsRejectUnauthorized}`,
    );
    console.log(`  - Transport: ${primaryConfig.label}`);

    transporter = createTransportFromConfig(primaryConfig);
    activeTransportLabel = primaryConfig.label;
  }

  return transporter;
};

const isSelfSignedCertificateError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toUpperCase();

  return (
    message.includes("self-signed certificate") ||
    message.includes("unable to verify the first certificate") ||
    message.includes("unable to verify leaf signature") ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "CERT_UNTRUSTED" ||
    code === "SELF_SIGNED_CERT_IN_CHAIN" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT"
  );
};

const inspectServerCertificate = (config) =>
  new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: config.host,
        port: config.port,
        servername: config.host,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate(true) || {};
        const issuer = cert.issuer || {};
        const subject = cert.subject || {};

        socket.end();
        resolve({
          issuer,
          subject,
          authorizationError: socket.authorizationError || null,
          fingerprint256: cert.fingerprint256 || null,
        });
      },
    );

    socket.on("error", () => {
      resolve(null);
    });
  });

const describeCertificateInterception = (certificateInfo) => {
  if (!certificateInfo?.issuer) return null;

  const issuerText = JSON.stringify(certificateInfo.issuer).toLowerCase();

  if (issuerText.includes("avast")) {
    return "Avast SSL/TLS inspection";
  }
  if (issuerText.includes("kaspersky")) {
    return "Kaspersky SSL/TLS inspection";
  }
  if (issuerText.includes("eset")) {
    return "ESET SSL/TLS inspection";
  }
  if (issuerText.includes("zscaler")) {
    return "Zscaler proxy TLS interception";
  }
  if (issuerText.includes("fortinet") || issuerText.includes("fortigate")) {
    return "Fortinet proxy TLS interception";
  }
  if (issuerText.includes("web shield") || issuerText.includes("mail shield")) {
    return "Local antivirus SSL/TLS inspection";
  }

  return null;
};

const verifyTransporter = async () => {
  assertSmtpCredentials();

  const candidates = getSmtpCandidates();
  const errors = [];

  for (const config of candidates) {
    try {
      console.log(
        `[mailService] Verifying SMTP transporter via ${config.label}...`,
      );
      const candidateTransporter = createTransportFromConfig(config);
      await candidateTransporter.verify();

      transporter = candidateTransporter;
      activeTransportLabel = config.label;

      console.log(
        `✅ [mailService] SMTP transporter verified successfully via ${config.label}`,
      );
      return;
    } catch (error) {
      errors.push({ config: config.label, error });

      const isSelfSignedError = isSelfSignedCertificateError(error);
      const shouldTryFallback =
        env.smtp.allowSelfSignedFallback &&
        env.smtp.tlsRejectUnauthorized &&
        isSelfSignedError;

      if (!shouldTryFallback) {
        console.error(
          `❌ [mailService] Verification failed via ${config.label}: ${error.message}`,
        );
        continue;
      }

      const certificateInfo = await inspectServerCertificate(config);
      const interceptionSource =
        describeCertificateInterception(certificateInfo);

      if (interceptionSource) {
        console.warn(
          `[mailService] Detected TLS interception source: ${interceptionSource}. Issuer: ${JSON.stringify(certificateInfo.issuer)}`,
        );
      }

      if (env.smtp.caCertPath) {
        console.warn(
          `[mailService] Strict TLS verification failed via ${config.label}. A CA certificate is configured, but verification still failed: ${error.message}`,
        );
      } else {
        console.warn(
          `[mailService] Strict TLS verification failed via ${config.label} (${error.message}). Retrying with relaxed TLS...`,
        );
        console.warn(
          "[mailService] Tip: export the interceptor/root CA as PEM and set SMTP_CA_CERT_PATH to keep strict TLS enabled.",
        );
      }

      try {
        const relaxedTlsTransporter = createTransportFromConfig(config, {
          rejectUnauthorized: false,
          ca: undefined,
        });
        await relaxedTlsTransporter.verify();

        transporter = relaxedTlsTransporter;
        activeTransportLabel = `${config.label} [TLS relaxed]`;

        console.warn(
          `⚠️ [mailService] SMTP verified via ${activeTransportLabel}. This is less secure and should only be used in trusted networks.`,
        );
        return;
      } catch (relaxedTlsError) {
        errors.push({
          config: `${config.label} [TLS relaxed]`,
          error: relaxedTlsError,
        });
        console.error(
          `❌ [mailService] Verification failed via ${config.label} [TLS relaxed]: ${relaxedTlsError.message}`,
        );
      }
    }
  }

  const last =
    errors[errors.length - 1]?.error || new Error("SMTP verification failed");
  console.error("❌ [mailService] SMTP Verification Failed:");
  console.error("   Error Message:", last.message);
  console.error("   Error Code:", last.code);
  console.error("   SMTP Response:", last.response);
  console.error(
    "   Attempts:",
    errors.map((entry) => entry.config).join(" -> "),
  );
  console.error("   Common fixes:");
  console.error("   1. Check SMTP_USER and SMTP_PASS in backend/.env");
  console.error(
    "   2. Use a Gmail App Password, not your normal Gmail password",
  );
  console.error(
    "   3. Ensure Gmail 2FA is enabled before creating an App Password",
  );
  console.error(
    "   4. If port 465 is blocked, allow outbound SMTP or use port 587",
  );
  console.error(
    "   5. Provide trusted CA chain via SMTP_CA_CERT_PATH to keep strict TLS",
  );
  console.error(
    "   6. Dev-only fallback: set SMTP_ALLOW_SELF_SIGNED=true (trusted networks only)",
  );

  throw last;
};

const buildOtpTemplate = (otp, name = "User") => `
  <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
    <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e6eaf0;">
      <h2 style="margin:0 0 12px;color:#111827;">Password Reset OTP</h2>
      <p style="color:#374151;font-size:15px;">Hi ${name},</p>
      <p style="color:#374151;font-size:15px;">Use this 6-digit OTP to reset your password. It is valid for 10 minutes.</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;background:#f3f4f6;border-radius:10px;padding:16px;text-align:center;margin:24px 0;">
        ${otp}
      </div>
      <p style="color:#6b7280;font-size:13px;">If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  </div>
`;

const sendOtpEmail = async ({ to, otp, name }) => {
  try {
    const recipient = assertValidRecipient(to);

    console.log("[mailService] Preparing OTP email:", {
      to: recipient,
      from: env.smtp.from,
      hasOtp: Boolean(otp),
      name,
      transport: activeTransportLabel,
    });

    const smtp = createTransporter();

    const mailOptions = {
      from: env.smtp.from || normalizeSmtpUser(env.smtp.user),
      to: recipient,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}\n\nThis OTP expires in 10 minutes.\n\nIf you did not request a password reset, ignore this email.`,
      html: buildOtpTemplate(otp, name),
    };

    console.log("[mailService] Sending OTP email via SMTP...");
    const info = await smtp.sendMail(mailOptions);

    console.log("✅ [mailService] OTP email delivered:", {
      recipient,
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
      response: info.response,
      transport: activeTransportLabel,
    });

    if (!info.accepted || !info.accepted.length) {
      const error = new Error("SMTP did not accept the recipient");
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
    console.error("   Active Transport:", activeTransportLabel);

    if (error.code === "EAUTH") {
      console.error(
        "   Likely cause: SMTP_USER/SMTP_PASS were rejected by provider.",
      );
    }

    throw error;
  }
};

module.exports = {
  verifyTransporter,
  sendOtpEmail,
  createTransporter,
};
