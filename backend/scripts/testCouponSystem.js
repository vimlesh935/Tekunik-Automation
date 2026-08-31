const { query } = require("../src/config/db");
const couponService = require("../src/services/couponService");

async function runCouponTests() {
  console.log("=================================================");
  console.log("🚀 STARTING END-TO-END COUPON SUITE VERIFICATION");
  console.log("=================================================");

  let testPassed = 0;
  let testFailed = 0;

  const assert = (condition, testName, extraInfo = "") => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${extraInfo}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extraInfo}`);
      testFailed++;
    }
  };

  try {
    // 0. Ensure migration is run
    const { runCouponMigration } = require("../src/config/couponMigration");
    await runCouponMigration();

    // Clean up any previous test coupons
    await query("DELETE FROM coupon_usage WHERE coupon_id IN (SELECT id FROM coupons WHERE code LIKE 'TEST_%')");
    await query("DELETE FROM coupons WHERE code LIKE 'TEST_%'");

    console.log("\n--- TEST 1: Admin Standalone Coupon Creation ---");
    const coupon1 = await couponService.createCoupon({
      code: "TEST_SAVE20",
      description: "Test 20% discount up to ₹200 on min ₹1000",
      discount_type: "percentage",
      discount_value: 20,
      minimum_cart_value: 1000,
      maximum_discount: 200,
      usage_limit: 5,
      per_user_limit: 1,
      stack_with_offer: 1,
      is_active: 1,
    });
    assert(coupon1 && coupon1.id > 0, "Created percentage coupon TEST_SAVE20", `(ID: ${coupon1.id})`);
    assert(coupon1.discount_type === "percentage" && coupon1.discount_value === 20, "Coupon fields stored correctly");

    const couponFixed = await couponService.createCoupon({
      code: "TEST_FLAT150",
      description: "Test Flat ₹150 off",
      discount_type: "fixed",
      discount_value: 150,
      minimum_cart_value: 500,
      usage_limit: 10,
      per_user_limit: 2,
      stack_with_offer: 0,
      is_active: 1,
    });
    assert(couponFixed && couponFixed.discount_type === "fixed", "Created fixed coupon TEST_FLAT150");

    console.log("\n--- TEST 2: Admin Coupon Update ---");
    const updated = await couponService.updateCoupon(coupon1.id, {
      description: "Updated description for TEST_SAVE20",
      maximum_discount: 250,
    });
    assert(updated && updated.maximum_discount === 250, "Updated maximum_discount to 250");

    console.log("\n--- TEST 3: Validation - Valid Percentage Coupon with Cap ---");
    const valRes1 = await couponService.validateCoupon({
      code: "TEST_SAVE20",
      subtotal: 2000, // 20% of 2000 = 400, but cap is 250
      items: [{ product_id: 1, price: 2000, final_price: 2000, quantity: 1, discount_amount: 0 }],
    });
    assert(valRes1.ok === true, "Validation succeeds for valid cart >= 1000");
    assert(valRes1.discount === 250, "Discount capped at maximum_discount (250 instead of 400)", `(Got: ${valRes1.discount})`);

    console.log("\n--- TEST 4: Validation - Minimum Cart Value Shortfall ---");
    const valResMin = await couponService.validateCoupon({
      code: "TEST_SAVE20",
      subtotal: 800, // min is 1000, shortfall is 200
      items: [{ product_id: 1, price: 800, final_price: 800, quantity: 1, discount_amount: 0 }],
    });
    assert(valResMin.ok === false, "Validation correctly rejected when cart < min cart");
    assert(valResMin.code === "MIN_CART_NOT_REACHED", "Returned MIN_CART_NOT_REACHED code");
    assert(valResMin.shortfall === 200, "Calculated correct shortfall of ₹200", `(Got: ${valResMin.shortfall})`);

    console.log("\n--- TEST 5: Validation - Inactive / Disabled Coupon ---");
    await couponService.updateCouponStatus(coupon1.id, "DISABLED");
    const valResDisabled = await couponService.validateCoupon({
      code: "TEST_SAVE20",
      subtotal: 1500,
      items: [{ product_id: 1, price: 1500, final_price: 1500, quantity: 1, discount_amount: 0 }],
    });
    assert(valResDisabled.ok === false && valResDisabled.code === "COUPON_DISABLED", "Rejected disabled coupon");

    // Reactivate for subsequent tests
    await couponService.updateCouponStatus(coupon1.id, "ACTIVE");

    console.log("\n--- TEST 6: Validation - Expired Coupon ---");
    const expiredCoupon = await couponService.createCoupon({
      code: "TEST_EXPIRED",
      discount_type: "percentage",
      discount_value: 10,
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      is_active: 1,
    });
    const valResExpired = await couponService.validateCoupon({
      code: "TEST_EXPIRED",
      subtotal: 1000,
      items: [{ product_id: 1, price: 1000, final_price: 1000, quantity: 1, discount_amount: 0 }],
    });
    assert(valResExpired.ok === false && valResExpired.code === "COUPON_EXPIRED", "Rejected expired coupon");

    console.log("\n--- TEST 7: Offer Stacking Rules ---");
    // TEST_FLAT150 has stack_with_offer = 0
    const valResUnstackedWithOffer = await couponService.validateCoupon({
      code: "TEST_FLAT150",
      subtotal: 1000,
      items: [{ product_id: 1, price: 1000, original_price: 1200, final_price: 1000, discount_amount: 200, offer_id: 99 }],
    });
    assert(valResUnstackedWithOffer.ok === false, "Rejected unstacked coupon when product offer exists");
    assert(valResUnstackedWithOffer.code === "OFFER_STACK_DISALLOWED", "Returned OFFER_STACK_DISALLOWED code");
    assert(valResUnstackedWithOffer.message === "This coupon cannot be combined with the current offer.", "Exact stacking rejection message returned");

    // TEST_SAVE20 has stack_with_offer = 1
    const valResStackedWithOffer = await couponService.validateCoupon({
      code: "TEST_SAVE20",
      subtotal: 1000,
      items: [{ product_id: 1, price: 1000, original_price: 1200, final_price: 1000, discount_amount: 200, offer_id: 99 }],
    });
    assert(valResStackedWithOffer.ok === true, "Allowed stacked coupon with active product offer");
    assert(valResStackedWithOffer.discount === 200, "Applied 20% discount on ₹1000 offer-price (₹200)");

    console.log("\n--- TEST 8: Global Usage Limit and Per-User Limit ---");
    // Find or pick a test user
    const [testUser] = await query("SELECT id FROM users LIMIT 1");
    const userId = testUser ? testUser.id : 1;

    // Simulate usage recording
    await query(
      "INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)",
      [coupon1.id, userId, null, 200]
    );
    await query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [coupon1.id]);

    // Now test per-user limit rejection (per_user_limit = 1)
    const valResUserLimit = await couponService.validateCoupon({
      userId,
      code: "TEST_SAVE20",
      subtotal: 1200,
      items: [{ product_id: 1, price: 1200, final_price: 1200, quantity: 1, discount_amount: 0 }],
    });
    assert(valResUserLimit.ok === false && valResUserLimit.code === "COUPON_USER_LIMIT", "Enforced per-user usage limit");

    // Test total usage limit reached
    await query("UPDATE coupons SET used_count = 5 WHERE id = ?", [coupon1.id]);
    const valResTotalLimit = await couponService.validateCoupon({
      userId: 999999, // different user
      code: "TEST_SAVE20",
      subtotal: 1200,
      items: [{ product_id: 1, price: 1200, final_price: 1200, quantity: 1, discount_amount: 0 }],
    });
    assert(valResTotalLimit.ok === false && valResTotalLimit.code === "COUPON_LIMIT", "Enforced global usage limit");

    console.log("\n--- TEST 9: Admin Delete Coupon ---");
    const deleted = await couponService.deleteCoupon(expiredCoupon.id);
    assert(deleted === true, "Deleted expired test coupon");

    // Clean up test coupons
    await query("DELETE FROM coupon_usage WHERE coupon_id IN (SELECT id FROM coupons WHERE code LIKE 'TEST_%')");
    await query("DELETE FROM coupons WHERE code LIKE 'TEST_%'");

    console.log("\n=================================================");
    console.log(`TEST SUMMARY: ${testPassed} Passed, ${testFailed} Failed`);
    console.log("=================================================");

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runCouponTests();
