const { query } = require("../config/db");

const toMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeOffer = (offer) => ({
  ...offer,
  id: Number(offer.id),
  value: Number(offer.value) || 0,
  product_id: offer.product_id === null || offer.product_id === undefined ? null : Number(offer.product_id),
  min_order_value:
    offer.min_order_value === null || offer.min_order_value === undefined
      ? null
      : Number(offer.min_order_value) || 0,
  maximum_discount:
    offer.maximum_discount === null || offer.maximum_discount === undefined
      ? null
      : Number(offer.maximum_discount) || 0,
  is_active: Number(offer.is_active) ? 1 : 0,
});

const getActiveOffers = async () => {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const offers = await query(
    `SELECT d.*
     FROM discounts d
     WHERE d.is_active = 1
       AND (d.starts_at IS NULL OR d.starts_at <= ?)
       AND (d.expires_at IS NULL OR d.expires_at >= ?)
     ORDER BY d.created_at DESC`,
    [now, now],
  );

  if (offers.length === 0) return [];

  const offerIds = offers.map((o) => o.id);
  const placeholders = offerIds.map(() => "?").join(",");

  const offerProducts = await query(
    `SELECT offer_id, product_id FROM offer_products WHERE offer_id IN (${placeholders})`,
    offerIds
  );

  const offerCategories = await query(
    `SELECT offer_id, category_id FROM offer_categories WHERE offer_id IN (${placeholders})`,
    offerIds
  );

  return offers.map((offer) => {
    const norm = normalizeOffer(offer);
    norm.product_ids = offerProducts
      .filter((op) => op.offer_id === offer.id)
      .map((op) => Number(op.product_id));
    norm.category_ids = offerCategories
      .filter((oc) => oc.offer_id === offer.id)
      .map((oc) => Number(oc.category_id));
    return norm;
  });
};

const isOfferEligibleForProduct = (offer, product, orderSubtotal = null) => {
  if (!offer || !product) return false;
  if (offer.min_order_value !== null && orderSubtotal !== null) {
    if (Number(orderSubtotal) < Number(offer.min_order_value)) {
      return false;
    }
  }

  if (offer.apply_to === "selected_products") {
    if (!offer.product_ids?.includes(Number(product.id))) return false;
  } else if (offer.apply_to === "selected_category") {
    if (!offer.category_ids?.includes(Number(product.category_id))) return false;
  } else if (offer.product_id && Number(offer.product_id) !== Number(product.id)) {
    // Backward compatibility for old records
    return false;
  }

  return true;
};

const calculateOfferPrice = (product, offers = [], orderSubtotal = null) => {
  const originalPrice = toMoney(product?.price);
  let best = {
    original_price: originalPrice,
    discount_percent: 0,
    discount_amount: 0,
    final_price: originalPrice,
    offer_id: null,
    offer_name: null,
    offer_type: null,
  };

  for (const rawOffer of offers) {
    const offer = normalizeOffer(rawOffer);
    if (!isOfferEligibleForProduct(offer, product, orderSubtotal)) continue;

    let discountAmount = 0;
    let discountPercent = 0;

    if (offer.type === "percentage") {
      discountPercent = Math.max(0, Math.min(100, offer.value));
      discountAmount = originalPrice * (discountPercent / 100);
      
      if (offer.maximum_discount && discountAmount > offer.maximum_discount) {
        discountAmount = offer.maximum_discount;
        discountPercent = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
      }
    } else if (offer.type === "fixed") {
      discountAmount = Math.max(0, Math.min(originalPrice, offer.value));
      discountPercent = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;
    } else {
      continue;
    }

    const next = {
      original_price: originalPrice,
      discount_percent: toMoney(discountPercent),
      discount_amount: toMoney(discountAmount),
      final_price: toMoney(Math.max(0, originalPrice - discountAmount)),
      offer_id: offer.id,
      offer_name: offer.title || offer.name,
      offer_type: offer.type,
      offer: offer,
    };

    if (next.discount_amount > best.discount_amount) best = next;
  }

  return best;
};

const enrichProductWithOffers = (product, offers = [], orderSubtotal = null) => ({
  ...product,
  ...calculateOfferPrice(product, offers, orderSubtotal),
});

const enrichProductsWithOffers = (products, offers = [], orderSubtotal = null) =>
  products.map((product) => enrichProductWithOffers(product, offers, orderSubtotal));

module.exports = {
  getActiveOffers,
  calculateOfferPrice,
  enrichProductWithOffers,
  enrichProductsWithOffers,
};
