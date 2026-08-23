/**
 * BACK-IN-STOCK END-TO-END TEST SUITE
 * Runs against the REAL server (http://localhost:8787) + REAL MySQL.
 * Creates its own test product/customers, runs Tests 1-12, cleans up.
 * Usage: node test-back-in-stock.js
 */
const env = require("./src/config/env");
const { signToken } = require("./src/utils/jwt");
const { query, pool } = require("./src/config/db");

const BASE = `http://localhost:${env.port}`;
const PASS = [];
const FAIL = [];
let testProduct = null;
let adminToken = null;
const customers = [];

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
}

function check(name, condition, detail = "") {
  if (condition) { PASS.push(name); console.log(`  OK ${name}${detail ? ` - ${detail}` : ""}`); }
  else { FAIL.push(`${name} ${detail}`); console.log(`  FAIL ${name}${detail ? ` - ${detail}` : ""}`); }
}

const bisCount = async (userId, productId) => {
  const [r] = await query("SELECT COUNT(*) AS c FROM notifications WHERE user_id=? AND type='BACK_IN_STOCK' AND entity_id=?", [userId, productId]);
  return Number(r.c);
};
const latestBis = async (userId, productId) => {
  const [r] = await query("SELECT title, message, data FROM notifications WHERE user_id=? AND type='BACK_IN_STOCK' AND entity_id=? ORDER BY id DESC LIMIT 1", [userId, productId]);
  return r || null;
};
const priceDropCount = async (userId, productId) => {
  const [r] = await query("SELECT COUNT(*) AS c FROM notifications WHERE user_id=? AND type='PRICE_DROP' AND entity_id=?", [userId, productId]);
  return Number(r.c);
};
const acts = (type, productId) => query("SELECT * FROM admin_activity_logs WHERE activity_type=? AND entity_id=? ORDER BY id DESC", [type, productId]);
const alertRow = async (u, p) => { const [r] = await query("SELECT * FROM back_in_stock_alerts WHERE user_id=? AND product_id=?", [u, p]); return r || null; };
const getProduct = async (id) => { const [r] = await query("SELECT * FROM products WHERE id=?", [id]); return r; };
async function setStockDirect(id, qty) {
  const p = await getProduct(id);
  let status = "in_stock";
  if (Number(qty) === 0) status = "out_of_stock";
  else if (Number(qty) <= Number(p.low_stock_limit)) status = "limited_stock";
  await query("UPDATE products SET stock=?, stock_quantity=?, stock_status=?, updated_at=NOW() WHERE id=?", [qty, qty, status, id]);
}
const banner = (t) => console.log(`\n========== ${t} ==========`);

async function setup() {
  banner("SETUP");
  const health = await api("GET", "/health");
  check("Server is running on port " + env.port, health.status === 200);

  const admins = await query("SELECT id, email, role FROM admins LIMIT 1");
  check("Admin account exists", admins.length > 0);
  adminToken = signToken({ id: admins[0].id, email: admins[0].email, role: admins[0].role || "admin" });

  const cats = await query("SELECT id FROM product_categories ORDER BY id LIMIT 1");
  const suffix = Date.now().toString(36);
  const result = await query(
    `INSERT INTO products (name, slug, description, short_description, price, sale_price,
       discount_percent, stock, stock_quantity, low_stock_limit, category_id, sku, status, featured)
     VALUES (?, ?, ?, ?, 5999.00, NULL, NULL, 0, 0, 10, ?, ?, 'active', 0)`,
    [`BIS Test Lock ${suffix}`, `bis-test-lock-${suffix}`, "BIS E2E test product", "BIS test", cats[0]?.id || null, `BIS-TEST-${suffix}`],
  );
  testProduct = await getProduct(result.insertId);
  check("Test product created with stock 0", !!testProduct && Number(testProduct.stock_quantity) === 0);

  for (let i = 1; i <= 4; i++) {
    const email = `bis_tester_${suffix}_${i}@example.com`;
    const password = "TestPass123!";
    const reg = await api("POST", "/api/auth/register", { body: { email, password } });
    const token = reg.json?.data?.token || reg.json?.token;
    let userId = reg.json?.data?.user?.id || reg.json?.user?.id || null;
    if (!userId && token) userId = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()).id;
    check(`Customer ${i} registered via real API`, reg.status === 200 && !!token && !!userId, `id=${userId}`);
    customers.push({ id: userId, email, password, token });
  }
}

