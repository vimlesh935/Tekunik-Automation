/**
 * COUPON SYSTEM STEP-1 END-TO-END TEST SUITE
 * Runs against the REAL server (http://localhost:8787) + REAL MySQL.
 *
 * Usage: node test-coupon.js
 */
const env = require("./src/config/env");
const { signToken } = require("./src/utils/jwt");
const { query, pool } = require("./src/config/db");
const { ensureCouponTables } = require("./src/config/migrate");
const couponService = require("./src/services/couponService");

const BASE = `http://localhost:${env.port}`;
const PASS = [];
const FAIL = [];
let adminToken = null;

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

const banner = (t) => console.log(`\n========== ${t} ===========`);

const norm = async (payload) => couponService.normalizeCouponInput(payload).normalized;

async function setup() {
  banner("SETUP / DATABASE CONNECTION");
  const health = await api("GET", "/health");
  check("Server is running on port " + env.port, health.status === 200);

  await ensureCouponTables();

  const [dbRow] = await query("SELECT 1 AS ok");
  check("MySQL connection OK", Number(dbRow?.ok) === 1);

  const couponsTable = await query("SHOW TABLES LIKE 'coupons'");
  check("coupons table exists", couponsTable.length > 0);
  const usageTable = await query("SHOW TABLES LIKE 'coupon_usage'");
  check("coupon_usage table exists", usageTable.length > 0);

  const cCols = await query("SHOW COLUMNS FROM coupons");
  const requiredCols = ["id","code","description","discount_type","discount_value","max_discount","minimum_order_value","start_date","expiry_date","usage_limit","used_count","per_user_limit","first_order_only","is_active","free_shipping","created_by","created_at","updated_at"];
  const colNames = cCols.map((c) => c.Field);
  const missing = requiredCols.filter((c) => !colNames.includes(c));
  check("coupons table has all required columns", missing.length === 0, missing.length ? `missing: ${missing.join(",")}` : "");

  const codeCol = cCols.find((c) => c.Field === "code");
  check("coupons.code is UNIQUE", codeCol && codeCol.Key === "UNI");

  const created = await query("SHOW CREATE TABLE coupons");
  const ddl = created[0]?.["Create Table"] || created[0]?.Create || "";
  check("discount_value CHECK >= 0 declared", /chk_coupons_discount_value/.test(ddl));
  check("used_count CHECK >= 0 declared", /chk_coupons_used_count/.test(ddl));

  const uCols = await query("SHOW COLUMNS FROM coupon_usage");
  const uReq = ["coupon_id","user_id","order_id","discount_amount","used_at"];
  check("coupon_usage has required columns", uReq.every((c) => uCols.some((x) => x.Field === c)));
  const uIdx = await query("SHOW INDEX FROM coupon_usage");
  check("coupon_usage coupon_id+user_id index exists", uIdx.some((i) => i.Key_name === "idx_coupon_usage_coupon_user"));

  const admins = await query("SELECT id, email, role FROM admins LIMIT 1");
  check("Admin account exists for created_by FK", admins.length > 0);
  adminToken = signToken({ id: admins[0].id, email: admins[0].email, role: admins[0].role || "admin" });
}

