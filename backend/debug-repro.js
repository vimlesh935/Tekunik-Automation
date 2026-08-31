/* TEMP REPRO — simulate exact browser checkout coupon flow over HTTP. */
const BASE = process.env.BASE || "http://localhost:8787";
const { pool, query } = require("./src/config/db");

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
  const ts = Date.now();
  const email = `repro.${ts}@teknode.test`;

  // Context: list products for cart construction
  const prods = await query(
    "SELECT id, name, price, category_id, stock_quantity FROM products WHERE status='active' ORDER BY price LIMIT 10"
  );
  console.log("-- Active products (cheapest 10) --");
  prods.forEach((p) => console.log(`#${p.id} ₹${p.price} cat=${p.category_id} name=${p.name}`));

  // 1. Register + login
  const reg = await api("POST", "/api/auth/register", {
    body: {
      email, password: "Passw0rd!123", username: `repro_${ts}`,
      first_name: "Repro", last_name: "Tester", phone: "9999999994",
      age: 30, address: "5 Repro Ln", city: "Indore", pincode: "452001",
    },
  });
  const login = await api("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
  const token = login.json?.data?.token || login.json?.data?.user?.token || null;
  console.log("\nregister:", reg.status, "welcomeCode:", reg.json?.data?.welcomeCouponCode);
  console.log("login:", login.status, "token:", !!token);

  // 2. Build a SMALL cart (subtotal below most min order thresholds)
  const [prod] = prods;
  await api("POST", "/api/cart/add", { token, body: { product_id: prod.id, quantity: 1 } });
  const cart = await api("GET", "/api/cart", { token });
  console.log("\nCart #" + prod.id + " x1 — server cart:", JSON.stringify(cart.json?.data?.cart || cart.json?.data).slice(0, 400));

  // 3. GET available coupons — what the UI shows
  console.log("\n--- GET /api/coupons/available (SMALL cart) ---");
  const avail = await api("GET", "/api/coupons/available", { token });
  console.log("status:", avail.status);
  (avail.json?.data?.coupons || []).forEach((c) =>
    console.log(
      `${c.code} | eligible=${c.eligible} locked=${c.locked} reason=${c.reasonCode} shortfall=${c.shortfall} msg="${c.message}" estDisc=₹${c.estimatedDiscount}`
    )
  );

  // 4. Apply every visible coupon (what the UI Apply button sends)
  console.log("\n--- POST /api/coupons/apply for EVERY visible card ---");
  for (const c of avail.json?.data?.coupons || []) {
    const r = await api("POST", "/api/coupons/apply", { token, body: { couponCode: c.code } });
    console.log(`APPLY ${c.code} → ${r.status} code=${r.json?.code || r.json?.data?.coupon?.code} msg="${r.json?.message || r.json?.data?.coupon?.offerName}" disc=₹${r.json?.data?.coupon?.discount}`);
  }

  // 5. Special codes
  console.log("\n--- POST /api/coupons/apply special codes (SMALL cart) ---");
  for (const code of ["FUTURE50", "DOESNOTEXIST123", "SAVE10", "FLAT200"]) {
    const r = await api("POST", "/api/coupons/apply", { token, body: { couponCode: code } });
    console.log(`APPLY ${code} → ${r.status} code=${r.json?.code} msg="${r.json?.message}"`);
  }

  // 6. Enlarge cart to make coupons eligible, then re-check available + apply
  console.log("\n--- Enlarge cart to ~₹10,000 ---");
  const qty = Math.max(2, Math.ceil(10000 / Number(prod.price)));
  await api("POST", "/api/cart/add", { token, body: { product_id: prod.id, quantity: qty } });
  const avail2 = await api("GET", "/api/coupons/available", { token });
  console.log("available (big cart):");
  (avail2.json?.data?.coupons || []).forEach((c) =>
    console.log(
      `${c.code} | eligible=${c.eligible} locked=${c.locked} reason=${c.reasonCode} shortfall=${c.shortfall} msg="${c.message}" estDisc=₹${c.estimatedDiscount}`
    )
  );
  console.log("\nApply each on big cart:");
  for (const c of avail2.json?.data?.coupons || []) {
    const r = await api("POST", "/api/coupons/apply", { token, body: { couponCode: c.code } });
    console.log(`APPLY ${c.code} → ${r.status} code=${r.json?.code || r.json?.data?.coupon?.code} msg="${r.json?.message}" disc=₹${r.json?.data?.coupon?.discount}`);
  }

  await pool.end();
})().catch((e) => {
  console.error("UNEXPECTED:", e);
  process.exit(1);
});