async function test1_notifyMe() {
  banner("TEST 1 - Notify Me (subscribe)");
  const A = customers[0];
  const sub = await api("POST", `/api/back-in-stock/${testProduct.id}`, { token: A.token });
  check("Subscribe succeeds", sub.status === 200 && sub.json?.data?.subscribed === true, String(sub.json?.message));
  const row = await alertRow(A.id, testProduct.id);
  check("Alert saved in DB as ACTIVE", row?.status === "ACTIVE");
  const status = await api("GET", `/api/back-in-stock/status/${testProduct.id}`, { token: A.token });
  check("Status endpoint reports active", status.json?.data?.active === true);
  const sub2 = await api("POST", `/api/back-in-stock/${testProduct.id}`, { token: A.token });
  check("Re-subscribe is idempotent", sub2.json?.data?.alreadyActive === true);
  const anon = await api("POST", `/api/back-in-stock/${testProduct.id}`);
  check("Unauthenticated subscribe rejected (401)", anon.status === 401);
}

async function test2_restock() {
  banner("TEST 2 - Restock 0 -> 10 notifies subscriber");
  const A = customers[0];
  const res = await api("PUT", `/api/admin/stock/${testProduct.id}`, { token: adminToken, body: { stock_quantity: 10, action_type: "restock" } });
  check("Stock update succeeds", res.status === 200);
  check("Backend reports BackInStock transition", res.json?.data?.backInStock?.backInStock === true);
  check("1 notification created", res.json?.data?.backInStock?.notificationsCreated === 1);
  check("Customer has exactly 1 BACK_IN_STOCK notification", (await bisCount(A.id, testProduct.id)) === 1);
  const notif = await latestBis(A.id, testProduct.id);
  check("Title mentions Back in Stock", /back in stock/i.test(notif?.title || ""));
  check("Notification data links to product", JSON.parse(notif?.data || "{}").productId === testProduct.id);
  const alert = await alertRow(A.id, testProduct.id);
  check("Alert marked NOTIFIED with notified_at", alert?.status === "NOTIFIED" && !!alert?.notified_at);
  const p = await getProduct(testProduct.id);
  check("Product now In Stock", Number(p.stock_quantity) === 10 && p.stock_status !== "out_of_stock");
}

async function test3_noFalseTrigger() {
  banner("TEST 3 - No false trigger 10 -> 20");
  const A = customers[0];
  const before = await bisCount(A.id, testProduct.id);
  const res = await api("PUT", `/api/admin/stock/${testProduct.id}`, { token: adminToken, body: { stock_quantity: 10, action_type: "restock" } });
  check("Update succeeds", res.status === 200);
  check("No transition reported", res.json?.data?.backInStock?.backInStock !== true);
  check("No new notification", (await bisCount(A.id, testProduct.id)) === before);
}

async function test4_outOfStock() {
  banner("TEST 4 - Out of stock -> 0");
  const A = customers[0];
  const before = await bisCount(A.id, testProduct.id);
  const res = await api("PUT", `/api/admin/stock/${testProduct.id}`, { token: adminToken, body: { stock_quantity: 20, action_type: "damaged" } });
  check("Update succeeds", res.status === 200);
  const p = await getProduct(testProduct.id);
  check("Product unavailable (0 / out_of_stock)", Number(p.stock_quantity) === 0 && p.stock_status === "out_of_stock");
  check("No Back-in-Stock notification sent", (await bisCount(A.id, testProduct.id)) === before);
  check("OUT_OF_STOCK admin activity recorded", (await acts("OUT_OF_STOCK", testProduct.id)).length > 0);
  const alert = await alertRow(A.id, testProduct.id);
  check("NOTIFIED alert re-armed to ACTIVE for next restock", alert?.status === "ACTIVE");
}

async function test5_restockAgain() {
  banner("TEST 5 - Restock again 0 -> 10");
  const A = customers[0];
  const before = await bisCount(A.id, testProduct.id);
  const res = await api("PUT", `/api/admin/stock/${testProduct.id}`, { token: adminToken, body: { stock_quantity: 10, action_type: "restock" } });
  check("Transition detected again", res.json?.data?.backInStock?.backInStock === true);
  check("Customer notified again (2nd cycle)", (await bisCount(A.id, testProduct.id)) === before + 1);
}

async function test6_cancelAlert() {
  banner("TEST 6 - Cancelled alert never notified");
  const A = customers[0];
  const cancel = await api("DELETE", `/api/back-in-stock/${testProduct.id}`, { token: A.token });
  check("Cancel succeeds", cancel.status === 200);
  check("Alert status CANCELLED", (await alertRow(A.id, testProduct.id))?.status === "CANCELLED");
  await setStockDirect(testProduct.id, 0);
  const before = await bisCount(A.id, testProduct.id);
  await api("PUT", `/api/admin/stock/${testProduct.id}`, { token: adminToken, body: { stock_quantity: 7, action_type: "restock" } });
  check("Cancelled customer received NO notification", (await bisCount(A.id, testProduct.id)) === before);
}

