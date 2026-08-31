const { query } = require("../backend/src/config/db");

(async () => {
  try {
    const db = await query("SELECT DATABASE() as db");
    console.log("DB:", db[0]?.db);

    const coupons = await query(
      `SELECT c.id, c.code, c.offer_id, c.status, c.expires_at, c.usage_limit, c.used_count, c.per_user_limit, c.user_id, c.coupon_type, c.created_at
       FROM coupons c
       ORDER BY c.id DESC LIMIT 30`
    );
    console.log("COUPONS:");
    console.table(
      coupons.map((r) => ({
        id: r.id,
        code: r.code,
        offer_id: r.offer_id,
        status: r.status,
        expires: r.expires_at,
        used: r.used_count,
        limit: r.usage_limit,
        per_user: r.per_user_limit,
        owner: r.user_id,
        type: r.coupon_type,
      }))
    );

    const offers = await query(
      `SELECT id, name, title, type, value, maximum_discount, min_order_value, apply_to, is_active, starts_at, expires_at, new_user_only, usage_limit, used_count
       FROM discounts
       ORDER BY id DESC LIMIT 30`
    );
    console.log("OFFERS:");
    console.table(
      offers.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        val: r.value,
        maxd: r.maximum_discount,
        min_order: r.min_order_value,
        apply_to: r.apply_to,
        active: r.is_active,
        starts: r.starts_at,
        exp: r.expires_at,
        nu: r.new_user_only,
      }))
    );

    const products = await query(
      `SELECT id, name, price, sale_price, category_id, stock_quantity, status
       FROM products
       ORDER BY id LIMIT 10`
    );
    console.log("PRODUCTS:");
    console.table(
      products.map((r) => ({
        id: r.id,
        name: r.name,
        price: r.price,
        sale: r.sale_price,
        cat: r.category_id,
        stock: r.stock_quantity,
        active: r.status,
      }))
    );

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();