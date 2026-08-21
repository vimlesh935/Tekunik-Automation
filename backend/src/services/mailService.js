const fs = require("node:fs");
const tls = require("node:tls");
const { X509Certificate } = require("node:crypto");
const nodemailer = require("nodemailer");
const env = require("../config/env");
const settingsService = require("../config/settingsService");

let transporter;
let activeTransportLabel = null;
let cachedCaCert = undefined;
let currentSmtp = null;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

// Effective SMTP config: database (settingsService) preferred, .env fallback.
// The DB value wins once set — see settingsService precedence model.
const refreshSmtpSettings = async () => {
  const [host, port, user, pass, from, secure, tlsRejectUnauthorized, allowSelfSignedFallback] =
    await Promise.all([
      settingsService.get("smtp.host"),
      settingsService.getNumber("smtp.port"),
      settingsService.get("smtp.user"),
      settingsService.get("smtp.pass"),
      settingsService.get("smtp.from"),
      settingsService.getBool("smtp.secure"),
      settingsService.getBool("smtp.tlsRejectUnauthorized"),
      settingsService.getBool("smtp.allowSelfSignedFallback"),
    ]);

  const normalizedPort = Number(port) || 465;
  currentSmtp = {
    host: String(host || "smtp.gmail.com").trim(),
    port: normalizedPort,
    secure: Boolean(secure) || normalizedPort === 465,
    user: normalizeSmtpUser(user),
    pass: normalizeSmtpPass(pass),
    from: normalizeSmtpUser(from),
    tlsRejectUnauthorized: Boolean(tlsRejectUnauthorized),
    allowSelfSignedFallback: Boolean(allowSelfSignedFallback),
  };
};

const ensureSmtpReady = async () => {
  if (!currentSmtp) await refreshSmtpSettings();
  return currentSmtp;
};

/** Reinitialize the mail service after settings changes (no restart needed). */
const resetTransporter = async () => {
  transporter = null;
  activeTransportLabel = null;
  await refreshSmtpSettings();
};

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

const getSmtpCandidates = async () => {
  const smtp = await ensureSmtpReady();
  const configuredHost = smtp.host;
  const configuredPort = smtp.port;
  const hasCustomConfig = Boolean(configuredHost || configuredPort);

  if (hasCustomConfig) {
    const port = configuredPort || 465;
    const secure = smtp.secure !== false ? smtp.secure : port === 465;

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

const parsePemCertificates = (pemContent) => {
  const certs = [];
  const blockRegex = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g;
  let match;

  while ((match = blockRegex.exec(pemContent)) !== null) {
    const base64 = match[1].replace(/\s+/g, "");
    if (!base64) continue;

    try {
      const raw = Buffer.from(base64, "base64");
      const x509 = new X509Certificate(raw);
      certs.push({ raw, x509 });
    } catch (error) {
      console.warn(
        `[mailService] Skipping unparseable certificate in CA bundle: ${error.message}`,
      );
    }
  }

  return certs;
};

const filterValidCaCertificates = (certificates) => {
  const now = new Date();
  const validCerts = [];

  for (const { raw, x509 } of certificates) {
    const subject = x509.subject || "unknown";
    const validFrom = new Date(x509.validFrom);
    const validTo = new Date(x509.validTo);
    const isCa = Boolean(x509.ca);

    if (!isCa) {
      console.warn(
        `[mailService] Skipping non-CA certificate in CA bundle (${subject})`,
      );
      continue;
    }

    if (now < validFrom || now > validTo) {
      console.warn(
        `[mailService] Skipping ${now > validTo ? "expired" : "not-yet-valid"} CA certificate in bundle (${subject}, valid ${x509.validFrom} → ${x509.validTo})`,
      );
      continue;
    }

    validCerts.push(raw);
  }

  return validCerts;
};

const readConfiguredCaCert = () => {
  if (cachedCaCert !== undefined) return cachedCaCert;

  const certPath = String(env.smtp.caCertPath || "").trim();
  if (!certPath) {
    cachedCaCert = null;
    return cachedCaCert;
  }

  try {
    // Read the PEM bundle as text so we can validate each cert individually
    const pemContent = fs.readFileSync(certPath, "utf8");
    const parsedCerts = parsePemCertificates(pemContent);
    const validCaCerts = filterValidCaCertificates(parsedCerts);

    if (parsedCerts.length > 0 && validCaCerts.length === 0) {
      cachedCaCert = null;
      console.error(
        `[mailService] SMTP_CA_CERT_PATH (${certPath}) contains ${parsedCerts.length} certificate(s), but NONE are valid CA certificates currently in their validity window. ` +
          "The system CA store will be used instead. Export the current root CA as PEM to keep the custom bundle working.",
      );
      return cachedCaCert;
    }

    // Prefer passing as an array of Buffers so Node tls connects accepts each cert
    cachedCaCert = validCaCerts.length > 0 ? validCaCerts : null;
    return cachedCaCert;
  } catch (error) {
    cachedCaCert = null;
    console.warn(
      `[mailService] Could not read SMTP_CA_CERT_PATH (${certPath}): ${error.message}`,
    );
    return cachedCaCert;
  }
};

const buildTlsOptions = (config, tlsOverrides = {}) => {
  const caCert = readConfiguredCaCert();
  const rejectUnauthorized = Boolean(currentSmtp?.tlsRejectUnauthorized);

  const tlsOptions = {
    rejectUnauthorized,
    // Ensure SNI matches the configured host and require modern TLS
    servername: config.host,
    minVersion: "TLSv1.2",
    ...(caCert ? { ca: caCert } : {}),
    ...tlsOverrides,
  };

  // If the relaxed fallback explicitly passes `ca`, respect it; otherwise
  // ensure `rejectUnauthorized: false` never carries a stale CA list.
  if (tlsOptions.rejectUnauthorized === false && !tlsOverrides.ca && caCert) {
    delete tlsOptions.ca;
  }

  return tlsOptions;
};

const createTransportFromConfig = (config, tlsOverrides = {}) => {
  const smtpUser = normalizeSmtpUser(currentSmtp?.user);
  const smtpPass = normalizeSmtpPass(currentSmtp?.pass);

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
    tls: buildTlsOptions(config, tlsOverrides),
  });
};

