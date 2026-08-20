/**
 * Discount utility functions for dynamic price calculation and display
 * Temporarily disabled via DISCOUNT_ENABLED flag — toggle to true to re-enable.
 */

const DISCOUNT_ENABLED = true;

/**
 * Calculate discount price fields for a product
 * @param {Object} product - Product object with price and optional discount_percent
 * @returns {Object} - { original_price, discount_percent, discount_amount, final_price }
 */
export const calculateDiscount = (product) => {
  if (!DISCOUNT_ENABLED) {
    const price = parseFloat(product.price) || 0;
    return {
      original_price: price,
      discount_percent: 0,
      discount_amount: 0,
      final_price: price,
    };
  }

  const originalPrice = parseFloat(product.price) || 0;
  let discountPercent = 0;

  if (product.discount_percent !== null && product.discount_percent !== undefined) {
    discountPercent = Math.max(0, Math.min(100, parseFloat(product.discount_percent) || 0));
  }

  const discountAmount = Math.max(0, originalPrice * discountPercent / 100);
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    original_price: originalPrice,
    discount_percent: Math.round(discountPercent * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    final_price: Math.round(finalPrice * 100) / 100,
  };
};

/**
 * Format price in Indian Rupee format
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted price string (e.g., "₹5,000")
 */
export const formatPrice = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "₹0";
  
  const whole = Math.round(num);
  const str = whole.toString();
  const lastThree = str.slice(-3);
  const otherDigits = str.slice(0, -3);

  if (otherDigits === "") return `₹${lastThree}`;

  const formatted =
    otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  return `₹${formatted}`;
};

/**
 * Get the price to display (final price if discounted, original otherwise)
 * @param {Object} product - Product with price and optional final_price/discount fields
 * @returns {number} - The price to display/use
 */
export const getDisplayPrice = (product) => {
  if (!DISCOUNT_ENABLED) {
    return parseFloat(product.price) || 0;
  }
  // If final_price is already calculated, use it
  if (product.final_price !== undefined && product.final_price !== null) {
    return product.final_price;
  }
  // Otherwise use original price
  return parseFloat(product.price) || 0;
};

/**
 * Check if product has an active discount
 * @param {Object} product - Product object
 * @returns {boolean}
 */
export const hasDiscount = (product) => {
  if (!DISCOUNT_ENABLED) return false;
  return product.discount_percent > 0;
};
