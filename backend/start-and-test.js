// Starts serve.js, captures output, tests endpoints, then keeps running
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

console.log("=== Starting serve.js ===");
const server = spawn("node", ["serve.js"], {
  cwd: __dirname,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: "8787" },
});

let output = "";
server.stdout.on("data", (d) => {
  const s = d.toString();
  output += s;
  process.stdout.write(s);
});
server.stderr.on("data", (d) => {
  const s = d.toString();
  output += s;
  process.stderr.write(s);
});

// Wait for startup
setTimeout(() => {
  console.log("\n=== Checking if server responded ===");
  if (output.includes("Failed to start")) {
    console.log("❌ SERVER FAILED TO START");
    console.log("Full output:", output);
    process.exit(1);
  }

  if (output.includes("TekNode live")) {
    console.log("✅ Server started successfully\n");

    // Test endpoints
    const tests = [
      ["GET", "/health"],
      ["GET", "/api/settings/website-mode"],
      ["GET", "/api/products?limit=1"],
      ["GET", "/api/categories"],
      ["GET", "/api/smart-home/proposals"],
    ];

    let i = 0;
    const run = () => {
      if (i >= tests.length) {
        console.log("\n✅ All endpoint tests completed");
        server.kill();
        process.exit(0);
        return;
      }
      const [method, p] = tests[i++];
      const req = http.request(
        { hostname: "localhost", port: 8787, path: p, method },
        (res) => {
          let d = "";
          res.on("data", (c) => (d += c));
          res.on("end", () => {
            let json = false;
            try { json = JSON.parse(d); } catch (e) {}
            const ok = json?.success;
            const icon = ok ? "✅" : res.statusCode === 401 ? "⚠️" : "❌";
            console.log(`${icon} ${method} ${p}: ${res.statusCode} ${json?.message || json?.code || json?.error || ""}`);
            run();
          });
        }
      );
      req.on("error", (e) => {
        console.log(`❌ ${method} ${p}: ERROR ${e.message}`);
        run();
      });
      req.end();
    };
    run();
  } else {
    // Still waiting
    console.log("Server output didn't indicate startup yet...");
  }
}, 6000);
