import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, Clock, Eye, Star, Trash2, XCircle } from "lucide-react";
import apiCall, { reviewService } from "../../services/api.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import ConfirmDeleteModal from "../../components/admin/ConfirmDeleteModal.jsx";
import Toast from "../../admin/components/common/Toast.jsx";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("");
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewCounts, setReviewCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [reviewActionMessage, setReviewActionMessage] = useState("");
  const [reviewActionType, setReviewActionType] = useState("success");
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [deleteReviewTarget, setDeleteReviewTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, countsRes] = await Promise.all([
        apiCall(`/api/admin/reviews?page=${page}&limit=20${reviewFilter ? `&status=${reviewFilter}` : ""}`),
        apiCall("/api/admin/reviews/counts").catch(() => null),
      ]);
      const payload = listRes.data;
      setReviews(payload?.reviews || []);
      setReviewTotal(payload?.total || 0);
      setTotalPages(payload?.totalPages || 1);
      if (countsRes?.data) setReviewCounts(countsRes.data);
    } catch (err) {
      showToast(err.message || "Failed to load reviews", "error");
    } finally {
      setLoading(false);
    }
  }, [page, reviewFilter, showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const setActionResult = (message, type = "success") => {
    setReviewActionMessage(message);
    setReviewActionType(type);
  };

  const approveReview = async (review) => {
    try {
      await reviewService.approveReview(review.id, "Approved by admin");
      setActionResult("Review approved successfully. Use Show on Website to publish it.");
      fetchReviews();
    } catch (err) {
      setActionResult(err.message || "Failed to approve review", "error");
    }
  };

  const rejectReview = async (review, message = "Review rejected. It will remain hidden from the website.") => {
    try {
      await reviewService.rejectReview(review.id, "Rejected by admin");
      setActionResult(message);
      fetchReviews();
    } catch (err) {
      setActionResult(err.message || "Failed to reject review", "error");
    }
  };

  const toggleWebsiteVisibility = async (review) => {
    try {
      const isShown = review.show_on_website === true || review.show_on_website === 1 || review.website_visibility === "visible";
      if (isShown) await reviewService.hideReviewFromWebsite(review.id);
      else await reviewService.showReviewOnWebsite(review.id);
      setActionResult(isShown ? "Review hidden from website." : "Review is now visible on website.");
      fetchReviews();
    } catch (err) {
      setActionResult(err.message || "Failed to update visibility", "error");
    }
  };

  const deleteReview = async () => {
    if (!deleteReviewTarget) return;
    try {
      await apiCall(`/api/admin/reviews/${deleteReviewTarget.id}`, { method: "DELETE" });
      setActionResult("Review permanently deleted from the system and website.");
      setShowDeleteReviewModal(false);
      setDeleteReviewTarget(null);
      fetchReviews();
    } catch (err) {
      setActionResult(err.message || "Failed to delete review", "error");
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      {reviewActionMessage && (
        <div className="p-4 rounded-xl border text-sm font-semibold animate-fade-in" style={{ backgroundColor: reviewActionType === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderColor: reviewActionType === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: reviewActionType === "success" ? "#34d399" : "#f87171" }}>
          {reviewActionMessage}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5"><p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Pending</p><p className="text-3xl font-black text-amber-300 mt-2 font-mono">{reviewCounts.pending || reviews.filter((r) => r.review_status === "pending").length || "-"}</p></div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5"><p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Approved</p><p className="text-3xl font-black text-emerald-300 mt-2 font-mono">{reviewCounts.approved || reviews.filter((r) => r.review_status === "approved").length || "-"}</p></div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5"><p className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Rejected</p><p className="text-3xl font-black text-red-300 mt-2 font-mono">{reviewCounts.rejected || reviews.filter((r) => r.review_status === "rejected").length || "-"}</p></div>
        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-5"><p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">Total</p><p className="text-3xl font-black text-cyan-300 mt-2 font-mono">{reviewTotal || reviewCounts.total || "-"}</p></div>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-800">
          {[
            { key: "", label: "All Reviews", icon: Star, count: reviewCounts.total },
            { key: "pending", label: "Pending", icon: Clock, count: reviewCounts.pending },
            { key: "approved", label: "Approved", icon: CheckCircle, count: reviewCounts.approved },
            { key: "rejected", label: "Rejected", icon: XCircle, count: reviewCounts.rejected },
          ].map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => { setPage(1); setReviewFilter(key); setReviewActionMessage(""); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${reviewFilter === key ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:text-white bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800"}`}>
              <Icon size={14} /> {label}<span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-black/30">{count ?? "-"}</span>
            </button>
          ))}
        </div>

        {loading ? <AdminLoading /> : (
          <div className="divide-y divide-gray-800/50">
            {reviews.map((r) => {
              const isShown = r.show_on_website === true || r.show_on_website === 1 || r.website_visibility === "visible";
              return (
                <div key={r.id} className="p-5 hover:bg-white/[0.02] transition">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-amber-400 tracking-tight">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}<span className="ml-1.5 text-gray-500 font-mono text-[10px]">{r.rating}/5</span></span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${r.review_status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : r.review_status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{r.review_status}</span>
                      </div>
                      {r.review_title && <h3 className="text-sm font-bold text-white mt-2">{r.review_title}</h3>}
                      {r.review_message && <p className="text-xs text-gray-400 mt-1.5 line-clamp-3 leading-relaxed">{r.review_message}</p>}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10px] text-gray-600">
                        <span className="font-mono">Order #{r.order_number || "N/A"}</span>
                        <span>Submitted: {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-full lg:w-56 space-y-2">
                      <div className="bg-black/30 border border-gray-800/60 rounded-xl p-3"><p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold">Customer</p><p className="text-xs font-bold text-white mt-1 truncate">{r.customer_name || "N/A"}</p>{r.customer_email && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{r.customer_email}</p>}</div>
                      <div className="bg-black/30 border border-gray-800/60 rounded-xl p-3"><p className="text-[9px] uppercase tracking-widest text-gray-600 font-bold">Product</p><p className="text-xs font-semibold text-cyan-300 mt-1 truncate">{r.product_name || `Product #${r.product_id}`}</p><p className="text-[10px] text-gray-600 mt-0.5">ID: {r.product_id}</p></div>
                    </div>
                    <div className="flex-shrink-0 flex flex-row lg:flex-col items-center gap-2">
                      {r.review_status === "pending" && <><button onClick={() => approveReview(r)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold"><CheckCircle size={14} /> Approve</button><button onClick={() => rejectReview(r)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold"><XCircle size={14} /> Reject</button></>}
                      {r.review_status === "approved" && <><button onClick={() => toggleWebsiteVisibility(r)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold"><Eye size={14} /> {isShown ? "Hide from Website" : "Show on Website"}</button><button onClick={() => rejectReview(r, "Review rejected and hidden from website.")} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold"><XCircle size={14} /> Reject</button></>}
                      {r.review_status === "rejected" && <button onClick={() => approveReview(r)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold"><CheckCircle size={14} /> Approve</button>}
                      <button onClick={() => { setDeleteReviewTarget(r); setShowDeleteReviewModal(true); }} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-gray-700/50 hover:border-red-500/30 rounded-xl text-xs font-bold"><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {reviews.length === 0 && <div className="p-16 text-center"><div className="w-16 h-16 mx-auto rounded-full bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-4"><Star size={24} className="text-gray-600" /></div><p className="text-gray-500 text-sm font-medium">No {reviewFilter ? `${reviewFilter} ` : ""}reviews found.</p></div>}
          </div>
        )}
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} label={`Page ${page} of ${totalPages} · ${reviewTotal} total reviews`} />
      </div>

      <ConfirmDeleteModal
        show={showDeleteReviewModal && !!deleteReviewTarget}
        title="Delete Review"
        message="Are you sure you want to delete this review?"
        details={deleteReviewTarget && <div className="space-y-2"><div className="flex items-center gap-2 text-xs"><span className="text-amber-400">{"★".repeat(deleteReviewTarget.rating)}{"☆".repeat(5 - deleteReviewTarget.rating)}</span></div>{deleteReviewTarget.review_title && <p className="text-sm font-bold text-white">{deleteReviewTarget.review_title}</p>}<p className="text-xs text-gray-500">{deleteReviewTarget.customer_name || "N/A"} · {deleteReviewTarget.product_name || `Product #${deleteReviewTarget.product_id}`}</p><p className="text-[10px] text-gray-600">This action cannot be undone.</p></div>}
        onCancel={() => { setShowDeleteReviewModal(false); setDeleteReviewTarget(null); }}
        onConfirm={deleteReview}
      />
    </div>
  );
}
