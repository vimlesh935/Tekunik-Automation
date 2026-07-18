import React, { useState, useEffect } from "react";
import { Star, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { reviewService, userService } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

const VIOLET = "#7C3AED";
const CYAN = "#06B6D4";
const BORDER = "#1E2640";
const TEXT = "#E2E8F0";
const MUTED = "#64748B";
const BG = "#080B14";

export default function ProductReviewsModal({ productId, isOpen, onClose, onSuccess }) {
  const { isAuthenticated, user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [purchaseRequired, setPurchaseRequired] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccess(false);
    setRating(5);
    setReviewTitle("");
    setReviewMessage("");
    setEligibleOrderId(null);
    setPurchaseRequired(false);
    setCheckingEligibility(false);

    if (!isAuthenticated) return;

    const findEligibleOrder = async () => {
      setCheckingEligibility(true);
      try {
        const ordersRes = await userService.getOrders(1, 50);
        const orders = ordersRes?.data?.orders || [];
        const deliveredOrders = orders.filter((o) => o.status === "delivered");

        for (const order of deliveredOrders) {
          try {
            const orderRes = await userService.getOrder(order.id);
            const items = orderRes?.data?.order?.items || [];
            const hasProduct = items.some(
              (item) => Number(item.product_id) === Number(productId)
            );
            if (hasProduct) {
              setEligibleOrderId(order.id);
              return;
            }
          } catch {
            // skip failed order detail fetch
          }
        }
        setPurchaseRequired(true);
      } catch {
        setError("Unable to verify your purchase history. Please try again.");
      } finally {
        setCheckingEligibility(false);
      }
    };

    findEligibleOrder();
  }, [isOpen, isAuthenticated, productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating (1-5 stars)");
      return;
    }

    if (!eligibleOrderId) {
      setError("No eligible order found. Please purchase this product first.");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        order_id: eligibleOrderId,
        product_id: Number(productId),
        rating,
        review_title: reviewTitle.trim() || "",
        review_message: reviewMessage.trim() || "",
      };

      const response = await reviewService.createReview(data);

      if (response.success) {
        setSuccess(true);
        setReviewTitle("");
        setReviewMessage("");
        setRating(5);

        if (onSuccess) onSuccess();

        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("[ReviewModal] Submit error:", err);
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 11, 20, 0.9)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
    >
      <div
        style={{
          background: BG,
          border: `1px solid ${BORDER}`,
          borderRadius: "24px",
          width: "100%",
          maxWidth: "500px",
          padding: "32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: TEXT,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: 0,
            }}
          >
            <Star color="#FCD34D" size={20} fill="#FCD34D" />
            Write a Review
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px",
              color: MUTED,
              background: "transparent",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = TEXT;
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = MUTED;
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div
            style={{
              marginBottom: "16px",
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <CheckCircle color="#34D399" size={20} />
            <p
              style={{
                color: "#6EE7B7",
                fontSize: "14px",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Thank you! Your review has been submitted and is awaiting admin
              approval.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <AlertCircle color="#F87171" size={20} />
            <p
              style={{
                color: "#FCA5A5",
                fontSize: "14px",
                fontWeight: 500,
                margin: 0,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Not Authenticated */}
        {!isAuthenticated && (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              Please log in to submit a product review. Reviews can only be
              submitted after purchasing and receiving the product.
            </p>
            <a
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Log In to Review
            </a>
          </div>
        )}

        {/* Checking Eligibility */}
        {isAuthenticated && checkingEligibility && (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
            }}
          >
            <Loader2
              size={24}
              style={{ animation: "spin 0.8s linear infinite", color: VIOLET }}
            />
            <p
              style={{
                color: MUTED,
                fontSize: "14px",
                marginTop: "12px",
              }}
            >
              Checking your purchase history...
            </p>
          </div>
        )}

        {/* Purchase Required */}
        {isAuthenticated && purchaseRequired && !checkingEligibility && (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: MUTED,
                fontSize: "14px",
                marginBottom: "8px",
              }}
            >
              You can only review products you have purchased and received.
            </p>
            <p
              style={{
                color: "#6B7280",
                fontSize: "13px",
              }}
            >
              Purchase this product and once your order is delivered, you will
              be able to submit a review.
            </p>
          </div>
        )}

        {/* Review Form - Only for authenticated users with eligible order */}
        {isAuthenticated && !checkingEligibility && !purchaseRequired && (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Rating Selection */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: MUTED,
                  marginBottom: "8px",
                }}
              >
                Rating <span style={{ color: "#F87171" }}>*</span>
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      padding: "4px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting)
                        e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                    }}
                    disabled={submitting}
                  >
                    <Star
                      size={24}
                      color={
                        star <= (hoverRating || rating) ? "#FCD34D" : "#475569"
                      }
                      fill={
                        star <= (hoverRating || rating) ? "#FCD34D" : "none"
                      }
                    />
                  </button>
                ))}
                <span
                  style={{
                    marginLeft: "8px",
                    fontSize: "14px",
                    color: TEXT,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {rating} / 5
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: MUTED,
                  marginBottom: "8px",
                }}
              >
                Review Title (Optional)
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Great product!"
                disabled={submitting}
                maxLength={100}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  color: TEXT,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = VIOLET;
                  e.currentTarget.style.boxShadow = `0 0 16px rgba(124,58,237,0.15)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Review Message */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: MUTED,
                  marginBottom: "8px",
                }}
              >
                Review Message
              </label>
              <textarea
                value={reviewMessage}
                onChange={(e) => setReviewMessage(e.target.value)}
                placeholder="Share your experience with this product..."
                disabled={submitting}
                rows={4}
                maxLength={1000}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  color: TEXT,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  resize: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = VIOLET;
                  e.currentTarget.style.boxShadow = `0 0 16px rgba(124,58,237,0.15)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: MUTED,
                  marginTop: "4px",
                  textAlign: "right",
                  margin: 0,
                }}
              >
                {reviewMessage.length} / 1000
              </p>
            </div>

            {/* Submit Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                paddingTop: "8px",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  color: MUTED,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.color = TEXT;
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.color = MUTED;
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.02)";
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: submitting
                    ? `linear-gradient(135deg, ${VIOLET}, ${CYAN})`
                    : `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  letterSpacing: "0.04em",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = `linear-gradient(135deg, #6D28D9, #0891B2)`;
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 8px 32px rgba(124,58,237,0.4)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${VIOLET}, ${CYAN})`;
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star size={16} color="#FCD34D" fill="#FCD34D" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
      `}</style>
    </div>
  );
}
