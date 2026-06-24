const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");

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
      (order_id, product_id, user_id, customer_name, rating, review_title, review_message, review_images, review_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
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

  let whereClause = "WHERE pr.product_id = ? AND pr.review_status = 'approved'";
  const params = [productId];

  if (rating) {
    whereClause += " AND pr.rating = ?";
    params.push(Number(rating));
  }

  const reviews = await query(`
    SELECT
      pr.id, pr.product_id, pr.order_id, pr.user_id, pr.customer_name,
      pr.rating, pr.review_title, pr.review_message, pr.review_images,
      pr.review_status, pr.admin_notes, pr.created_at, pr.approved_at,
      up.first_name, up.last_name
    FROM product_reviews pr
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN user_profiles up ON u.id = up.user_id
    ${whereClause}
    ORDER BY pr.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  // Parse review_images JSON
  const parsedReviews = reviews.map((r) => ({
    ...r,
    review_images: r.review_images ? JSON.parse(r.review_images) : [],
  }));

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
    WHERE product_id = ? AND review_status = 'approved'
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
// CUSTOMER: Get User's Review for a Specific Order+Product
// ─────────────────────────────────────────────────────────────

const getUserReviewForOrder = asyncHandler(async (req, res) => {
  const { orderId, productId } = req.params;
  const user_id = req.user.id;

  const [review] = await query(
    `SELECT id, order_id, product_id, rating, review_title, review_message,
            review_images, review_status, created_at
     FROM product_reviews
     WHERE order_id = ? AND product_id = ? AND user_id = ?`,
    [orderId, productId, user_id]
  );

  const parsed = review
    ? { ...review, review_images: review.review_images ? JSON.parse(review.review_images) : [] }
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
      pr.review_status, pr.admin_notes, pr.created_at, pr.approved_at,
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

  const parsedReviews = reviews.map((r) => ({
    ...r,
    review_images: r.review_images ? JSON.parse(r.review_images) : [],
  }));

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

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  await query(
    `UPDATE product_reviews
     SET review_status = 'approved', admin_notes = ?, approved_at = ?, updated_at = ?
     WHERE id = ?`,
    [adminNotes, now, now, reviewId]
  );

  return success(res, "Review approved successfully");
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
  if (existing.review_status === "approved") {
    throw new AppError("Cannot reject an already approved review", 400);
  }

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  await query(
    `UPDATE product_reviews
     SET review_status = 'rejected', admin_notes = ?, updated_at = ?
     WHERE id = ?`,
    [adminNotes, now, reviewId]
  );

  return success(res, "Review rejected successfully");
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

module.exports = {
  createReview,
  getProductReviews,
  getUserReviewForOrder,
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  deleteReview,
};