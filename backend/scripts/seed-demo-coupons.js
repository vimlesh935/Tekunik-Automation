/* ============================================================
   DEMO COUPON SEED — development/testing convenience.
   Creates EXACT, human-typable codes (SAVE10, FLAT200, ...) via
   the explicit-code path (same as admin panel creation).
   Clearly marked as demo data. Safe to re-run (skips existing).
   Run: node scripts/seed-demo-coupons.js
   ============================================================ */
require("dotenv").config();
const { pool, query } = require("../src/config/db");
const couponService = require("../src/services/couponService");

const DEMO_OFFERS = [
  {
    name: "Demo Save 10", title: "10% OFF sitewide", description: "Get 10% off up to ₹500 on your order.",
    type: "percentage", value: 10, min_order_value: 999, maximum_discount: 500, code: "SAVE10",
  },
  {
    name: "Demo Flat 200", title: "₹200 OFF on orders above ₹1499", description: "Flat ₹200 off on orders above ₹1499.",
    type: "fixed", value: 200, min_order_value: 1499, maximum_discount: null, code: "FLAT200",
  },
];

(async () => {
  try {
    console.log("🌱 Seeding DEMO coupons with exact human-typable codes...\n");
    for (const o of DEMO_OFFERS) {
      await query(
        `INSERT INTO discounts (name, title, description, type, value, apply_to, min_order_value, maximum_discount, is_active, audience, coupon_generation, coupon_prefix)
         SELECT ?, ?, ?, ?, ?, 'all', ?, ?, 1, 'ALL', 'SHARED', ?
         FROM DUAL WHERE NOT EXISTS (SELECT id FROM discounts WHERE name = ?)`,
        [o.name, o.title, o.description, o.type, o.value, o.min_order_value, o.maximum_discount, o.code, o.name]
      );
      const [offer] = await query("SELECT id FROM discounts WHERE name = ? LIMIT 1", [o.name]);

      // Remove any older suffixed demo variants (e.g. SAVE10-F7TJ9X) to avoid
      // "typing SAVE10 → Coupon not found" confusion. Ledger rows cascade.
      await query(
        `DELETE FROM coupons WHERE offer_id = ? AND coupon_type = 'shared' AND code <> ?`,
        [offer.id, o.code]
      );

      const existing = await query(
        "SELECT id, code FROM coupons WHERE offer_id = ? AND coupon_type = 'shared' AND status = 'ACTIVE' LIMIT 1",
        [offer.id]
      );
      if (existing.length) {
        console.log(`  ↷ ${o.name}: coupon already exists → ${existing[0].code}`);
        continue;
      }

      // EXACT code (never a random suffix) — created via the same path the
      // admin panel uses; uniqueness is enforced by the DB constraint.
      const coupon = await couponService.createCoupon({
        code: o.code, offer_id: offer.id, coupon_type: "shared", usage_limit: 100, per_user_limit: 1, status: "ACTIVE",
      });
      console.log(`  ✅ ${o.name}: ${coupon.code} (offer #${offer.id}, coupon #${coupon.id})`);
    }
    console.log("\n✨ Demo seed complete. Users can now type SAVE10 / FLAT200 at checkout.");
  } catch (e) {
    console.error("SEED FAILED:", e.message);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch { /* ignore */ }
  }
})();
