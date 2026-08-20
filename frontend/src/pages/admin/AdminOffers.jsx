import React, { useCallback, useEffect, useState } from "react";
import { Edit2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";
import apiCall, { categoryService } from "../../services/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPageToolbar from "../../components/admin/AdminPageToolbar.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import Toast from "../../admin/components/common/Toast.jsx";
import DiscountModal from "../../admin/components/discounts/DiscountModal.jsx";

const emptyOffer = {
  name: "",
  title: "",
  description: "",
  type: "percentage",
  value: "",
  apply_to: "all",
  product_ids: [],
  category_ids: [],
  min_order_value: "",
  maximum_discount: "",
  banner_image: "",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

export default function AdminOffers() {
  const [discounts, setDiscounts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allProductsForDiscount, setAllProductsForDiscount] = useState([]);
  const [categories, setCategories] = useState([]);
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

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const [discountRes, productRes, categoryRes] = await Promise.all([
        apiCall(`/api/admin/discounts?page=${page}`),
        apiCall("/api/admin/products?limit=1000").catch(() => null),
        categoryService.getAdminCategories().catch(() => null),
      ]);
      const payload = discountRes.data;
      setDiscounts(payload?.discounts || []);
      setTotalPages(payload?.pagination?.pages || 1);
      if (productRes?.data?.products) setAllProductsForDiscount(productRes.data.products);
      if (categoryRes?.data?.categories) setCategories(categoryRes.data.categories);
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
      product_ids: discount.product_ids || [],
      category_ids: discount.category_ids || [],
      starts_at: discount.starts_at ? new Date(discount.starts_at).toISOString().slice(0, 16) : "",
      expires_at: discount.expires_at ? new Date(discount.expires_at).toISOString().slice(0, 16) : "",
    });
    setDiscountError("");
    setShowDiscountModal(true);
  };

  const saveDiscount = async () => {
    if (!discountForm.name.trim()) {
      setDiscountError("Offer name is required");
      return;
    }
    if (!discountForm.value) {
      setDiscountError("Offer value is required");
      return;
    }
    setDiscountSaving(true);
    setDiscountError("");
    try {
      const body = {
        ...discountForm,
        value: parseFloat(discountForm.value) || 0,
        min_order_value: discountForm.min_order_value ? parseFloat(discountForm.min_order_value) : null,
        maximum_discount: discountForm.maximum_discount ? parseFloat(discountForm.maximum_discount) : null,
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

  const offerScope = (discount) => {
    if (discount.apply_to === "all") return "Storewide";
    if (discount.apply_to === "selected_products") return `${discount.product_ids?.length || 0} Products`;
    return `${discount.category_ids?.length || 0} Categories`;
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <AdminPageToolbar title="Offers & Promotions" description="Manage percentage and fixed amount offers for products and categories." actions={[{ label: "Add Offer", onClick: openAddDiscount }]} />
      {loading ? <AdminLoading /> : (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400"><th className="p-4 font-semibold">Offer / Promotion</th><th className="p-4 font-semibold">Type</th><th className="p-4 font-semibold text-right">Value</th><th className="p-4 font-semibold">Applies To</th><th className="p-4 font-semibold text-center">Expires</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-800/20 transition">
                  <td className="p-4"><div className="flex items-center gap-2">{d.banner_image && <img src={getImageUrl(d.banner_image)} alt="Banner" className="w-10 h-6 object-cover rounded" />}<div><div className="font-semibold text-sm text-white">{d.name}</div>{d.title && <div className="text-xs text-gray-400 mt-0.5">{d.title}</div>}</div></div></td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${d.type === "percentage" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}>{d.type === "percentage" ? "% OFF" : d.type === "fixed" ? "₹ OFF" : String(d.type || "offer").toUpperCase()}</span></td>
                  <td className="p-4 text-sm font-mono text-emerald-400 text-right">{d.type === "percentage" ? `${d.value}%` : formatCurrency(d.value)}{d.maximum_discount && <div className="text-[10px] text-gray-500">Max: {formatCurrency(d.maximum_discount)}</div>}</td>
                  <td className="p-4 text-sm text-gray-300">{offerScope(d)}</td>
                  <td className="p-4 text-center text-xs text-gray-500">{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "Never"}</td>
                  <td className="p-4 text-center"><button onClick={() => toggleDiscountStatus(d.id)} className={`p-1.5 rounded-md transition ${d.is_active ? "text-emerald-400 hover:bg-emerald-400/10" : "text-gray-500 hover:bg-gray-700"}`} title={d.is_active ? "Deactivate" : "Activate"}>{d.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</button></td>
                  <td className="p-4"><div className="flex justify-center gap-2"><button onClick={() => openEditDiscount(d)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition" title="Edit"><Edit2 size={16} /></button><button onClick={() => deleteDiscount(d.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition" title="Delete"><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
              {discounts.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No offers found.</td></tr>}
            </tbody>
          </table>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
      <DiscountModal show={showDiscountModal} editingDiscount={editingDiscount} discountForm={discountForm} discountError={discountError} discountSaving={discountSaving} products={allProductsForDiscount} categories={categories} onFieldChange={handleDiscountFieldChange} onClose={() => setShowDiscountModal(false)} onSave={saveDiscount} onImageUpload={uploadBannerImage} />
    </div>
  );
}
