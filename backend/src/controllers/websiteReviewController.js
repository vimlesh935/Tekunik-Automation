const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { success } = require("../utils/response");

// ─────────────────────────────────────────────────────────────
// CUSTOMER: Submit Website Review
// ─────────────────────────────────────────────────────────────

const createWebsiteReview = asyncHandler(async (req, res) => {
  const { rating, review_title, review_message } = req.body;
  const user_id = req.user.id;

  if (!rating) {
    throw new AppError("Rating is required", 400);
  }
  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  // Verify user has at least one delivered order
  const [deliveredOrders] = await query(
    "SELECT id FROM orders WHERE user_id = ? AND status = 'delivered' LIMIT 1",
    [user_id]
  );
  if (!deliveredOrders) {
    throw new AppError("You must have at least one delivered order to submit a review", 400);
  }

  // Prevent duplicate review from same user
  const [existing] = await query(
    "SELECT id FROM website_reviews WHERE user_id = ?",
    [user_id]
  );
  if (existing) {
    throw new AppError("You have already submitted a website review", 400);
  }

  // Get customer name
  const [profile] = await query(
    "SELECT first_name, last_name FROM user_profiles WHERE user_id = ?",
    [user_id]
  );
  const customerName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : null;

  const result = await query(
    `INSERT INTO website_reviews
      (user_id, customer_name, rating, review_title, review_message, review_status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [user_id, customerName, rating, review_title || null, review_message || null]
  );

  return success(res, "Website review submitted successfully. Awaiting admin approval.", {
    review: {
      id: result.insertId,
      rating,
      review_title: review_title || null,
      review_message: review_message || null,
      customer_name: customerName,
      review_status: "pending",
    },
  });
});

// ─────────────────────────────────────────────────────────────
// CUSTOMER: Get My Website Review
// ─────────────────────────────────────────────────────────────

const getMyWebsiteReview = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const [review] = await query(
    `SELECT id, user_id, customer_name, rating, review_title, review_message,
            review_status, created_at, approved_at
     FROM website_reviews
     WHERE user_id = ?`,
    [user_id]
  );

  if (!review) {
    return success(res, "No website review found", { review: null });
  }

  return success(res, "Website review fetched", { review });
});

// ─────────────────────────────────────────────────────────────
// PUBLIC: Get Approved Website Reviews
// ─────────────────────────────────────────────────────────────

const getApprovedWebsiteReviews = asyncHandler(async (req, res) => {
  const reviews = await query(
    `SELECT id, customer_name, rating, review_title, review_message,
            review_status, created_at, approved_at
     FROM website_reviews
     WHERE review_status = 'approved'
     ORDER BY created_at DESC
     LIMIT 20`
  );

  return success(res, "Website reviews fetched", { reviews });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Get All Website Reviews
// ─────────────────────────────────────────────────────────────

const getAllWebsiteReviewsAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const status = req.query.status || "";

  let whereClause = "WHERE 1=1";
  const params = [];

  if (status) {
    whereClause += " AND wr.review_status = ?";
    params.push(status);
  }

  const [reviews] = await query(
    `SELECT wr.id, wr.user_id, wr.customer_name, wr.rating, wr.review_title,
            wr.review_message, wr.review_status, wr.admin_notes, wr.created_at, wr.approved_at,
            u.email
     FROM website_reviews wr
     LEFT JOIN users u ON wr.user_id = u.id
     ${whereClause}
     ORDER BY wr.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRow] = await query(
    `SELECT COUNT(*) AS total FROM website_reviews wr ${whereClause}`,
    params
  );

  return success(res, "Admin website reviews fetched", {
    reviews,
    total: Number(countRow.total),
    page,
    limit,
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Approve Website Review
// ─────────────────────────────────────────────────────────────

const approveWebsiteReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  const adminNotes = req.body.admin_notes || null;

  const [existing] = await query(
    "SELECT id, review_status FROM website_reviews WHERE id = ?",
    [reviewId]
  );
  if (!existing) {
    throw new AppError("Website review not found", 404);
  }

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  await query(
    `UPDATE website_reviews
     SET review_status = 'approved', admin_notes = ?, approved_at = ?, updated_at = ?
     WHERE id = ?`,
    [adminNotes, now, now, reviewId]
  );

  return success(res, "Website review approved successfully");
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Reject Website Review
// ─────────────────────────────────────────────────────────────

const rejectWebsiteReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;
  const adminNotes = req.body.admin_notes || "Review rejected by admin";

  const [existing] = await query(
    "SELECT id, review_status FROM website_reviews WHERE id = ?",
    [reviewId]
  );
  if (!existing) {
    throw new AppError("Website review not found", 404);
  }
  if (existing.review_status === "approved") {
    throw new AppError("Cannot reject an already approved review", 400);
  }

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  await query(
    `UPDATE website_reviews
     SET review_status = 'rejected', admin_notes = ?, updated_at = ?
     WHERE id = ?`,
    [adminNotes, now, reviewId]
  );

  return success(res, "Website review rejected successfully");
});

// ─────────────────────────────────────────────────────────────
// ADMIN: Delete Website Review
// ─────────────────────────────────────────────────────────────

const deleteWebsiteReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;

  const [existing] = await query(
    "SELECT id FROM website_reviews WHERE id = ?",
    [reviewId]
  );
  if (!existing) {
    throw new AppError("Website review not found", 404);
  }

  await query("DELETE FROM website_reviews WHERE id = ?", [reviewId]);

  return success(res, "Website review deleted successfully");
});

module.exports = {
  createWebsiteReview,
  getMyWebsiteReview,
  getApprovedWebsiteReviews,
  getAllWebsiteReviewsAdmin,
  approveWebsiteReview,
  rejectWebsiteReview,
  deleteWebsiteReview,
};