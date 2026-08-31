/* Coupon flow integration test (uses the real DB). Run: node test-coupon-flow.js */
const { pool, query } = require("./src/config/db");
const couponService = require("./src/services/couponService");

const toMoney = (v) => Math.round((Number(v) || 0) * 100) / 100;
let pass = 0;
let fail = 0;
const check = (name, cond, detail = "") => {
  if (cond) { pass += 1; console.log(`  OK ${name}${detail ? " - " + detail : ""}`); }
  else { fail += 1; console.log(`  FAIL ${name}${detail ? " - " + detail : ""}`); }
};

const CODE_ALIVE = [];

(async () => {
  try {
    const offers = await query("SELECT id,name,type,value,maximum_discount,min_order_value,apply_to,is_active,new_user_only FROM discounts WHERE (starts_at IS NULL OR starts_at <= NOW()) ORDER BY new_user_only ASC, id DESC LIMIT 5");
    const products = await query("SELECT id,price,category_id FROM products WHERE status='active' ORDER BY id LIMIT 3");
    const users = await query("SELECT id FROM users WHERE role IN ('user','customer') OR role IS NULL LIMIT 1");

    if (!offers.length) { console.log("SKIP: no offers exist in DB"); return; }
    if (!products.length) { console.log("SKIP: no active products"); return; }

    const offer = offers[0];
    const user = users[0] || null;
    console.log(`\nUsing offer#${offer.id} ${offer.name || offer.title} (${offer.type} ${offer.value}) product#${products[0].id} user#${user ? user.id : "none"}`);

    // 1) generate a code (one-host one offers)
    const code = await couponService.generateUniqueCouponCode({ prefix: "TEST", length: 8 });
    check("generateUniqueCouponCode returns safe code", /^TEST-[A-Z2-9]{8}$/.test(code), code);
    CODE_ALIVE.push(code);

    const code2 = await couponService.generateUniqueCouponCode({ prefix: "TEST", length: 8 });
    check("two generated codes differ", code !== code2);

    // 2) create a coupon linked to the offer
    const coupon = await couponService.createCoupon({ code, offer_id: offer.id, coupon_type: "shared", per_user_limit: 1 });
    check("createCoupon links to offer", coupon && Number(coupon.offer_id) === Number(offer.id), `id=${coupon.id}`);

    // 3) lookup by code (case-insensitive)
    const found = await couponService.getCouponByCode(code.toLowerCase());
    check("getCouponByCode case-insensitive", !!found && found.id === coupon.id);
    check("validate invalid code -> COUPON_NOT_FOUND",
      (await couponService.validateCoupon({ userId: user && user.id, code: "NOPE", items: [{ product_id: 1, category_id: 1, price: 100, quantity: 1 }], subtotal: 100 })).ok === false);

    // 4) apply to a cart (seed an eligible cart line so the test is self-sufficient)
    let seededCartItemId = null;
    let preExistingQty = null;
    let eligibleProduct = null;
    if (offer.apply_to === "selected_products" || offer.apply_to === "selected_product") {
      const rows = await query(
        "SELECT p.id, p.price, p.category_id FROM offer_products op JOIN products p ON p.id = op.product_id AND p.status='active' WHERE op.offer_id = ? LIMIT 1",
        [offer.id]
      );
      eligibleProduct = rows[0] || null;
    } else if (offer.apply_to === "selected_category") {
      const rows = await query(
        "SELECT p.id, p.price, p.category_id FROM offer_categories oc JOIN products p ON p.category_id = oc.category_id AND p.status='active' WHERE oc.offer_id = ? LIMIT 1",
        [offer.id]
      );
      eligibleProduct = rows[0] || null;
    } else {
      eligibleProduct = products[0];
    }

    if (user) {
      if (eligibleProduct) {
        const cart = await couponService.findOrCreateCart(user.id);
        const qty = Number(offer.min_order_value) > 0
          ? Math.max(1, Math.ceil(Number(offer.min_order_value) / Number(eligibleProduct.price || 1)))
          : 1;
        const [item] = await query(
          "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1",
          [cart.id, eligibleProduct.id]
        );
        if (item) {
          seededCartItemId = item.id;
          preExistingQty = Number(item.quantity || 1);
          await query("UPDATE cart_items SET quantity = ? WHERE id = ?", [qty, item.id]);
        } else {
          const r = await query(
            "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
            [cart.id, eligibleProduct.id, qty]
          );
          seededCartItemId = r.insertId;
        }
      } else {
        console.log("  (no eligible product found for offer scope - skipping cart seed)");
      }
      let cart;
      try {
        const res = await couponService.applyCoupon({ userId: user.id, code });
        cart = await couponService.loadCartLines(user.id);
        check("applyCoupon persists coupon on cart", cart.cart.applied_coupon_code === code, JSON.stringify(res));
      } catch (e) {
        check("applyCoupon persisted coupon", false, e.message + " (may need an active offer window / eligible product)");
      }
      const totals = await couponService.calculateCartTotals(user.id);
      console.log("  totals:", JSON.stringify(totals));
      await couponService.removeCoupon({ userId: user.id });
      const after = await couponService.loadCartLines(user.id);
      check("removeCoupon clears coupon", !after.cart.applied_coupon_code);
      // Restore pre-existing quantity or remove the seeded cart line.
      if (seededCartItemId) {
        if (preExistingQty !== null) {
          await query("UPDATE cart_items SET quantity = ? WHERE id = ?", [preExistingQty, seededCartItemId]);
        } else {
          await query("DELETE FROM cart_items WHERE id = ?", [seededCartItemId]);
        }
      }
    }

    // 5) discount calc sanity
    const { discount } = couponService.computeCouponDiscountForItems({ offer, items: [{ product_id: products[0].id, category_id: products[0].category_id, price: 5999, quantity: 1 }], orderSubtotal: 5999 });
    console.log("  coupon discount on 5999:", discount);
    check("discount is a non-negative number", !Number.isNaN(discount) && discount >= 0);

    check("listCoupons returns created coupon", (await couponService.listCoupons({ search: code.slice(0, 4) })).coupons.some((c) => c.code === code));
  } catch (error) {
    fail += 1;
    console.error("\nUNEXPECTED ERROR:", error && error.message);
    console.error(error && error.stack);
  } finally {
    for (const c of CODE_ALIVE) {
      try { const cc = await couponService.getCouponByCode(c); if (cc) await couponService.deleteCoupon(cc.id); } catch (_) {}
    }
    console.log(`\nRESULT  PASS=${pass} FAIL=${fail}`);
    await pool.end();
    process.exit(fail ? 1 : 0);
  }
})();