async function test7_multipleCustomers() {
  banner("TEST 7 - Multiple customers, no duplicates");
  const B = customers[1], C = customers[2];
  await api("POST", `/api/back-in-stock/${testProduct.id}`, { token: B.token });
  await api("POST", `/api/back-in-stock/${testProduct.id}`, { token: C.token });
  await setStockDirect(testProduct.id, 0);
  const bBefore = await bisCount(B.id, testProduct.id);
  const cBefore = await bisCount(C.id, testProduct.id);
  const res = await api("PUT", `/api/admin/stock/${testProduct.id}`, { token: adminToken, body: { stock_quantity: 20, action_type: "restock" } });
  check("Both eligible customers notified", res.json?.data?.backInStock?.notificationsCreated === 2, String(res.json?.data?.backInStock?.notificationsCreated));
  check("Customer B got exactly 1 new notification", (await bisCount(B.id, testProduct.id)) === bBefore + 1);
  check("Customer C got exactly 1 new notification", (await bisCount(C.id, testProduct.id)) === cBefore + 1);
  const waiting = await api("GET", `/api/admin/back-in-stock/product/${testProduct.id}/waiting`, { token: adminToken });
  check("Waiting list API returns eligible customers", waiting.json?.data?.pagination?.total >= 2);
}

async function test8_priceDropCombined() {
  banner("TEST 8 - Combined Price Drop + Restock");
  const D = customers[3];
  await api("POST", `/api/back-in-stock/${testProduct.id}`, { token: D.token });
  await setStockDirect(testProduct.id, 0);
  const dBisBefore = await bisCount(D.id, testProduct.id);
  const dPdBefore = await priceDropCount(D.id, testProduct.id);
  // Product update API: stock 0 -> 15 AND price 5999 -> 4999 in ONE call
  const res = await api("PUT", `/api/admin/products/${testProduct.id}`, {
    token: adminToken,
    body: {
      name: testProduct.name, price: 4999, stock: 15, category_id: testProduct.category_id,
      description: testProduct.description, short_description: testProduct.short_description,
    },
  });
  check("Product update succeeds", res.status === 200);
  const bis = res.json?.data?.backInStock;
  check("BackInStock transition detected", bis?.backInStock === true);
  check("ONE combined notification sent to subscriber", (await bisCount(D.id, testProduct.id)) === dBisBefore + 1);
  check("NO separate PRICE_DROP notification for subscriber", (await priceDropCount(D.id, testProduct.id)) === dPdBefore);
  const notif = await latestBis(D.id, testProduct.id);
  check("Notification is combined Back in Stock + Price Drop", /price drop/i.test(notif?.title || ""));
  const data = JSON.parse(notif?.data || "{}");
  check("Combined notification carries old+new price", Number(data.oldPrice) === 5999 && Number(data.newPrice) === 4999);
}

async function test9_lowRestockDemand() {
  banner("TEST 9 - Demand exceeds restock");
  // B, C, D are NOTIFIED after test 8. Going OOS re-arms them to ACTIVE (3 waiting).
  await setStockDirect(testProduct.id, 0);
  const res = await api("PUT", `/api/admin/stock/${testProduct.id}`, { token: adminToken, body: { stock_quantity: 2, action_type: "restock" } });
  check("Restock processed", res.json?.data?.backInStock?.backInStock === true);
  const demandActs = await acts("DEMAND_EXCEEDS_RESTOCK", testProduct.id);
  check("DEMAND_EXCEEDS_RESTOCK activity created when waiting > restocked", demandActs.length > 0,
    demandActs.length ? `${demandActs[0].metadata?.waitingCustomers ?? "?"} waiting vs ${demandActs[0].metadata?.restockedUnits ?? "?"} units` : "");
}

async function test10_duplicateUpdate() {
  banner("TEST 10 - Duplicate / same-level updates");
  await setStockDirect(testProduct.id, 10);
  const B = customers[1];
  const before = await bisCount(B.id, testProduct.id);
  const res = await api("PUT", `/api/admin/stock/${testProduct.id}`, { token: adminToken, body: { stock_quantity: 5, action_type: "restock" } });
  check("Same-level update succeeds silently", res.status === 200);
  check("No transition reported", res.json?.data?.backInStock?.backInStock !== true);
  check("No new notifications", (await bisCount(B.id, testProduct.id)) === before);
  const badSub = await api("POST", `/api/back-in-stock/${testProduct.id}`, { token: customers[3].token });
  check("Cannot subscribe while product already in stock", badSub.json?.data?.subscribed === false && badSub.json?.data?.reason === "already_in_stock");
}

