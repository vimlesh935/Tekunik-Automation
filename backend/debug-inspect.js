/* TEMP DIAGNOSTIC — inspect coupon system state. Delete after debugging. */
const { pool, query } = require("./src/config/db");

(async () => {
  const [db] = await query("SELECT DATABASE() AS db");
  console.log("DB:", db.db);

  const [now] = await query("SELECT NOW() AS now");
  console.log("NOW():", now.now);

  const cols = await query("SHOW COLUMNS FROM coupons");
  console.log("\n-- coupons columns --");
  cols.forEach((c) => console.log(c.Field, c.Type));

  const all = await query(
    `SELECT id, code, offer_id, user_id, coupon_type, status, usage_limit, used_count, per_user_limit, expires_at
     FROM coupons ORDER BY id`
  );
  console.log("\n-- ALL coupons --");
  all.forEach((c) =>
    console.log(`#${c.id} ${c.code} offer=${c.offer_id} user=${c.user_id} ${c.coupon_type} ${c.status} limit=${c.usage_limit} used=${c.used_count} peruser=${c.per_user_limit} exp=${c.expires_at}`)
  );

  const offers = await query(
    `SELECT id, name, title, type, value, maximum_discount, min_order_value, apply_to, is_active, starts_at, expires_at,
            new_user_only, audience, usage_limit, used_count
     FROM discounts ORDER BY id`
  );
  console.log("\n-- ALL offers --");
  offers.forEach((o) =>
    console.log(`#${o.id} ${o.name} | ${o.title} | ${o.type} ${o.value} max=${o.maximum_discount} min=${o.min_order_value} apply=${o.apply_to} active=${o.is_active} starts=${o.starts_at} exp=${o.expires_at} newUser=${o.new_user_only} aud=${o.audience} ulimit=${o.usage_limit} used=${o.used_count}`)
  );

  const prodCount = await query("SELECT COUNT(*) AS c FROM products");
  const cartCount = await query("SELECT COUNT(*) AS c FROM carts");
  console.log("\nproducts:", prodCount[0].c, "carts:", cartCount[0].c);

  const [usage] = await query("SELECT COUNT(*) AS c, COALESCE(SUM(discount_amount),0) AS sum FROM coupon_usage");
  console.log("coupon_usage rows:", usage.c, "sum:", usage.sum);

  await pool.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});