const assertSmtpCredentials = () => {
  const smtpUser = normalizeSmtpUser(currentSmtp?.user);
  const smtpPass = normalizeSmtpPass(currentSmtp?.pass);

  if (!smtpUser || !smtpPass) {
    const error = `SMTP Configuration Error: SMTP_USER=${smtpUser ? "SET" : "NOT SET"}, SMTP_PASS=${smtpPass ? "SET" : "NOT SET"}`;
    console.error("[mailService] " + error);
    throw new Error(error);
  }
};

const createTransporter = async () => {
  await ensureSmtpReady();
  assertSmtpCredentials();

  if (!transporter) {
    const [primaryConfig] = await getSmtpCandidates();

    console.log("[mailService] Initializing SMTP transporter with:");
    console.log(`  - Host/Port: ${currentSmtp.host}:${currentSmtp.port} (secure=${currentSmtp.secure})`);
    console.log(`  - SMTP User: ${normalizeSmtpUser(currentSmtp.user)}`);
    console.log(
      `  - SMTP Pass: ${currentSmtp.pass ? `${normalizeSmtpPass(currentSmtp.pass).substring(0, 3)}***` : "NOT SET"}`,
    );
    console.log(`  - OTP From: ${currentSmtp.from || "NOT SET"}`);
    console.log(
      `  - TLS Reject Unauthorized: ${currentSmtp.tlsRejectUnauthorized}`,
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
        const full = socket.getPeerCertificate(true) || {};
        const issuer = full.issuer || {};
        const subject = full.subject || {};

        // Walk the chain from leaf to root, collecting raw certs.
        const chain = [];
        const seen = new Set();
        let c = full;
        while (c && !seen.has(c.fingerprint256)) {
          seen.add(c.fingerprint256);
          chain.push({
            subject: c.subject,
            issuer: c.issuer,
            fingerprint256: c.fingerprint256,
            raw: c.raw ? Buffer.from(c.raw) : null,
          });
          const next = c.issuerCertificate;
          c =
            next && next.fingerprint256 !== c.fingerprint256 ? next : undefined;
        }

        socket.end();
        resolve({
          issuer,
          subject,
          authorizationError: socket.authorizationError || null,
          fingerprint256: full.fingerprint256 || null,
          chain,
        });
      },
    );

    socket.on("error", () => {
      resolve(null);
    });
  });

