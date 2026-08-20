const fs = require("node:fs");
const tls = require("node:tls");
const { X509Certificate } = require("node:crypto");
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

  const tlsOptions = {
    rejectUnauthorized: env.smtp.tlsRejectUnauthorized,
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
  const smtpUser = normalizeSmtpUser(env.smtp.user);
  const smtpPass = normalizeSmtpPass(env.smtp.pass);

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

      const certificateInfo = await inspectServerCertificate(config);
      const interceptionSource =
        describeCertificateInterception(certificateInfo);

      if (interceptionSource) {
        console.warn(
          `[mailService] Detected TLS interception source: ${interceptionSource}. Issuer: ${JSON.stringify(certificateInfo.issuer)}`,
        );

        // Self-healing: extract the CURRENT root CA directly from the TLS
        // handshake chain, merge it into the bundle, and retry strict TLS.
        // The "Untrusted Root" is explicitly excluded — it must never be
        // trusted. This handles Avast rotating its root CA without needing
        // any external process (PowerShell may be unavailable).
        if (interceptionSource.includes("Avast") && env.smtp.caCertPath) {
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
                `[mailService] Updated ${certPath} with current Avast root CA from TLS chain. Retrying strict TLS...`,
              );

              const retryTransporter = createTransportFromConfig(config);
              await retryTransporter.verify();

              transporter = retryTransporter;
              activeTransportLabel = config.label;
              console.warn(
                `✅ [mailService] SMTP verified via ${config.label} after updating CA bundle`,
              );
              return;
            } catch (retryError) {
              console.warn(
                `[mailService] Strict TLS retry after CA extraction failed: ${retryError.message}`,
              );
            }
          }
        }
      }

      // Attempt 2: strict TLS using the system CA store (no custom bundle).
      // With --use-system-ca, Node trusts the Windows root store, which
      // contains Google's genuine Gmail roots. This succeeds when the
      // interception is disabled or when the custom bundle is stale.
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
        console.error(
          `❌ [mailService] Strict TLS via system CA failed via ${config.label}: ${systemCaError.message}`,
        );
      }

      // Only relax TLS if the operator explicitly opted in via
      // SMTP_ALLOW_SELF_SIGNED=true. Never relax silently.
      if (
        env.smtp.allowSelfSignedFallback &&
        env.smtp.tlsRejectUnauthorized &&
        isSelfSignedError
      ) {
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
      } else {
        console.error(
          `❌ [mailService] Strict TLS verification failed via ${config.label}: ${error.message}`,
        );
        if (interceptionSource) {
          console.error(
            `   Cause: ${interceptionSource} is intercepting the SMTP connection and presenting a certificate that cannot be verified.`,
          );
          console.error(
            "   Fix: Disable SSL/TLS scanning for smtp.gmail.com in your antivirus settings, or",
          );
          console.error(
            "   explicitly set SMTP_ALLOW_SELF_SIGNED=true only if you accept the risk on a trusted network.",
          );
        } else {
          console.error(
            "   Fix: Ensure SMTP_CA_CERT_PATH points to a valid CA bundle, or disable SSL/TLS interception.",
          );
        }
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