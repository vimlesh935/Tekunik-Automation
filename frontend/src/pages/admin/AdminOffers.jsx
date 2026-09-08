import React, { useCallback, useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";
import apiCall from "../../services/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPageToolbar from "../../components/admin/AdminPageToolbar.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import AdminCoupons from "../../components/admin/AdminCoupons.jsx";
import Toast from "../../admin/components/common/Toast.jsx";
import DiscountModal from "../../admin/components/discounts/DiscountModal.jsx";

const emptyOffer = {
  name: "",
  title: "",
  description: "",
  type: "percentage",
  value: "",
  banner_image: "",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

const getOfferStatus = (d) => {
  if (!d.is_active) return { label: "⚪ Disabled", cls: "bg-gray-500/15 text-gray-400 border border-gray-500/20" };
  if (d.starts_at && new Date(d.starts_at).getTime() > Date.now()) return { label: "🟡 Scheduled", cls: "bg-amber-500/15 text-amber-400 border border-amber-500/20" };
  if (d.expires_at && new Date(d.expires_at).getTime() < Date.now()) return { label: "🔴 Expired", cls: "bg-red-500/15 text-red-400 border border-red-500/20" };
  return { label: "🟢 Active", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" };
};

export default function AdminOffers() {
  const [discounts, setDiscounts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState(emptyOffer);
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ─── Section switcher ─────────────────────────────────────────────────
  const [adminTab, setAdminTab] = useState("offers");

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const discountRes = await apiCall(`/api/admin/discounts?page=${page}`);
      const payload = discountRes.data;
      setDiscounts(payload?.discounts || []);
      setTotalPages(payload?.pagination?.pages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load offers", "error");
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleDiscountFieldChange = useCallback((field, value) => {
    setDiscountForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const openAddDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm(emptyOffer);
    setDiscountError("");
    setShowDiscountModal(true);
  };

  const openEditDiscount = (discount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      ...discount,
      name: discount.name || "",
      title: discount.title || discount.name || "",
      starts_at: discount.starts_at ? new Date(discount.starts_at).toISOString().slice(0, 16) : "",
      expires_at: discount.expires_at ? new Date(discount.expires_at).toISOString().slice(0, 16) : "",
    });
    setDiscountError("");
    setShowDiscountModal(true);
  };

  const saveDiscount = async () => {
    if (!discountForm.title.trim()) {
      setDiscountError("Offer title is required");
      return;
    }
    if (!discountForm.value) {
      setDiscountError("Offer discount value is required");
      return;
    }
    setDiscountSaving(true);
    setDiscountError("");
    try {
      const body = {
        ...discountForm,
        name: discountForm.name || discountForm.title.trim(),
        title: discountForm.title.trim(),
        value: parseFloat(discountForm.value) || 0,
        starts_at: discountForm.starts_at ? new Date(discountForm.starts_at).toISOString().replace("T", " ") : null,
        expires_at: discountForm.expires_at ? new Date(discountForm.expires_at).toISOString().replace("T", " ") : null,
      };
      if (editingDiscount) await apiCall(`/api/admin/discounts/${editingDiscount.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await apiCall("/api/admin/discounts", { method: "POST", body: JSON.stringify(body) });
      setShowDiscountModal(false);
      showToast(editingDiscount ? "Offer updated successfully." : "Offer created successfully.");
      fetchOffers();
    } catch (err) {
      setDiscountError(err.message || "Failed to save offer");
    } finally {
      setDiscountSaving(false);
    }
  };

  const deleteDiscount = async (id) => {
    if (!window.confirm("Delete this offer?")) return;
    try {
      await apiCall(`/api/admin/discounts/${id}`, { method: "DELETE" });
      showToast("Offer deleted successfully.");
      fetchOffers();
    } catch (err) {
      showToast(err.message || "Failed to delete offer", "error");
    }
  };

  const toggleDiscountStatus = async (id) => {
    try {
      await apiCall(`/api/admin/discounts/${id}/toggle`, { method: "PATCH" });
      showToast("Offer status updated.");
      fetchOffers();
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  const uploadBannerImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("image", file);
      const json = await apiCall("/api/admin/upload", { method: "POST", body: fd });
      if (json.success) {
        setDiscountForm((prev) => ({ ...prev, banner_image: json.data.url }));
        showToast("Banner uploaded successfully.");
      } else {
        showToast(json.message || "Upload failed", "error");
      }
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    }
    event.target.value = "";
  };

  const getFormattedDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAdminTab("offers")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            adminTab === "offers"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/10"
              : "bg-gray-900 text-slate-400 border border-gray-800 hover:text-cyan-400"
          }`}
        >
          Offers
        </button>
        <button
          onClick={() => setAdminTab("coupons")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            adminTab === "coupons"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/10"
              : "bg-gray-900 text-slate-400 border border-gray-800 hover:text-cyan-400"
          }`}
        >
          Coupons
        </button>
      </div>
      <AdminPageToolbar
        title={adminTab === "offers" ? "Offers & Promotions" : "Coupons"}
        description={
          adminTab === "offers"
            ? "Create promotional banners with a title, discount, description and image."
            : "Redeemable codes that unlock one offer each. Codes are generated securely server-side."
        }
        actions={
          adminTab === "offers" ? [{ label: "Add Offer", onClick: openAddDiscount }] : []
        }
      />
      {adminTab === "offers" && (loading ? <AdminLoading /> : (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400"><th className="p-4 font-semibold">Offer</th><th className="p-4 font-semibold">Discount</th><th className="p-4 font-semibold">Start Date</th><th className="p-4 font-semibold">End Date</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-800/20 transition">
                  <td className="p-4"><div className="flex items-center gap-3">{d.banner_image ? <img src={getImageUrl(d.banner_image)} alt="Banner" className="w-16 h-10 object-cover rounded" /> : <div className="w-16 h-10 rounded bg-gray-800 flex items-center justify-center text-[10px] text-gray-500">No image</div>}<div className="font-semibold text-sm text-white">{d.title || d.name}</div></div></td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${d.type === "percentage" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}>{d.type === "percentage" ? `${d.value}% OFF` : `${formatCurrency(d.value)} OFF`}</span></td>
                  <td className="p-4 text-sm text-gray-300">{getFormattedDate(d.starts_at)}</td>
                  <td className="p-4 text-sm text-gray-300">{getFormattedDate(d.expires_at)}</td>
                  <td className="p-4"><div className="flex flex-col items-center gap-2"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${getOfferStatus(d).cls}`}>{getOfferStatus(d).label}</span><button onClick={() => toggleDiscountStatus(d.id)} className={`px-3 py-1 text-[11px] font-bold rounded-md border transition ${d.is_active ? "text-red-400 border-red-500/30 hover:bg-red-400/10" : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-400/10"}`}>{d.is_active ? "Disable" : "Enable"}</button></div></td>
                  <td className="p-4"><div className="flex justify-center gap-2"><button onClick={() => openEditDiscount(d)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition" title="Edit"><Edit2 size={16} /></button><button onClick={() => deleteDiscount(d.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition" title="Delete"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
              {discounts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">No offers found.</td></tr>}
            </tbody>
          </table>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ))}
      {adminTab === "coupons" && (
        <AdminCoupons discounts={discounts} showToast={showToast} />
      )}
      <DiscountModal show={showDiscountModal} editingDiscount={editingDiscount} discountForm={discountForm} discountError={discountError} discountSaving={discountSaving} onFieldChange={handleDiscountFieldChange} onClose={() => setShowDiscountModal(false)} onSave={saveDiscount} onImageUpload={uploadBannerImage} />
    </div>
  );
}
