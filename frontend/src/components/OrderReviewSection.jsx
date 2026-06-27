import { useState } from "react";
import { reviewService } from "../services/api";

export default function OrderReviewSection({ order, onReviewSubmit }) {
  const [openProductId, setOpenProductId] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    review_title: "",
    review_message: "",
    review_images: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [reviewStatus, setReviewStatus] = useState({});

  if (!order || order.status !== "delivered") return null;

  const eligibleItems = (order.items || []).filter((item) => {
    if (!item.product_id) return false;
    const hasReview = reviewStatus[item.product_id];
    return !hasReview || hasReview.status !== "pending";
  });

  const toggleForm = async (productId) => {
    const next = openProductId === productId ? null : productId;

    if (next) {
      try {
        const res = await reviewService.getUserReviewForOrder(order.id, productId);
        const existing = res.data?.review;
        setReviewStatus((prev) => ({
          ...prev,
          [productId]: existing || { status: "none" },
        }));
        if (existing) {
          setReviewForm({
            rating: existing.rating || 0,
            review_title: existing.review_title || "",
            review_message: existing.review_message || "",
            review_images: existing.review_images || [],
          });
        } else {
          setReviewForm({ rating: 0, review_title: "", review_message: "", review_images: [] });
          setImagePreview("");
          setImageFile(null);
        }
      } catch (err) {
        setReviewStatus((prev) => ({ ...prev, [productId]: { status: "none" } }));
        setReviewForm({ rating: 0, review_title: "", review_message: "", review_images: [] });
        setImagePreview("");
        setImageFile(null);
      }
    }

    setOpenProductId(next);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e, productId) => {
    e.preventDefault();
    if (!reviewForm.rating) return alert("Please select a rating.");

    setSubmitting(true);
    setSubmitted(false);
    try {
      const payload = {
        order_id: order.id,
        product_id: productId,
        rating: reviewForm.rating,
        review_title: reviewForm.review_title || "",
        review_message: reviewForm.review_message || "",
      };

      if (imageFile) {
        payload.review_images = [imagePreview];
      }

      await reviewService.createReview(payload);
      setSubmitted(true);
      setReviewStatus((prev) => ({
        ...prev,
        [productId]: { status: "pending" },
      }));
      setTimeout(() => {
        setOpenProductId(null);
        setSubmitted(false);
      }, 1200);
      setReviewForm({ rating: 0, review_title: "", review_message: "", review_images: [] });
      setImagePreview("");
      setImageFile(null);
      if (onReviewSubmit) onReviewSubmit();
    } catch (err) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (productId) => {
    const status = reviewStatus[productId];
    if (!status || status.status === "none") {
      return (
        <button
          onClick={() => toggleForm(productId)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md text-xs font-semibold hover:bg-cyan-500/20 transition"
        >
          ⭐ Write Review
        </button>
      );
    }
    if (status.status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md text-xs font-semibold">
          ⏳ Review Pending Approval
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-semibold">
        ✅ Review Published
      </span>
    );
  };

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Product Reviews</h3>
      {eligibleItems.map((item) => (
        <div key={item.product_id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{item.product_name || `Product #${item.product_id}`}</p>
              <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
            </div>
            {renderStatusBadge(item.product_id)}
          </div>

          {openProductId === item.product_id && (!reviewStatus[item.product_id] || reviewStatus[item.product_id]?.status === "none") && (
            <form onSubmit={(e) => handleSubmit(e, item.product_id)} className="mt-4 space-y-3 border-t border-gray-800 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rating *</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}>
                      <span className={`text-xl ${star <= reviewForm.rating ? "text-amber-400" : "text-gray-600"}`}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Review Title</label>
                <input
                  type="text"
                  value={reviewForm.review_title}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, review_title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-500 outline-none"
                  placeholder="Summarize your experience"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Review Message</label>
                <textarea
                  value={reviewForm.review_message}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, review_message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:border-cyan-500 outline-none"
                  placeholder="What did you like or dislike?"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Product Images (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
                />
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-gray-700" />
                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpenProductId(null)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reviewForm.rating || submitted}
                  className="motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] inline-flex items-center justify-center gap-2 rounded-[12px] bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitted ? (
                    <>
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-current">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                      <span>Review Submitted Successfully</span>
                    </>
                  ) : submitting ? (
                    <>
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-[2px] border-current border-t-transparent" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Star size={14} className="fill-white/90" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}