async function test11_adminActivity() {
  banner("TEST 11 - Admin Activity records restock");
  const rows = await acts("BACK_IN_STOCK", testProduct.id);
  check("BACK_IN_STOCK activity entries exist", rows.length > 0, `${rows.length} events`);
  if (rows.length) {
    const m = typeof rows[0].metadata === "string" ? JSON.parse(rows[0].metadata) : rows[0].metadata;
    check("Activity has previousStock/newStock", m.previousStock !== undefined && m.newStock !== undefined, `${m.previousStock} -> ${m.newStock}`);
    check("Activity has waitingCustomers count", typeof m.waitingCustomers === "number");
    check("Activity has notificationsCreated count", typeof m.notificationsCreated === "number");
    check("Activity priority HIGH", rows[0].priority === "HIGH");
  }
  const inv = await api("GET", "/api/admin/activity?category=inventory&limit=50", { token: adminToken });
  check("Admin Activity Center inventory filter works", inv.status === 200 && Array.isArray(inv.json?.data?.activities));
  const types = new Set((inv.json?.data?.activities || []).map((a) => a.activity_type));
  check("Inventory feed contains BACK_IN_STOCK/OUT_OF_STOCK", types.has("BACK_IN_STOCK") || types.has("OUT_OF_STOCK"));
}

async function test12_security() {
  banner("TEST 12 - Security");
  const cust = await api("GET", `/api/admin/back-in-stock/product/${testProduct.id}/waiting`, { token: customers[1].token });
  check("Customer blocked from admin waiting-list API (403)", cust.status === 403, `status=${cust.status}`);
  const noAuth = await api("GET", `/api/admin/back-in-stock/product/${testProduct.id}/waiting`);
  check("Anonymous blocked (401)", noAuth.status === 401);
  const counts = await api("GET", "/api/admin/back-in-stock/waiting-counts", { token: customers[1].token });
  check("Customer blocked from waiting-counts API (403)", counts.status === 403);
  const analytics = await api("GET", `/api/admin/back-in-stock/product/${testProduct.id}/analytics`, { token: adminToken });
  check("Admin can access restock analytics", analytics.status === 200 && analytics.json?.data?.product?.id === testProduct.id);
  check("Analytics reports real numbers",
    typeof analytics.json?.data?.waitingCustomers === "number" &&
    typeof analytics.json?.data?.notificationsSent === "number" &&
    typeof analytics.json?.data?.purchasesAfterRestock === "number");
}

async function cleanup() {
  banner("CLEANUP");
  try {
    await query("DELETE FROM notifications WHERE entity_type='product' AND entity_id=?", [testProduct.id]);
    await query("DELETE FROM admin_activity_logs WHERE entity_type='product' AND entity_id=?", [testProduct.id]);
    await query("DELETE FROM inventory_logs WHERE product_id=?", [testProduct.id]);
    await query("DELETE FROM inventory_alerts WHERE product_id=?", [testProduct.id]);
    await query("DELETE FROM product_price_history WHERE product_id=?", [testProduct.id]);
    await query("DELETE FROM products WHERE id=?", [testProduct.id]); // cascades alerts
    for (const c of customers) await query("DELETE FROM users WHERE id=?", [c.id]);
    console.log(`  Removed test product #${testProduct.id} and ${customers.length} test customers`);
  } catch (e) {
    console.warn("  Cleanup warning:", e.message);
  }
}

(async () => {
  try {
    await setup();
    await test1_notifyMe();
    await test2_restock();
    await test3_noFalseTrigger();
    await test4_outOfStock();
    await test5_restockAgain();
    await test6_cancelAlert();
    await test7_multipleCustomers();
    await test8_priceDropCombined();
    await test9_lowRestockDemand();
    await test10_duplicateUpdate();
    await test11_adminActivity();
    await test12_security();
  } catch (err) {
    FAIL.push(`FATAL: ${err.message}`);
    console.error("\nFATAL ERROR:", err);
  } finally {
    if (testProduct) await cleanup();
    banner("RESULTS");
    console.log(`  Passed: ${PASS.length}`);
    console.log(`  Failed: ${FAIL.length}`);
    if (FAIL.length) { console.log("\nFailures:"); FAIL.forEach((f) => console.log("   -", f)); }
    try { await pool.end(); } catch { /* ignore */ }
    process.exit(FAIL.length ? 1 : 0);
  }
})();