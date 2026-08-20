const tls = require("node:tls");

const socket = tls.connect(
  {
    host: "smtp.gmail.com",
    port: 465,
    servername: "smtp.gmail.com",
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
        serialNumber: c.serialNumber,
        pem: c.raw ? c.raw.toString("base64") : null,
      });

      const next = c.issuerCertificate;
      if (!next || next.fingerprint256 === c.fingerprint256) {
        c = undefined;
      } else {
        c = next;
      }
    }

    console.log(JSON.stringify(
      chain.map(({ pem, ...rest }) => rest),
      null,
      2
    ));
    console.log("\n=== PEM BLOCKS ===\n");
    chain.forEach((entry, i) => {
      console.log(`--- Chain[${i}] (${entry.subject?.CN || "unknown"}) ---`);
      console.log(`-----BEGIN CERTIFICATE-----`);
      const raw = entry.pem;
      for (let j = 0; j < raw.length; j += 64) {
        console.log(raw.slice(j, j + 64));
      }
      console.log(`-----END CERTIFICATE-----`);
    });

    socket.end();
    process.exit(0);
  },
);

socket.on("error", (e) => {
  console.error("ERR", e.message);
  process.exit(1);
});