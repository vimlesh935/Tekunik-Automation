/* =============================================================
   COUPON SYSTEM — END-TO-END HTTP TEST (live server + real DB)
   Run: node test-coupon-e2e.js   (server must be on :8787)
   ============================================================= */
const { pool, query } = require("./src/config/db");
const couponService = require("./src/services/couponService");

const BASE = process.env.BASE || "http://localhost:8787";
let pass = 0;
let fail = 0;
const step = (name, cond, detail = "") => {
  if (cond) { pass += 1; console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ""}`); }
  else { fail += 1; console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`); }
};
const money = (v) => Math.round((Number(v) || 0) * 100) / 100;

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
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
};

(async () => {
  const ts = Date.now();
  try {
    // ── STEP 0: server health ──────────────────────────────────
    console.log("\nSTEP 0 — Server health");
    const health = await api("GET", "/health");
    step("Server running + DB connected", health.json?.database === "connected", `uptime=${Math.round(health.json?.uptime || 0)}s`);
    if (health.json?.database !== "connected") throw new Error("Server/DB not healthy");

    // ── STEP 1: ensure offers exist (admin-panel equivalent) ───
    console.log("\nSTEP 1 — Offers (admin configuration)");
    await query(
      `INSERT INTO discounts (name, title, type, value, apply_to, min_order_value, maximum_discount, is_active, audience, new_user_only, coupon_generation, coupon_prefix)
       SELECT 'Smart Home Fest', '🔥 Smart Home Fest — 20% OFF', 'percentage', 20, 'all', 3000, 1500, 1, 'ALL', 0, 'SHARED', 'SMART20'
       FROM DUAL WHERE NOT EXISTS (SELECT id FROM discounts WHERE name = 'Smart Home Fest')`
    );
    const [shf] = await query("SELECT * FROM discounts WHERE name = 'Smart Home Fest' LIMIT 1");
    step("Offer 'Smart Home Fest' ready (20% OFF, max ₹1,500, min cart ₹3,000)", !!shf, `id=${shf.id}`);
    await query(
      `INSERT INTO discounts (name, title, type, value, apply_to, min_order_value, maximum_discount, is_active, audience, new_user_only, coupon_generation, coupon_validity_days)
       SELECT 'Welcome 50', '🎁 Welcome 50 — 50% OFF first purchase', 'percentage', 50, 'all', 1000, 1000, 1, 'NEW_USER', 1, 'AUTOMATIC', 7
       FROM DUAL WHERE NOT EXISTS (SELECT id FROM discounts WHERE name = 'Welcome 50')`
    );
    const [w50] = await query("SELECT * FROM discounts WHERE name = 'Welcome 50' LIMIT 1");
    step("Offer 'Welcome 50' ready (new-user, automatic coupon, 7-day validity)", !!w50, `id=${w50.id}`);

    // ── STEP 2: generate shared coupon (server-side secure gen) ─
    console.log("\nSTEP 2 — Coupon generation");
    const sharedCode = await couponService.generateUniqueCouponCode({ prefix: "SMART20", length: 6 });
    const sharedCoupon = await couponService.createCoupon({
      code: sharedCode, offer_id: shf.id, coupon_type: "shared", usage_limit: 10, per_user_limit: 1, status: "ACTIVE",
    });
    step("SMART20-XXXXXX generated (secure, unique)", /^SMART20-[A-Z2-9]{6}$/.test(sharedCode), sharedCode);

    // ── STEP 3: register user A via HTTP → welcome coupon ──────
    console.log("\nSTEP 3 — Registration (automatic welcome coupon)");
    const emailA = `e2e.a.${ts}@teknode.test`;
    const regA = await api("POST", "/api/auth/register", { body: {
      email: emailA, password: "Passw0rd!123", username: `e2e_a_${ts}`,
      first_name: "E2E", last_name: "TesterA", phone: "9999999991", age: 30,
      address: "1 Test Lane", city: "Indore", pincode: "452001",
    } });
    step("3a. Register user A", regA.status === 201, regA.json?.message || "");
    const welcomeCode = regA.json?.data?.welcomeCouponCode;
    step("3b. Automatic WELCOME coupon issued", !!welcomeCode, welcomeCode || "none");
    const userIdA = (await query("SELECT id FROM users WHERE email = ?", [emailA]))[0]?.id;
    if (!userIdA) throw new Error("User A was not created");
    const [notif] = await query("SELECT id, title FROM notifications WHERE user_id = ? AND event_key = ?", [userIdA, `WELCOME_COUPON:${userIdA}`]);
    step("3c. 🎁 Welcome notification created (deep-links to dashboard)", !!notif, notif?.title || "missing");

    // ── STEP 4: login A ────────────────────────────────────────
    console.log("\nSTEP 4 — Login");
    const loginA = await api("POST", "/api/auth/login", { body: { email: emailA, password: "Passw0rd!123" } });
    const tokenA = loginA.json?.data?.token || loginA.json?.data?.user?.token || null;
    step("4. Login user A (Bearer token)", !!tokenA);

    // ── STEP 5: /api/coupons/my ────────────────────────────────
    console.log("\nSTEP 5 — My Offers & Coupons");
    const my = await api("GET", "/api/coupons/my", { token: tokenA });
    const myCoupons = my.json?.data?.coupons || [];
    const mine = myCoupons.find((c) => c.code === welcomeCode);
    step("5a. Welcome coupon listed for owner", !!mine, mine ? `${mine.offerName} · ${mine.offerValue}%` : "missing");
    step("5b. Coupon exposes offer rules (min order / max savings)", !!mine && Number(mine.minOrder) === 1000 && Number(mine.maxDiscount) === 1000, mine ? `min=${mine.minOrder} max=${mine.maxDiscount}` : "missing");

    // ── STEP 6: build a ₹5,999 cart (eligible product) ─────────
    console.log("\nSTEP 6 — Cart");
    const [prod] = await query("SELECT id, price, stock_quantity FROM products WHERE status='active' AND price BETWEEN 500 AND 1500 ORDER BY ABS(price - 1000) ASC, stock_quantity DESC LIMIT 1");
    if (!prod) throw new Error("No suitable active product (₹500–₹1,500) found");
    // Fixture hygiene (repeat-safe): replenish stock so repeated E2E runs never
    // deplete the shared product below the cart quantities needed.
    await query("UPDATE products SET stock_quantity = 200 WHERE id = ?", [prod.id]);
    const qtyA = Math.max(1, Math.ceil(5999 / Number(prod.price)));
    const addA = await api("POST", "/api/cart/add", { token: tokenA, body: { product_id: prod.id, quantity: qtyA } });
    step("6a. Cart built", addA.status === 200 || addA.status === 201, `product #${prod.id} × ${qtyA}`);
    const cartA = await api("GET", "/api/cart", { token: tokenA });
    // Base subtotal (what the coupon engine uses) = price × qty. The cart API
    // returns offer-enriched display prices, so compute base from the product.
    const subtotalA = money(Number(prod.price) * qtyA);
    step("6b. Base subtotal ≥ ₹5,999 (eligible for offer)", subtotalA >= 5999, `base=₹${subtotalA} (cart display=₹${cartA.json?.data?.cart?.totalAmount})`);

    // ── STEP 7: apply SMART20 ──────────────────────────────────
    console.log("\nSTEP 7 — Apply coupon at checkout");
    const applyA = await api("POST", "/api/coupons/apply", { token: tokenA, body: { couponCode: sharedCode } });
    const r7 = applyA.json?.data || {};
    const expDiscA = money(Math.min(subtotalA * 0.2, 1500));
    step("7a. Coupon applied", applyA.status === 200, applyA.json?.message || "");
    step("7b. Discount = 20% of subtotal (under cap)", money(r7.discount) === expDiscA, `discount=₹${r7.discount} expected=₹${expDiscA}`);
    step("7c. Linked offer surfaced", r7.couponOfferName === "Smart Home Fest", r7.couponOfferName || "missing");
    step("7d. Grand total = subtotal − discount", money(r7.grandTotal) === money(subtotalA - Number(r7.discount)), `total=₹${r7.grandTotal}`);
    step("7e. Savings reported", money(r7.totalSavings) === money(r7.discount), `savings=₹${r7.totalSavings}`);

    // ── STEP 8: refresh-safe totals ────────────────────────────
    console.log("\nSTEP 8 — Refresh checkout (no duplicate discount)");
    const tot = await api("GET", "/api/coupons/totals", { token: tokenA });
    step("Totals identical after refresh", money(tot.json?.data?.discount) === expDiscA, `discount=₹${tot.json?.data?.discount}`);

    // ── STEP 9: quantity bump → max-discount cap ₹1,500 ────────
    console.log("\nSTEP 9 — Maximum discount cap");
    const qtyA2 = Math.max(qtyA, Math.ceil(8000 / Number(prod.price)));
    const itemsA = (await api("GET", "/api/cart", { token: tokenA })).json?.data?.cart?.items || [];
    const itemA = itemsA.find((i) => Number(i.product_id) === Number(prod.id)) || itemsA[0];
    if (!itemA) throw new Error("Cart item not found for quantity update");
    await api("PUT", `/api/cart/item/${itemA.cart_item_id}`, { token: tokenA, body: { quantity: qtyA2 } });
    const tot2 = await api("GET", "/api/coupons/totals", { token: tokenA });
    const subtotalA2 = money(tot2.json?.data?.subtotal);
    step("9. Cap enforced (20% > ₹1,500 → ₹1,500)", money(tot2.json?.data?.discount) === 1500, `subtotal=₹${subtotalA2} discount=₹${tot2.json?.data?.discount}`);

    // ── STEP 10: stacking prevented (replacement, one coupon) ──
    console.log("\nSTEP 10 — One coupon per order (no stacking)");
    const applyW = await api("POST", "/api/coupons/apply", { token: tokenA, body: { couponCode: welcomeCode } });
    const r10 = applyW.json?.data || {};
    step("10a. Second coupon replaces first (never stacks)", applyW.status === 200 && r10.couponCode === welcomeCode, `active=${r10.couponCode}`);
    step("10b. Welcome discount = 50% capped at ₹1,000", money(r10.discount) === money(Math.min(subtotalA2 * 0.5, 1000)), `discount=₹${r10.discount}`);
    await api("POST", "/api/coupons/apply", { token: tokenA, body: { couponCode: sharedCode } });

    // ── STEP 11: user B + validation error cases ───────────────
    console.log("\nSTEP 11 — Validation errors (user B)");
    const emailB = `e2e.b.${ts}@teknode.test`;
    const regB = await api("POST", "/api/auth/register", { body: {
      email: emailB, password: "Passw0rd!123", username: `e2e_b_${ts}`,
      first_name: "E2E", last_name: "TesterB", phone: "9999999992", age: 30,
      address: "2 Test Lane", city: "Indore", pincode: "452001",
    } });
    const welcomeCodeB = regB.json?.data?.welcomeCouponCode || null;
    const loginB = await api("POST", "/api/auth/login", { body: { email: emailB, password: "Passw0rd!123" } });
    const tokenB = loginB.json?.data?.token || loginB.json?.data?.user?.token || null;
    const userIdB = (await query("SELECT id FROM users WHERE email = ?", [emailB]))[0]?.id;
    step("11-prep. User B registered + logged in", !!tokenB);

    const bad = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: "GHOST-0000" } });
    step("11a. Invalid code → 'Coupon not found.'", bad.status === 400 && bad.json?.code === "COUPON_NOT_FOUND", bad.json?.message || "");

    const wrongUser = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: welcomeCode } });
    step("11b. Wrong user → ownership rejected", wrongUser.status === 400 && wrongUser.json?.code === "COUPON_NOT_ASSIGNED", wrongUser.json?.message || "");

    await api("POST", "/api/cart/add", { token: tokenB, body: { product_id: prod.id, quantity: 1 } });
    const minCart = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: sharedCode } });
    step("11c. Min cart → 'Add ₹X more to unlock' message", minCart.status === 400 && minCart.json?.code === "MIN_CART_NOT_REACHED" && /^Add ₹[\d.]+ more to unlock this coupon\.$/.test(minCart.json?.message || ""), minCart.json?.message || JSON.stringify(minCart.json));

    const expiredCode = await couponService.generateUniqueCouponCode({ prefix: "EXPIRED", length: 4 });
    await couponService.createCoupon({ code: expiredCode, offer_id: shf.id, coupon_type: "personal", user_id: userIdB, expires_at: new Date(Date.now() - 86400000) });
    const expired = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: expiredCode } });
    step("11d. Expired coupon → rejected", expired.status === 400 && expired.json?.code === "COUPON_EXPIRED", expired.json?.message || "");

    const disabledCode = await couponService.generateUniqueCouponCode({ prefix: "DISABLED", length: 4 });
    const disCoupon = await couponService.createCoupon({ code: disabledCode, offer_id: shf.id, coupon_type: "personal", user_id: userIdB });
    await couponService.updateCouponStatus(disCoupon.id, "DISABLED");
    const disabled = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: disabledCode } });
    step("11e. Disabled coupon → rejected", disabled.status === 400 && disabled.json?.code === "COUPON_DISABLED", disabled.json?.message || "");

    // ── STEP 12: place order — revalidation + redemption ───────
    console.log("\nSTEP 12 — Place Order (server-side re-validation)");
    const customerA = { full_name: "E2E TesterA", name: "E2E TesterA", email: emailA, phone: "9999999999", address: "1 Test Lane", city: "Indore", state: "MP", pincode: "452001" };
    let order = await api("POST", "/api/orders", { token: tokenA, body: {
      items: [{ product_id: prod.id, quantity: qtyA2 }], customer: customerA, payment_method: "cod",
    } });
    if (order.status === 400 && /payment/i.test(order.json?.message || "")) {
      order = await api("POST", "/api/orders", { token: tokenA, body: {
        items: [{ product_id: prod.id, quantity: qtyA2 }], customer: customerA, payment_method: "prepaid",
      } });
    }
    const o = order.json?.data?.order || order.json?.data || {};
    step("12a. Order created", order.status === 200 || order.status === 201, `#${o.order_number || "?"} ${order.json?.message || ""}`);
    step("12b. Order stores coupon snapshot (code + offer + ₹1,500 discount)", o.coupon_code === sharedCode && money(o.coupon_discount) === 1500 && Number(o.coupon_offer_id) === Number(shf.id), `code=${o.coupon_code} discount=₹${o.coupon_discount}`);
    step("12c. Grand total server-calculated (subtotal − 1,500)", money(o.total_amount) === money(subtotalA2 - 1500), `total=₹${o.total_amount}`);
    step("12d. Total savings stored", money(o.total_savings) === 1500, `savings=₹${o.total_savings}`);

    const [afterUse] = await query("SELECT used_count, status FROM coupons WHERE id = ?", [sharedCoupon.id]);
    step("12e. Shared coupon usage recorded (used_count+1, stays ACTIVE)", Number(afterUse?.used_count) >= 1 && afterUse?.status === "ACTIVE", `used_count=${afterUse?.used_count}`);
    const [usageRow] = await query("SELECT id, discount_amount FROM coupon_usage WHERE coupon_id = ? AND order_id = ?", [sharedCoupon.id, o.id]);
    step("12f. coupon_usage ledger row written", !!usageRow, usageRow ? `₹${usageRow.discount_amount}` : "missing");

    const totAfter = await api("GET", "/api/coupons/totals", { token: tokenA });
    step("12g. Cart coupon cleared after order (refresh-safe, no duplication)", money(totAfter.json?.data?.discount) === 0 && !totAfter.json?.data?.couponCode, `discount=₹${totAfter.json?.data?.discount}`);

    // ── STEP 13: one-shot personal coupon (user B's welcome) ───
    console.log("\nSTEP 13 — One-shot personal coupon redemption (user B)");
    const customerB = { full_name: "E2E TesterB", name: "E2E TesterB", email: emailB, phone: "9999999992", address: "2 Test Lane", city: "Indore", state: "MP", pincode: "452001" };
    const applyW2 = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: welcomeCodeB } });
    const r13 = applyW2.json?.data || {};
    step("13a. Welcome coupon applied by owner (50% of ₹1,000 = ₹500)", applyW2.status === 200 && money(r13.discount) === 500, `discount=₹${r13.discount}`);
    let order2 = await api("POST", "/api/orders", { token: tokenB, body: {
      items: [{ product_id: prod.id, quantity: 1 }], customer: customerB, payment_method: "cod",
    } });
    if (order2.status === 400 && /payment/i.test(order2.json?.message || "")) {
      order2 = await api("POST", "/api/orders", { token: tokenB, body: {
        items: [{ product_id: prod.id, quantity: 1 }], customer: customerB, payment_method: "prepaid",
      } });
    }
    const o2 = order2.json?.data?.order || order2.json?.data || {};
    step("13b. Second order created with welcome discount stored", (order2.status === 200 || order2.status === 201) && money(o2.coupon_discount) === 500, `#${o2.order_number || "?"} discount=₹${o2.coupon_discount}`);
    const [wAfter] = await query("SELECT status, used_at, created_order_id FROM coupons WHERE code = ?", [welcomeCodeB]);
    step("13c. Personal coupon → USED (used_at + order linked)", wAfter?.status === "USED" && !!wAfter?.used_at && Number(wAfter?.created_order_id) === Number(o2.id), `order=${wAfter?.created_order_id}`);
    const reuse = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: welcomeCodeB } });
    step("13d. Re-use after redemption → rejected", reuse.status === 400 && ["COUPON_USED", "NEW_USER_FAILED"].includes(reuse.json?.code), reuse.json?.message || "");
    const myAfter = await api("GET", "/api/coupons/my", { token: tokenB });
    step("13e. Used coupon disappears from My Offers", !((myAfter.json?.data?.coupons || []).some((c) => c.code === welcomeCodeB)));

    // ── STEP 14: available coupons + validate + cart-change revalidation ──
    console.log("\nSTEP 14 — Available Offers, validate, cart-change revalidation (user B)");
    await api("POST", "/api/cart/add", { token: tokenB, body: { product_id: prod.id, quantity: 6 } });
    const avail = await api("GET", "/api/coupons/available", { token: tokenB });
    const availList = avail.json?.data?.coupons || [];
    step("14a. GET /api/coupons/available returns coupon cards", avail.status === 200 && availList.length > 0, `${availList.length} card(s)`);
    const smart = availList.find((c) => c.code === sharedCode);
    step("14b. SMART20 eligible with correct estimated discount (₹1,200)", !!smart && smart.eligible === true && money(smart.estimatedDiscount) === 1200, smart ? `eligible=${smart.eligible} est=₹${smart.estimatedDiscount}` : "missing");
    const firstEligible = availList.find((c) => c.eligible);
    step("14c. Sorting: first card is eligible + best discount", firstEligible && firstEligible.code === smart.code, `first=${firstEligible?.code}`);

    const validateOnly = await api("POST", "/api/coupons/validate", { token: tokenB, body: { code: sharedCode } });
    step("14d. POST /api/coupons/validate → valid + discount, NOT persisted", validateOnly.status === 200 && validateOnly.json?.data?.valid === true && money(validateOnly.json?.data?.discount) === 1200, validateOnly.json?.data?.totals?.discount);
    const totNotApplied = await api("GET", "/api/coupons/totals", { token: tokenB });
    step("14e. Validate-only left cart untouched (discount still ₹0)", money(totNotApplied.json?.data?.discount) === 0 && !totNotApplied.json?.data?.couponCode);

    await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: sharedCode } });
    const cartB = (await api("GET", "/api/cart", { token: tokenB })).json?.data?.cart;
    const itemB = (cartB?.items || []).find((i) => Number(i.product_id) === Number(prod.id)) || (cartB?.items || [])[0];
    await api("PUT", `/api/cart/item/${itemB.cart_item_id}`, { token: tokenB, body: { quantity: 1 } });
    const totAfterShrink = await api("GET", "/api/coupons/totals", { token: tokenB });
    step("14f. §27 cart-change: coupon auto-removed when subtotal drops below minimum",
      !totAfterShrink.json?.data?.couponCode && money(totAfterShrink.json?.data?.discount) === 0 && !!totAfterShrink.json?.data?.invalidatedReason,
      `reason="${totAfterShrink.json?.data?.invalidatedReason?.message || "none"}"`);

    const avail2 = await api("GET", "/api/coupons/available", { token: tokenB });
    const smart2 = (avail2.json?.data?.coupons || []).find((c) => c.code === sharedCode);
    step("14g. Card shows 'Add ₹X more' shortfall + progress data", !!smart2 && smart2.eligible === false && Number(smart2.shortfall) === 2000 && smart2.reasonCode === "MIN_CART_NOT_REACHED", `shortfall=₹${smart2?.shortfall} msg="${smart2?.message}"`);

    // ── STEP 15: "Coupon not found" root-cause regression matrix ─────────
    console.log("\nSTEP 15 — Exact-code entry + normalization + precise errors");
    // TEST 1-3: SAVE10 in exact, lowercase, and space-padded forms all apply.
    await api("POST", "/api/cart/add", { token: tokenB, body: { product_id: prod.id, quantity: 1 } });
    const t1 = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: "SAVE10" } });
    step("15a. TEST 1 — exact 'SAVE10' applies", t1.status === 200 && t1.json?.data?.coupon?.code === "SAVE10", `discount=₹${t1.json?.data?.discount}`);
    const t2 = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: "save10" } });
    step("15b. TEST 2 — lowercase 'save10' applies (normalized)", t2.status === 200 && t2.json?.data?.coupon?.code === "SAVE10", `discount=₹${t2.json?.data?.discount}`);
    const t3 = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: "  SAVE10  " } });
    step("15c. TEST 3 — space-padded ' SAVE10 ' applies (trimmed)", t3.status === 200 && t3.json?.data?.coupon?.code === "SAVE10", `discount=₹${t3.json?.data?.discount}`);
    await api("POST", "/api/coupons/remove", { token: tokenB });
    // TEST 4: genuinely invalid code.
    const t4 = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: "WRONG123" } });
    step("15d. TEST 4 — 'WRONG123' → Coupon code not found", t4.status === 400 && t4.json?.code === "COUPON_NOT_FOUND", t4.json?.message || "");
    // TEST 6: future (not started) coupon gets its own precise error.
    await query(
      `INSERT INTO discounts (name, title, type, value, apply_to, min_order_value, is_active, audience, starts_at)
       SELECT 'Demo Future Offer', 'Future offer', 'percentage', 50, 'all', 0, 1, 'ALL', DATE_ADD(NOW(), INTERVAL 2 DAY)
       FROM DUAL WHERE NOT EXISTS (SELECT id FROM discounts WHERE name = 'Demo Future Offer')`
    );
    const [futureOffer] = await query("SELECT id FROM discounts WHERE name = 'Demo Future Offer' LIMIT 1");
    await query("DELETE FROM coupons WHERE code = ?", ["FUTURE50"]);
    await couponService.createCoupon({ code: "FUTURE50", offer_id: futureOffer.id, coupon_type: "shared", status: "ACTIVE" });
    const t6 = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: "FUTURE50" } });
    step("15e. TEST 6 — future coupon → 'This coupon is not active yet.' (NOT 'not found')",
      t6.status === 400 && t6.json?.code === "OFFER_NOT_STARTED" && t6.json?.message === "This coupon is not active yet.", t6.json?.message || "");
    // TEST 2 of discount types: fixed-amount coupon math.
    await api("POST", "/api/cart/add", { token: tokenB, body: { product_id: prod.id, quantity: 1 } });
    const t8 = await api("POST", "/api/coupons/apply", { token: tokenB, body: { couponCode: "FLAT200" } });
    step("15f. Fixed coupon 'FLAT200' → exactly ₹200 off", t8.status === 200 && money(t8.json?.data?.discount) === 200, `discount=₹${t8.json?.data?.discount}`);
    await api("POST", "/api/coupons/remove", { token: tokenB });

  } catch (error) {
    fail += 1;
    console.error("\n💥 UNEXPECTED ERROR:", error.message);
    console.error(error.stack);
  } finally {
    console.log(`\n${"═".repeat(58)}`);
    console.log(`RESULT  PASS=${pass} FAIL=${fail}`);
    console.log("═".repeat(58));
    try { await pool.end(); } catch { /* ignore */ }
    process.exit(fail > 0 ? 1 : 0);
  }
})();
