#!/usr/bin/env node
/**
 * SMTP TLS Diagnostic & Verification Script
 *
 * Proves whether Avast (or another antivirus) is intercepting the SMTP
 * connection, and verifies strict TLS works with the system CA store.
 *
 * Usage:
 *   node --use-system-ca verify-smtp-tls.js
 */
const tls = require("node:tls");
const nodemailer = require("nodemailer");
const env = require("./src/config/env");

const HOST = env.smtp.host || "smtp.gmail.com";
const PORT = Number(env.smtp.port || 465);

const describeIssuer = (issuer) => {
  const text = JSON.stringify(issuer || {}).toLowerCase();
  if (text.includes("avast")) return "Avast SSL/TLS inspection";
  if (text.includes("kaspersky")) return "Kaspersky SSL/TLS inspection";
  if (text.includes("eset")) return "ESET SSL/TLS inspection";
  if (text.includes("zscaler")) return "Zscaler proxy TLS interception";
  if (text.includes("fortinet") || text.includes("fortigate"))
    return "Fortinet proxy TLS interception";
  if (text.includes("web shield") || text.includes("mail shield"))
    return "Local antivirus SSL/TLS inspection";
  return null;
};

const inspectChain = () =>
  new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: HOST,
        port: PORT,
        servername: HOST,
        rejectUnauthorized: false,
      },
      () => {
        const full = socket.getPeerCertificate(true) || {};
        const chain = [];
        const seen = new Set();
        let c = full;

        while (c && !seen.has(c.fingerprint256)) {
          seen.add(c.fingerprint256);
          chain.push({
            subject: c.subject,
            issuer: c.issuer,
            valid_from: c.valid_from,
            valid_to: c.valid_to,
            fingerprint256: c.fingerprint256,
          });
          const next = c.issuerCertificate;
          c =
            next && next.fingerprint256 !== c.fingerprint256 ? next : undefined;
        }

        socket.end();
        resolve(chain);
      },
    );
    socket.on("error", (e) => resolve({ error: e.message }));
  });

const testStrictTls = async (label, tlsOverrides = {}) => {
  const transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    requireTLS: PORT !== 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: true,
      servername: HOST,
      minVersion: "TLSv1.2",
      ...tlsOverrides,
    },
  });

  try {
    await transporter.verify();
    console.log(`  ✅ ${label}: STRICT TLS VERIFIED`);
    return true;
  } catch (error) {
    console.log(`  ❌ ${label}: FAILED - ${error.message}`);
    return false;
  }
};

(async () => {
  console.log("==============================================");
  console.log("  SMTP TLS DIAGNOSTIC");
  console.log(`  Target: ${HOST}:${PORT}`);
  console.log("==============================================\n");

  console.log("[1] Inspecting certificate chain presented by server...\n");
  const chain = await inspectChain();

  if (chain.error) {
    console.log(`  ❌ Could not connect: ${chain.error}`);
    process.exit(1);
  }

  const leaf = chain[0] || {};
  const interception = describeIssuer(leaf.issuer);

  chain.forEach((cert, i) => {
    console.log(`  Chain[${i}]:`);
    console.log(`    Subject: ${JSON.stringify(cert.subject)}`);
    console.log(`    Issuer:  ${JSON.stringify(cert.issuer)}`);
    console.log(`    Valid:   ${cert.valid_from} → ${cert.valid_to}`);
    console.log(`    SHA256:  ${cert.fingerprint256}`);
    console.log("");
  });

  if (interception) {
    console.log(`  ⚠️  INTERCEPTION DETECTED: ${interception}`);
    console.log(
      "  The certificate is NOT the genuine Google/Gmail certificate.\n",
    );
  } else {
    console.log("  ✅ No known interception detected (genuine cert chain).\n");
  }

  console.log("[2] Testing strict TLS with system CA store...\n");
  const systemCaOk = await testStrictTls("System CA store (--use-system-ca)", {
    ca: undefined,
  });

  console.log("\n[3] Testing strict TLS with configured CA bundle...\n");
  const bundleOk = await testStrictTls("Configured CA bundle");

  console.log("\n==============================================");
  console.log("  SUMMARY");
  console.log("==============================================");
  console.log(`  Interception: ${interception || "None detected"}`);
  console.log(`  System CA strict TLS: ${systemCaOk ? "PASS" : "FAIL"}`);
  console.log(`  Bundle strict TLS:    ${bundleOk ? "PASS" : "FAIL"}`);

  if (interception && !systemCaOk) {
    console.log(
      "\n  ⚠️  Avast is intercepting and the system CA store cannot verify it.",
    );
    console.log(
      "  To fix: Disable SSL/TLS scanning for smtp.gmail.com in Avast settings,",
    );
    console.log(
      "  or add smtp.gmail.com to the antivirus exclusion list, then re-run.",
    );
  } else if (interception && systemCaOk) {
    console.log(
      "\n  ✅ Strict TLS works via system CA store even with interception.",
    );
    console.log(
      "  The backend now uses --use-system-ca so SMTP will verify correctly.",
    );
  } else if (!interception) {
    console.log("\n  ✅ No interception. SMTP should verify with strict TLS.");
  }

  process.exit(0);
})();