async function crudTests() {
  banner("CREATE / FETCH / UPDATE");
  const code = `TEST${Date.now().toString(36).toUpperCase()}`;
  const payload = {
    code,
    description: "Step-1 test coupon",
    discount_type: "percentage",
    discount_value: 10,
    max_discount: 500,
    minimum_order_value: 1000,
    usage_limit: 100,
    per_user_limit: 1,
    is_active: true,
  };

  const created = await api("POST", "/api/admin/coupons", { token: adminToken, body: payload });
  check("Create coupon returns 201", created.status === 201, created.json?.message || created.status);
  const coupon = created.json?.data?.coupon;
  check("Create coupon returns id", Boolean(coupon?.id));
  check("Coupon code normalized (uppercase)", coupon?.code === code.toUpperCase(), coupon?.code);

  const fetched = await api("GET", `/api/admin/coupons/${coupon.id}`, { token: adminToken });
  check("Fetch coupon by id returns 200", fetched.status === 200);
  check("Fetched coupon matches", fetched.json?.data?.coupon?.code === coupon.code);

  const byCode = await couponService.getCouponByCode(code);
  check("Service getCouponByCode works", byCode && byCode.id === coupon.id);

  const list = await api("GET", "/api/admin/coupons?page=1&limit=20", { token: adminToken });
  check("List coupons returns 200", list.status === 200);
  check("Created coupon present in list", list.json?.data?.coupons?.some((c) => c.id === coupon.id));

  const updated = await api("PUT", `/api/admin/coupons/${coupon.id}`, {
    token: adminToken,
    body: { ...payload, code, discount_value: 15, max_discount: 25, description: "Updated desc" },
  });
  check("Update coupon returns 200", updated.status === 200, updated.json?.message || updated.status);
  check("Updated discount_value persisted", Number(updated.json?.data?.coupon?.discount_value) === 15);

  const disabled = await api("PATCH", `/api/admin/coupons/${coupon.id}/status`, { token: adminToken });
  check("Disable coupon (status patch)", disabled.status === 200 && disabled.json?.data?.coupon?.is_active === 0);
  const validationOff = await couponService.validateCouponForOrder({ code, userId: 1, orderAmount: 5000 });
  check("Validation rejects inactive coupon", validationOff.valid === false && validationOff.reasons.includes("Coupon is inactive"));

  const enabled = await api("PATCH", `/api/admin/coupons/${coupon.id}/status`, { token: adminToken });
  check("Enable coupon (status patch)", enabled.status === 200 && enabled.json?.data?.coupon?.is_active === 1);

  const validLow = await couponService.validateCouponForOrder({ code, userId: 1, orderAmount: 500 });
  check("Validation rejects below minimum order", validLow.valid === false && validLow.reasons.includes("Minimum order value not met"));

  const validOk = await couponService.validateCouponForOrder({ code, userId: 1, orderAmount: 5000 });
  check("Validation accepts valid order", validOk.valid === true, validOk.reasons.join(","));
  check("Discount capped at max_discount (15% of 5000 -> capped to 25)", validOk.discount === 25, `got ${validOk.discount}`);

  // Pure percentage calculation without a cap: create a separate uncapped coupon.
  const uncapped = await couponService.createCoupon(await norm({ code: `PCT${Date.now().toString(36).toUpperCase()}`, discount_type: "percentage", discount_value: 10, minimum_order_value: 0 }), 1);
  const pctResult = await couponService.validateCouponForOrder({ code: uncapped.code, userId: null, orderAmount: 5000 });
  check("Percentage 10% of 5000 = 500 (no cap)", pctResult.discount === 500, `got ${pctResult.discount}`);
  await couponService.deleteCoupon(uncapped.id);

  return coupon.id;
}

