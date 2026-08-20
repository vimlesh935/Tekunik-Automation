#!/usr/bin/env node
const { verifyTransporter } = require("../src/services/mailService");

(async () => {
  try {
    console.log("[test] Starting SMTP verification...");
    await verifyTransporter();
    console.log("[test] SMTP verification completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[test] SMTP verification failed:", error && error.message);
    if (error && error.code) console.error("[test] Error code:", error.code);
    process.exit(1);
  }
})();
