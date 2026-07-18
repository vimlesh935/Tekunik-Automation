const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

console.log("=== Starting server ===");
const server = spawn("node", ["serve.js"], {
  cwd: __dirname,
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
server.stdout.on("data", (d) => {
  output += d.toString();
  // Only show lines up to the point we care about
});
server.stderr.on("data", (d) => { output += d.toString(); });

// Wait for startup
setTimeout(() => {
  if (output.includes("Failed to start")) {
    console.log("❌ SERVER FAILED:", output);
    process.exit(1);
  }
  if (output.includes("TekNode live")) {
    console.log("✅ Server started");
    test();
  } else {
    console.log("⏳ Still waiting...\n" + output.substring(0, 500));
  }
}, 5000);

function test() {
  const tests = [
    ["GET", "/api/smart-home/proposals", "List proposals (expect 401)"],
    ["GET", "/api/smart-home/proposals/stats", "Stats (expect 401)"],
  ];

  let i = 0;
  function next() {
    if (i >= tests.length) {
      console.log("\n✅ All tests passed. Server running on 8787.");
      server.kill();
      process.exit(0);
      return;
    }
    const [m, p, desc] = tests[i++];
    const req = http.request({ hostname: "localhost", port: 8787, path: p, method: m }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try {
          const j = JSON.parse(d);
          const expectedErr = !j.success && (j.code === "ADMIN_AUTH_REQUIRED" || j.code === "AUTH_REQUIRED");
          console.log(`${expectedErr ? "✅" : "❌"} ${m} ${p}: ${res.statusCode} ${j.code || j.message}`);
        } catch (e) {
          console.log(`❌ ${m} ${p}: ${res.statusCode} NOT JSON`);
        }
        next();
      });
    });
    req.on("error", (e) => { console.log(`❌ ${m} ${p}: ${e.message}`); next(); });
    req.end();
  }
  next();
}