async function validationAndDuplicateTests() {
  banner("VALIDATION / DUPLICATES");
  const noCode = await api("POST", "/api/admin/coupons", { token: adminToken, body: { discount_type: "percentage", discount_value: 10 } });
  check("Reject missing code (400)", noCode.status === 400);
  const badVal = await api("POST", "/api/admin/coupons", { token: adminToken, body: { code: "BAD-VAL", discount_type: "percentage", discount_value: 0 } });
  check("Reject zero/negative discount value (400)", badVal.status === 400);
  const badType = await api("POST", "/api/admin/coupons", { token: adminToken, body: { code: "BAD-TYPE", discount_type: "bogo", discount_value: 10 } });
  check("Reject invalid discount type (400)", badType.status === 400);
  const negMax = await api("POST", "/api/admin/coupons", { token: adminToken, body: { code: "NEG-MAX", discount_type: "fixed", discount_value: 10, max_discount: -5 } });
  check("Reject negative max_discount (400)", negMax.status === 400);
  const badDates = await api("POST", "/api/admin/coupons", { token: adminToken, body: { code: "BAD-DATES", discount_type: "percentage", discount_value: 10, start_date: "2026-01-01", expiry_date: "2025-01-01" } });
  check("Reject expiry < start (400)", badDates.status === 400);
  const badLimit = await api("POST", "/api/admin/coupons", { token: adminToken, body: { code: "NEG-LIMIT", discount_type: "percentage", discount_value: 10, usage_limit: -1 } });
  check("Reject negative usage limit (400)", badLimit.status === 400);

  const dup = { code: `DUP${Date.now().toString(36).toUpperCase()}`, discount_type: "fixed", discount_value: 50 };
  const first = await couponService.createCoupon(await norm(dup), 1);
  let dupThrew = false;
  try {
    await query("INSERT INTO coupons (code, description, discount_type, discount_value, per_user_limit, is_active, free_shipping) VALUES (?,?,?,?,?,?,?)", [dup.code.toUpperCase(), null, "fixed", 50, 1, 1, 0]);
  } catch (e) {
    dupThrew = e.code === "ER_DUP_ENTRY";
  }
  check("Duplicate coupon code rejected by DB (unique)", dupThrew);
  const dupApi = await api("POST", "/api/admin/coupons", { token: adminToken, body: dup });
  check("Duplicate code rejected 409 via API", dupApi.status === 409);
  await couponService.deleteCoupon(first.id);
  return true;
}

async function couponUsageTest() {
  banner("COUPON_USAGE ROWS (FK + indexes)");
  const payload = { code: `USAGE${Date.now().toString(36).toUpperCase()}`, discount_type: "fixed", discount_value: 99, minimum_order_value: 0 };
  const created = await couponService.createCoupon(await norm(payload), 1);
  const users = await query("SELECT id FROM users LIMIT 1");
  const userId = users[0]?.id || null;
  const ins = await query(
    "INSERT INTO coupon_usage (coupon_id, user_id, discount_amount) VALUES (?, ?, ?)",
    [created.id, userId, 99],
  );
  check("Insert coupon_usage row succeeds", ins.insertId > 0);
  const usageCount = await couponService.countCouponUsage(created.id);
  check("countCouponUsage reflects row", usageCount === 1);
  const perUser = await couponService.countCouponUsageForUser(created.id, userId);
  check(userId ? "countCouponUsageForUser works" : "per-user counted (guest)", userId ? perUser === 1 : perUser === 0);
  await couponService.deleteCoupon(created.id);
  const left = await query("SELECT COUNT(*) AS c FROM coupon_usage WHERE coupon_id=?", [created.id]);
  check("coupon_usage cascades on coupon delete", Number(left[0].c) === 0);
  return true;
}

async function cleanup(id) {
  banner("CLEANUP");
  if (!id) return;
  const r = await api("DELETE", `/api/admin/coupons/${id}`, { token: adminToken });
  check("Delete test coupon returns 200", r.status === 200);
  const gone = await couponService.getCouponById(id);
  check("Coupon removed from DB", !gone);
}

(async () => {
  try {
    await setup();
    const couponId = await crudTests();
    await validationAndDuplicateTests();
    await couponUsageTest();
    await cleanup(couponId);
  } catch (error) {
    console.error("\nUNEXPECTED ERROR", error);
    FAIL.push("Unexpected error: " + (error && error.message));
  } finally {
    banner("RESULT");
    console.log(`PASS: ${PASS.length}`);
    console.log(`FAIL: ${FAIL.length}`);
    if (FAIL.length) {
      console.log("\nFailed checks:");
      FAIL.forEach((f) => console.log("  - " + f));
    }
    await pool.end();
    process.exit(FAIL.length ? 1 : 0);
  }
})();

