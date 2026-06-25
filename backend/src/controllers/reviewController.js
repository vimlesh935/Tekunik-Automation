const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");

const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");

const parseReviewImages = (images) => {
  if (!images) return [];
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
};

const normalizeReview = (review) => ({
  ...review,
  is_approved: Boolean(review.is_approved),
  show_on_website: Boolean(review.show_on_website),
  review_images: parseReviewImages(review.review_images),
});

// ─────────────────────────────────────────────────────────────
// CUSTOMER: Submit Review
// ─────────────────────────────────────────────────────────────

const createReview = asyncHandler(async (req, res) => {
  const { order_id, product_id, rating, review_title, review_message, review_images } = req.body;
  const user_id = req.user.id;

  if (!order_id || !product_id || !rating) {
    throw new AppError("order_id, product_id, and rating are required", 400);
  }
  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  // Verify order belongs to user and is delivered
  const [order] = await query(
    "SELECT id, status, user_id FROM orders WHERE id = ? AND user_id = ?",
    [order_id, user_id]
  );
  if (!order) throw new AppError("Order not found", 404);
  if (order.status !== "delivered") {
    throw new AppError("Can only review delivered orders", 400);
  }

  // Verify product exists in order
  const [item] = await query(
    "SELECT id FROM order_items WHERE order_id = ? AND product_id = ?",
    [order_id, product_id]
  );
  if (!item) throw new AppError("Product not found in this order", 404);

  // Prevent duplicate review for same order+product
  const [existing] = await query(
    "SELECT id FROM product_reviews WHERE order_id = ? AND product_id = ?",
    [order_id, product_id]
  );
  if (existing) {
    throw new AppError("You have already reviewed this product for this order", 400);
  }

  // Get customer name
  const [profile] = await query(
    "SELECT first_name, last_name FROM user_profiles WHERE user_id = ?",
    [user_id]
  );
  const customerName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : null;

  const imagesJson = review_images
    ? JSON.stringify(Array.isArray(review_images) ? review_images : [review_images])
    : null;

  const result = await query(
    `INSERT INTO product_reviews
      (order_id, product_id, user_id, customer_name, rating, review_title, review_message, review_images, review_status, is_approved, show_on_website, website_visibility)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, 'hidden')`,
    [
      order_id,
      product_id,
      user_id,
      customerName,
      rating,
      review_title || null,
      review_message || null,
      imagesJson,
    ]
  );

  return success(res, "Review submitted successfully. Awaiting admin approval.", {
    review: {
      id: result.insertId,
      order_id,
      product_id,
      rating,
      review_title,
      review_message,
      review_images: review_images || null,
      review_status: "pending",
    },
  }, 201);
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get Approved Reviews for a Product
// ─────────────────────────────────────────────────────────────

const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const { rating, limit = 50, page = 1 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = "WHERE pr.product_id = ? AND pr.is_approved = 1 AND pr.show_on_website = 1";
  const params = [productId];

  if (rating) {
    whereClause += " AND pr.rating = ?";
    params.push(Number(rating));
  }

  const reviews = await query(`
    SELECT
      pr.id, pr.product_id, pr.order_id, pr.user_id, pr.customer_name,
      pr.rating, pr.review_title, pr.review_message, pr.review_images,
      pr.review_status, pr.is_approved, pr.show_on_website, pr.website_visibility,
      pr.admin_notes, pr.created_at, pr.approved_at,
      up.first_name, up.last_name
    FROM product_reviews pr
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ${whereClause}
    ORDER BY pr.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  const parsedReviews = reviews.map(normalizeReview);

  const [statsRow] = await query(`
    SELECT
      AVG(rating) AS avg_rating,
      COUNT(*) AS total_reviews,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS two_star,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS one_star
    FROM product_reviews
    WHERE product_id = ? AND is_approved = 1 AND show_on_website = 1
  `, [productId]);

  return success(res, "Reviews fetched", {
    reviews: parsedReviews,
    statistics: {
      averageRating: parseFloat(statsRow.avg_rating) || 0,
      totalReviews: Number(statsRow.total_reviews) || 0,
      fiveStar: Number(statsRow.five_star) || 0,
      fourStar: Number(statsRow.four_star) || 0,
      threeStar: Number(statsRow.three_star) || 0,
      twoStar: Number(statsRow.two_star) || 0,
      oneStar: Number(statsRow.one_star) || 0,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get Approved Reviews Shown on Website
// ─────────────────────────────────────────────────────────────

const getPublicReviews = asyncHandler(async (req, res) => {
  const { limit = 20, page = 1 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  console.log("[REVIEWS] GET public reviews", { route: req.originalUrl, limit, page });

  const reviews = await query(`
    SELECT
      pr.id, pr.product_id, pr.order_id, pr.user_id, pr.customer_name,
      pr.rating, pr.review_title, pr.review_message, pr.review_images,
      pr.review_status, pr.is_approved, pr.show_on_website, pr.website_visibility,
      pr.created_at, pr.approved_at,
      p.name AS product_name,
      up.first_name, up.last_name
    FROM product_reviews pr
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    WHERE pr.is_approved = 1 AND pr.show_on_website = 1
    ORDER BY pr.approved_at DESC, pr.created_at DESC
    LIMIT ? OFFSET ?
  `, [Number(limit), offset]);

  return success(res, "Public reviews fetched", {
    reviews: reviews.map(normalizeReview),
  });
});

// ─────────────────────────────────────────────────────────────
// CUSTOMER: Get User's Review for a Specific Order+Product
// ─────────────────────────────────────────────────────────────

const getUserReviewForOrder = asyncHandler(async (req, res) => {
  const { orderId, productId } = req.params;
  const user_id = req.user.id;

  const [review] = await query(
    `SELECT id, order_id, product_id, rating, review_title, review_message,
            review_images, review_status, is_approved, show_on_website, created_at
     FROM product_reviews
     WHERE order_id = ? AND product_id = ? AND user_id = ?`,
    [orderId, productId, user_id]
  );

  const parsed = review
    ? normalizeReview(review)
    : null;

  return success(res, "Review fetched", { review: parsed });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Get All Reviews (with filters)
// ─────────────────────────────────────────────────────────────

const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const { status, product_id, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = "WHERE 1=1";
  const params = [];

  if (status) {
    whereClause += " AND pr.review_status = ?";
    params.push(status);
  }
  if (product_id) {
    whereClause += " AND pr.product_id = ?";
    params.push(Number(product_id));
  }

  const reviews = await query(`
    SELECT
      pr.id, pr.product_id, pr.order_id, pr.user_id, pr.customer_name,
      pr.rating, pr.review_title, pr.review_message, pr.review_images,
      pr.review_status, pr.is_approved, pr.show_on_website, pr.website_visibility,
      pr.admin_notes, pr.created_at, pr.approved_at,
      p.name AS product_name,
      o.order_number,
      up.first_name, up.last_name
    FROM product_reviews pr
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN orders o ON pr.order_id = o.id
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ${whereClause}
    ORDER BY pr.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  const parsedReviews = reviews.map(normalizeReview);

  const [countRow] = await query(
    `SELECT COUNT(*) AS total FROM product_reviews pr ${whereClause}`,
    params
  );

  return success(res, "Admin reviews fetched", {
    reviews: parsedReviews,
    total: Number(countRow.total),
    page: Number(page),
    limit: Number(limit),
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Approve Review
// ─────────────────────────────────────────────────────────────

const approveReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  const adminNotes = req.body.admin_notes || null;

  const [existing] = await query(
    "SELECT id, review_status FROM product_reviews WHERE id = ?",
    [reviewId]
  );
  if (!existing) throw new AppError("Review not found", 404);

  const now = nowSql();

  await query(
    `UPDATE product_reviews
     SET review_status = 'approved',
         is_approved = 1,
         admin_notes = ?,
         approved_at = ?,
         updated_at = ?
     WHERE id = ?`,
    [adminNotes, now, now, reviewId]
  );

  return success(res, "Review approved successfully", { id: Number(reviewId), is_approved: true });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Reject Review
// ─────────────────────────────────────────────────────────────

const rejectReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  const adminNotes = req.body.admin_notes || "Review rejected by admin";

  const [existing] = await query(
    "SELECT id, review_status FROM product_reviews WHERE id = ?",
    [reviewId]
  );
  if (!existing) throw new AppError("Review not found", 404);
  const now = nowSql();

  await query(
    `UPDATE product_reviews
     SET review_status = 'rejected',
         is_approved = 0,
         show_on_website = 0,
         website_visibility = 'hidden',
         admin_notes = ?,
         updated_at = ?
     WHERE id = ?`,
    [adminNotes, now, reviewId]
  );

  return success(res, "Review rejected successfully", {
    id: Number(reviewId),
    is_approved: false,
    show_on_website: false,
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Delete Review
// ─────────────────────────────────────────────────────────────

const deleteReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;

  const [existing] = await query(
    "SELECT id FROM product_reviews WHERE id = ?",
    [reviewId]
  );
  if (!existing) throw new AppError("Review not found", 404);

  await query("DELETE FROM product_reviews WHERE id = ?", [reviewId]);

  return success(res, "Review deleted successfully");
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Get Live Review Counts
// ─────────────────────────────────────────────────────────────

const getReviewCounts = asyncHandler(async (req, res) => {
  const [counts] = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN review_status = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END) AS approved,
       SUM(CASE WHEN review_status = 'rejected' THEN 1 ELSE 0 END) AS rejected
     FROM product_reviews`
  );

  return success(res, "Review counts fetched", {
    total: Number(counts.total),
    pending: Number(counts.pending),
    approved: Number(counts.approved),
    rejected: Number(counts.rejected),
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Toggle Website Visibility
// ─────────────────────────────────────────────────────────────

const toggleReviewVisibility = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  const { visibility } = req.body;

  if (!visibility || !["visible", "hidden"].includes(visibility)) {
    throw new AppError("Visibility must be 'visible' or 'hidden'", 400);
  }

  const [existing] = await query(
    "SELECT id, review_status, website_visibility FROM product_reviews WHERE id = ?",
    [reviewId]
  );
  if (!existing) throw new AppError("Review not found", 404);

  await query(
    `UPDATE product_reviews SET website_visibility = ?, show_on_website = ?, updated_at = ? WHERE id = ?`,
    [visibility, visibility === "visible" ? 1 : 0, nowSql(), reviewId]
  );

  return success(res, `Review is now ${visibility} on website`);
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Show/Hide Review on Website
// ─────────────────────────────────────────────────────────────

const showReviewOnWebsite = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  console.log("[REVIEWS] PUT show review on website", { route: req.originalUrl, reviewId });

  const [existing] = await query(
    "SELECT id, is_approved, review_status FROM product_reviews WHERE id = ?",
    [reviewId]
  );
  if (!existing) throw new AppError("Review not found", 404);
  if (!existing.is_approved && existing.review_status !== "approved") {
    throw new AppError("Only approved reviews can be shown on the website", 400);
  }

  await query(
    `UPDATE product_reviews
     SET show_on_website = 1, website_visibility = 'visible', updated_at = ?
     WHERE id = ?`,
    [nowSql(), reviewId]
  );

  return success(res, "Review is now visible on website", {
    id: Number(reviewId),
    show_on_website: true,
  });
});

const hideReviewFromWebsite = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  console.log("[REVIEWS] PUT hide review from website", { route: req.originalUrl, reviewId });

  const [existing] = await query("SELECT id FROM product_reviews WHERE id = ?", [reviewId]);
  if (!existing) throw new AppError("Review not found", 404);

  await query(
    `UPDATE product_reviews
     SET show_on_website = 0, website_visibility = 'hidden', updated_at = ?
     WHERE id = ?`,
    [nowSql(), reviewId]
  );

  return success(res, "Review hidden from website", {
    id: Number(reviewId),
    show_on_website: false,
  });
});

module.exports = {
  createReview,
  getProductReviews,
  getPublicReviews,
  getUserReviewForOrder,
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  deleteReview,
  getReviewCounts,
  toggleReviewVisibility,
  showReviewOnWebsite,
  hideReviewFromWebsite,
};
