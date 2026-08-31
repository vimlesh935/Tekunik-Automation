const couponService = require("../backend/src/services/couponService");
const { query } = require("../backend/src/config/db");

(async () => {
  try {
    // Find a recent test user
    const [user] = await query("SELECT id FROM users WHERE email LIKE 'brow.%' ORDER BY id DESC LIMIT 1");
    const uid = user ? user.id : null;
    console.log("Using user id:", uid);

    // Test 1: Fake code → COUPON_NOT_FOUND
    try {
      await couponService.applyCoupon({ userId: uid, code: "DOESNOTEXIST123" });
      console.log("TEST 10a - Fake code: UNEXPECTED SUCCESS");
    } catch (e) {
      console.log(`TEST 10a - Fake code: ${e.code} | ${e.message}`);
    }

    // Test 2: Future coupon → OFFER_NOT_STARTED
    try {
      await couponService.applyCoupon({ userId: uid, code: "FUTURE50" });
      console.log("TEST 10b - FUTURE50: UNEXPECTED SUCCESS");
    } catch (e) {
      console.log(`TEST 10b - FUTURE50: ${e.code} | ${e.message}`);
    }

        // Test 3: Valid coupon → success with discount (using SAVE10 = 10% off, max 500)
    try {
      await couponService.removeCoupon({ userId: uid });
      const r = await couponService.applyCoupon({ userId: uid, code: "SAVE10" });
      // 6000 * 10% = 600, capped at 500
      console.log(`TEST 10c - SAVE10: ok | discount=${r.discount} grandTotal=${r.grandTotal} couponCode=${r.couponCode}`);
    } catch (e) {
      console.log(`TEST 10c - SAVE10: ERROR ${e.code} | ${e.message}`);
    }

    // Test 4: Min order not met (reduce cart to 1x = 1000 < 999 min order for SAVE10... actually 1000>999)
    // Use FLAT200 which needs min_order 1499 — 1000 < 1499
    try {
      await couponService.removeCoupon({ userId: uid });
      await query("DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = ?)", [uid]);
      await query("INSERT INTO cart_items (cart_id, product_id, quantity) SELECT id, 19, 1 FROM carts WHERE user_id = ?", [uid]);
      try {
        await couponService.applyCoupon({ userId: uid, code: "FLAT200" });
        console.log("TEST 10d - Min order (FLAT200, 1000<1499): UNEXPECTED SUCCESS");
      } catch (e) {
        console.log(`TEST 10d - Min order (FLAT200, 1000<1499): ${e.code} | ${e.message}`);
      }
    } catch (e) {
      console.log(`TEST 10d - Setup error: ${e.message}`);
    }

    // Test 5: Verify SAVE10 and FLAT200 exist in DB
    const save10 = await query("SELECT id, code, offer_id, status FROM coupons WHERE code = 'SAVE10' LIMIT 1");
    const flat200 = await query("SELECT id, code, offer_id, status FROM coupons WHERE code = 'FLAT200' LIMIT 1");
    const future50 = await query("SELECT id, code, offer_id, status FROM coupons WHERE code = 'FUTURE50' LIMIT 1");
    console.log(`DB CHECK — SAVE10: ${save10.length ? 'exists' : 'MISSING'}, FLAT200: ${flat200.length ? 'exists' : 'MISSING'}, FUTURE50: ${future50.length ? 'exists' : 'MISSING'}`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();