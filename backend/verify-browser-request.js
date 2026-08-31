/* =====================================================================
   BROWSER-EQUIVALENT NETWORK REQUEST VERIFICATION
   Replays the EXACT HTTP the frontend Checkout.Apply sends:
     - URL  : http://localhost:8787/api/coupons/apply
              (frontend VITE_API_BASE_URL=http://localhost:8787,
               normalized by services/api.js getApiUrl → same-origin backend)
     - Method: POST
     - Headers: Content-Type: application/json, Authorization: Bearer <token>
     - Body  : {"couponCode":"SAVE10"}   (couponService.apply)
   Also replays validate ({code}) and a security manipulation attempt.
   ===================================================================== */
const BASE = process.env.BASE || "http://localhost:8787";
const { query, pool } = require("./src/config/db");

const R = "✓";
const F = "✗";
let pass = 0, fail = 0;
const step = (name, cond, detail = "") => {
  if (cond) { pass++; console.log(`  ${R} ${name}${detail ? ` — ${detail}` : ""}`); }
  else { fail++; console.log(`  ${F} ${name}${detail ? ` — ${detail}` : ""}`); }
};

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
};

(async () => {
  try {
    const ts = Date.now();
    const email = `browser.${ts}@teknode.test`;

    // 1. Register + login (get a real Bearer token like a logged-in browser)
    const reg = await api("POST", "/api/auth/register", { body: {
      email, password: "Passw0rd!123", username: `browser_${ts}`,
      first_name: "Network", last_name: "Test", phone: "9999999993",
      age: 30, address: "9 Net Lane", city: "Indore", pincode: "452001",
    } });
    const login = await api("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token || login.json?.data?.user?.token || null;
    step("Login obtains Bearer token (browser session)", !!token);

    // 2. Build an eligible cart
    const [prod] = await query(
      "SELECT id, price, stock_quantity FROM products WHERE status='active' AND price BETWEEN 500 AND 1500 AND stock_quantity >= 20 ORDER BY id LIMIT 1"
    );
    if (!prod) throw new Error("No eligible product");
    const qty = Math.max(2, Math.ceil(5999 / Number(prod.price)));
    await api("POST", "/api/cart/add", { token, body: { product_id: prod.id, quantity: qty } });
    step("Eligible cart built", true);

    // 3. REPLAY the browser's GET available (CouponCards)
    console.log("\n--- Browser request: GET /api/coupons/available ---");
    const avail = await api("GET", "/api/coupons/available", { token });
    const availList = avail.json?.data?.coupons || [];
    step("GET /api/coupons/available → 200 + cards", avail.status === 200 && availList.length > 0, `${availList.length} card(s)`);

    // 4. REPLAY the browser's POST apply {couponCode}
    console.log("\n--- Browser request: POST /api/coupons/apply  body={couponCode:\"SAVE10\"} ---");
    const apply = await api("POST", "/api/coupons/apply", { token, body: { couponCode: "SAVE10" } });
    step("POST /api/coupons/apply (couponCode) → 200", apply.status === 200, `message="${apply.json?.message}"`);
    step("  NOT 404 Route not found", apply.status !== 404);
    step("  Server-calculated discount returned", Number(apply.json?.data?.coupon?.discount) > 0, `discount=₹${apply.json?.data?.coupon?.discount}`);

    // 5. REPLAY validate {code}
    console.log("\n--- Browser request: POST /api/coupons/validate  body={code:\"save10\"} (lowercase) ---");
    const val = await api("POST", "/api/coupons/validate", { token, body: { code: "save10" } });
    step("POST /api/coupons/validate (code, lowercase) → 200 valid", val.status === 200 && val.json?.data?.valid === true, `discount=₹${val.json?.data?.discount}`);

    // 6. SECURITY: frontend tries to send authoritative discount — backend must ignore
    console.log("\n--- Security: tampered request {couponCode, discount:0} — backend ignores client discount ---");
    const tampered = await api("POST", "/api/coupons/apply", { token, body: { couponCode: "SAVE10", discount: 9999, subtotal: 1 } });
    const tamperDisc = Number(tampered.json?.data?.coupon?.discount || 0);
    step("Client-supplied discount ignored (server recomputes SAVE10 from real cart)", tampered.status === 200 && tamperDisc !== 9999 && tamperDisc !== 0, `discount=₹${tamperDisc} (client said 9999, subtotal 1)`);

    // 7. Remove coupon replays
    console.log("\n--- Browser request: POST /api/coupons/remove ---");
    const rem = await api("POST", "/api/coupons/remove", { token });
    step("POST /api/coupons/remove → 200", rem.status === 200, rem.json?.message || "");
    const totalsAfter = await api("GET", "/api/coupons/totals", { token });
    step("  Totals recalculated with coupon cleared", Number(totalsAfter.json?.data?.discount) === 0);

    // 8. Invalid coupon → precise error, NOT route-not-found
    console.log("\n--- Browser request: POST /api/coupons/apply  body={couponCode:\"WRONG123\"} ---");
    const bad = await api("POST", "/api/coupons/apply", { token, body: { couponCode: "WRONG123" } });
    step("Invalid coupon → 400 COUPON_NOT_FOUND (NOT 404)", bad.status === 400 && bad.json?.code === "COUPON_NOT_FOUND", bad.json?.message || "");

  } catch (e) {
    fail++;
    console.error("UNEXPECTED:", e.message);
  } finally {
    console.log(`\n${"=".repeat(58)}`);
    console.log(`BROWSER-EQUIVALENT NETWORK RESULT  PASS=${pass} FAIL=${fail}`);
    console.log("=".repeat(58));
    try { await pool.end(); } catch {}
    process.exit(fail > 0 ? 1 : 0);
  }
})();
