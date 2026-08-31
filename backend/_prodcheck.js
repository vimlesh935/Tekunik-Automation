const { query } = require("./src/config/db");
(async () => {
  const rows = await query(
    `SELECT id, name, price, status, stock_quantity, category_id
     FROM products
     WHERE status = 'active'
     ORDER BY ABS(price - 1000) ASC
     LIMIT 20`
  );
  rows.forEach((x) => console.log(JSON.stringify(x)));
  const n = await query("SELECT COUNT(*) c FROM products p LEFT JOIN discounts dpx ON dpx.product_id = p.id WHERE dpx.id IS NOT NULL");
  console.log("products-with-offer-link", n[0].c);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });