const { query } = require("./src/config/db");
(async () => {
  const [r] = await query("SELECT DATABASE() d");
  console.log("DB", r.d);
  const rows = await query(
    `SELECT c.id, c.code, c.status, c.offer_id, c.expires_at,
            d.starts_at, d.expires_at AS offer_expires,
            d.type AS offer_type, d.value AS offer_value, d.maximum_discount, d.min_order_value,
            c.usage_limit, c.used_count, c.per_user_limit, c.user_id, c.coupon_type
     FROM coupons c
     LEFT JOIN discounts d ON d.id = c.offer_id
     WHERE c.code IN ('SAVE10','FUTURE50','FLAT200')
     ORDER BY c.id LIMIT 30`
  );
  rows.forEach((x) => console.log(JSON.stringify(x)));
  console.log("COUPON_COUNT", (await query("SELECT COUNT(*) n FROM coupons"))[0].n);
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});