const rawToPem = (raw) => {
  const b64 = raw.toString("base64");
  const body = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${body.join("\n")}\n-----END CERTIFICATE-----`;
};

const isUntrustedAvastRoot = (x509) => {
  const subject = String(x509.subject || "").toLowerCase();
  return subject.includes("untrusted");
};

// Extract the root CA directly from the TLS handshake chain. The last
// self-signed cert in the chain is the root that signed the presented
// leaf. This avoids any dependency on external processes (PowerShell).
const extractRootFromChain = (chain) => {
  if (!Array.isArray(chain) || chain.length === 0) return null;

  // The root is the last cert in the chain whose subject == issuer
  // (self-signed). Fall back to the last cert if none is self-signed.
  const selfSigned = chain.find(
    (c) =>
      c.raw &&
      c.subject &&
      c.issuer &&
      JSON.stringify(c.subject) === JSON.stringify(c.issuer),
  );
  const root = selfSigned || chain[chain.length - 1];
  if (!root || !root.raw) return null;

  try {
    const x509 = new X509Certificate(root.raw);
    if (isUntrustedAvastRoot(x509)) return null; // never trust "Untrusted Root"
    return rawToPem(root.raw);
  } catch {
    return null;
  }
};

const mergePemBundles = (existing, newPem) => {
  const existingCerts = parsePemCertificates(existing);
  const newCerts = parsePemCertificates(newPem);
  const existingFingerprints = new Set(
    existingCerts.map(({ x509 }) => x509.fingerprint256),
  );
  const uniqueNew = newCerts.filter(
    ({ x509 }) =>
      !existingFingerprints.has(x509.fingerprint256) &&
      !isUntrustedAvastRoot(x509),
  );
  if (uniqueNew.length === 0) return existing;

  const newBlocks = uniqueNew.map(({ raw }) => rawToPem(raw));
  return existing.trim()
    ? `${existing.trim()}\n${newBlocks.join("\n")}\n`
    : `${newBlocks.join("\n")}\n`;
};

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
  await ensureSmtpReady();
  assertSmtpCredentials();

  const candidates = await getSmtpCandidates();
  const errors = [];

  const isCertError = (err) =>
    isSelfSignedCertificateError(err) ||
    /unable (to )?(get|obtain) (the )?local issuer|certificate has expired|certificate not yet valid|root store|ca md too weak/i.test(
      String(err?.message || ""),
    );

  for (const config of candidates) {
    console.log(
      `[mailService] Verifying SMTP transporter via ${config.label}...`,
    );

    // Attempt 1: strict TLS using the configured CA bundle (if any).
    try {
      const strictTransporter = createTransportFromConfig(config);
      await strictTransporter.verify();

      transporter = strictTransporter;
      activeTransportLabel = config.label;

      console.log(
        `✅ [mailService] SMTP transporter verified successfully via ${config.label}`,
      );
      return;
    } catch (strictError) {
      errors.push({ config: config.label, error: strictError });
    }

    const certIssue = isCertError(errors[errors.length - 1]?.error);
    const certificateInfo = certIssue
      ? await inspectServerCertificate(config)
      : null;
    const interceptionSource = certificateInfo
      ? describeCertificateInterception(certificateInfo)
      : null;

    if (interceptionSource && env.smtp.caCertPath) {
      console.warn(
        `[mailService] TLS interception detected: ${interceptionSource} (issuer: ${JSON.stringify(certificateInfo.issuer)}). ` +
          "This certificate chain cannot be verified by strict TLS.",
      );

      // Self-healing is opt-in (SMTP_CA_SELF_HEAL=true) and OFF by default so
      // SMTP_CA_CERT_PATH is never rewritten automatically at runtime. Even
      // when enabled it is often futile for Avast: its self-signed root fails
      // SELF_SIGNED_CERT_IN_CHAIN even when explicitly trusted.
      if (env.smtp.caSelfHeal) {
        const rootPem = extractRootFromChain(certificateInfo.chain);
        if (rootPem) {
          try {
            const certPath = env.smtp.caCertPath;
            const existing = fs.existsSync(certPath)
              ? fs.readFileSync(certPath, "utf8")
              : "";
            const merged = mergePemBundles(existing, rootPem);
            fs.writeFileSync(certPath, merged);
            cachedCaCert = undefined; // invalidate cached CA list
            console.warn(
              `[mailService] Updated ${certPath} with root CA extracted from TLS chain (SMTP_CA_SELF_HEAL=true).`,
            );
          } catch (writeError) {
            console.warn(
              `[mailService] Could not update ${certPath}: ${writeError.message}`,
            );
          }
        }
      }
    }

    // Attempt 2: strict TLS using the system CA store (no custom bundle).
    // With --use-system-ca, Node trusts the platform root store, which
    // contains the genuine provider roots. This succeeds once the custom
    // bundle is stale/missing or when interception is absent.
    try {
      const systemCaTransporter = createTransportFromConfig(config, {
        ca: undefined,
      });
      await systemCaTransporter.verify();

      transporter = systemCaTransporter;
      activeTransportLabel = `${config.label} [system CA]`;

      console.log(
        `✅ [mailService] SMTP verified via ${activeTransportLabel}`,
      );
      return;
    } catch (systemCaError) {
      errors.push({
        config: `${config.label} [system CA]`,
        error: systemCaError,
      });
    }

    // Attempt 3: relaxed TLS ONLY when the operator explicitly opted in via
    // SMTP_ALLOW_SELF_SIGNED=true. Never relax silently.
    if (env.smtp.allowSelfSignedFallback && env.smtp.tlsRejectUnauthorized) {
      try {
        const relaxedTlsTransporter = createTransportFromConfig(config, {
          rejectUnauthorized: false,
          ca: undefined,
        });
        await relaxedTlsTransporter.verify();

        transporter = relaxedTlsTransporter;
        activeTransportLabel = `${config.label} [TLS relaxed]`;

        console.warn(
          `⚠️ [mailService] SMTP verified via ${activeTransportLabel}. Less secure; only enabled because SMTP_ALLOW_SELF_SIGNED=true is set.`,
        );
        return;
      } catch (relaxedTlsError) {
        errors.push({
          config: `${config.label} [TLS relaxed]`,
          error: relaxedTlsError,
        });
      }
    }

    // This candidate is unusable — report concisely and move on. The full
    // error report is printed only if every candidate fails.
    const lastError = errors[errors.length - 1]?.error;
    console.warn(
      `[mailService] Skipping ${config.label}: ${lastError?.message || lastError}`,
    );
    if (interceptionSource) {
      console.warn(
        `   Cause: ${interceptionSource} is intercepting the SMTP connection and presenting a certificate beyond the reach of strict TLS verification.`,
      );
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

const getSmtpStatus = () => {
  const maskedUser = (value) => {
    const user = normalizeSmtpUser(value);
    if (!user) return null;
    const at = user.lastIndexOf("@");
    if (at > 1) return `${user.slice(0, 1)}***${user.slice(at)}`;
    return user;
  };

  const smtp = currentSmtp || {};

  return {
    configured: Boolean(smtp.user && smtp.pass),
    host: String(smtp.host || "smtp.gmail.com").trim(),
    port: Number(smtp.port || 465),
    secure: smtp.secure === false ? false : true,
    user: maskedUser(smtp.user),
    from: String(smtp.from || "").trim() || null,
    tlsRejectUnauthorized: Boolean(smtp.tlsRejectUnauthorized),
    allowSelfSignedFallback: Boolean(smtp.allowSelfSignedFallback),
    activeTransport: activeTransportLabel,
  };
};

const sendOtpEmail = async ({ to, otp, name }) => {
  try {
    const recipient = assertValidRecipient(to);

    console.log("[mailService] Preparing OTP email:", {
      to: recipient,
      from: currentSmtp?.from || "<env fallback>",
      hasOtp: Boolean(otp),
      name,
      transport: activeTransportLabel,
    });

    const smtp = await createTransporter();

    const mailOptions = {
      from: currentSmtp?.from || normalizeSmtpUser(currentSmtp?.user),
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
  getSmtpStatus,
  resetTransporter,
};