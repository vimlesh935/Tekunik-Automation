const { query } = require("../backend/src/config/db");
const couponService = require("../backend/src/services/couponService");
const { applyCoupon, listAvailableCoupons } = couponService;

(async () => {
  try {
    // Find a recent test user
    const [user] = await query("SELECT id, email FROM users WHERE email LIKE 'btv2.%' ORDER BY id DESC LIMIT 1");
    if (!user) { console.log("No btv2 user found"); process.exit(0); }
    console.log("User:", user.email, "id:", user.id);

    // Load cart
    const { items, subtotal } = await couponService.loadCartLines(user.id);
    console.log("Cart items:", items.length, "subtotal:", subtotal);

    // List available coupons
    const result = await listAvailableCoupons(user.id);
    console.log("Available coupons:", result.coupons.length);
    result.coupons.forEach(c => {
      console.log(`  ${c.code} | eligible=${c.eligible} | locked=${c.locked} | reason=${c.lockReason} | msg=${c.lockMessage}`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

