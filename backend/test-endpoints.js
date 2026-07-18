const http = require("http");

const results = [];

const test = (name, opts, body) =>
  new Promise((resolve) => {
    const b = body ? Buffer.from(JSON.stringify(body)) : null;
    const o = { hostname: "localhost", port: 8787, ...opts };
    if (b) o.headers = { "Content-Type": "application/json", "Content-Length": b.length };
    const req = http.request(o, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(d);
        } catch (e) {}
        results.push({ name, status: res.statusCode, ok: json?.success, msg: json?.message || json?.code || "" });
        resolve();
      });
    });
    req.on("error", (e) => {
      results.push({ name, status: 0, ok: false, msg: e.message });
      resolve();
    });
    if (b) req.write(b);
    req.end();
  });

(async () => {
  await test("Health", { path: "/health" });
  await test("Products", { path: "/api/products?limit=1" });
  await test("Categories", { path: "/api/categories" });
  await test("Settings", { path: "/api/settings/website-mode" });
  await test("Smart Home", { path: "/api/smart-home/proposals" });
  await test("Razorpay Create", { method: "POST", path: "/api/orders/razorpay/create-order" }, { order_id: 39 });
  await test("User Profile (no auth)", { path: "/api/user/profile" });

  console.log("\n=== ENDPOINT TEST RESULTS ===\n");
  results.forEach((r) => {
    const icon = r.ok ? "✅" : r.status === 401 || r.status === 0 ? "⚠️" : "❌";
    console.log(`${icon} ${r.name}: ${r.status} ${r.msg}`);
  });
})();
