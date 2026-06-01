import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { formatCurrency } from "../utils/currency.js";
import { adminUserService } from "../services/api";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  ShoppingCart,
  Users,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Warehouse,
  TrendingDown,
  TrendingUp,
  X,
  Upload,
  Save,
  RefreshCw,
  Percent,
  Tag,
  ToggleLeft,
  ToggleRight,
  Eye,
  Loader2,
} from "lucide-react";
import { categoryService, getApiUrl } from "../services/api";
import SafeImage from "../components/SafeImage.jsx";

const ImageUploadField = React.memo(({ target, currentUrl, previewUrl, uploading, uploadTarget, onSelectFile, onUploadFile, onClearSelection }) => (
  <div className="space-y-3">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-cyan-500/50 transition">
        {uploading && uploadTarget === target ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading && uploadTarget === target ? "Uploading..." : "Choose image"}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onSelectFile(e.target.files?.[0])} className="hidden" />
      </label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onUploadFile} disabled={!previewUrl || uploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition">
          <Upload size={14} /> Upload
        </button>
        <button type="button" onClick={onClearSelection}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition">
          Clear
        </button>
      </div>
    </div>
    {(previewUrl || currentUrl) && (
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-28 h-20 rounded-2xl overflow-hidden border border-gray-700 bg-black/30">
          <SafeImage src={previewUrl || currentUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
        <div className="text-sm text-gray-400">
          <p>{previewUrl ? "Selected preview" : "Current image"}</p>
          <p className="text-xs text-gray-500">Supported: jpg, png, webp, up to 5MB.</p>
        </div>
      </div>
    )}
  </div>
));

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-4 shadow-2xl ${toast.type === "error" ? "bg-red-500/95 text-white" : "bg-emerald-500/95 text-black"}`}>
      <p className="text-sm font-semibold">{toast.message}</p>
    </div>
  );
}

function CategoryModal({ show, editingCategory, categoryForm, categoryError, categorySaving, onChange, onClose, onSave, onSelectImage, onUploadImage, onClearImage, categoryImageFile, categoryImagePreview, uploadingImage, uploadTarget }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{editingCategory ? "Edit Category" : "Add Category"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20} /></button>
        </div>
        {categoryError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{categoryError}</div>}
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Category Name *</label>
            <input type="text" value={categoryForm.name} onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Home Automation" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
            <textarea value={categoryForm.description} onChange={(e) => onChange("description", e.target.value)}
              placeholder="Category description..." rows={3} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Category Image</label>
            <ImageUploadField target="category" currentUrl={categoryForm.image_url} previewUrl={categoryImagePreview} uploading={uploadingImage} uploadTarget={uploadTarget} onSelectFile={(file) => onSelectImage(file, "category")} onUploadFile={() => onUploadImage(categoryImageFile, "category")} onClearSelection={onClearImage} /></div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold">Cancel</button>
            <button onClick={onSave} disabled={categorySaving}
              className="flex-1 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {categorySaving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {editingCategory ? "Update" : "Create"}</>}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserProfileModal({ show, user, onClose, onToggleStatus }) {
  if (!show || !user) return null;

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric", month: "short", day: "numeric"
      });
    } catch { return dateStr; }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      confirmed: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      processing: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      out_for_delivery: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
    };
    return colors[status] || "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
        <div className="sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800 p-6 sm:p-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.first_name || "N/A"} {user?.last_name || ""}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">ID: {user?.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${user?.is_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {user?.is_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-2xl font-black text-cyan-400 font-mono">{user?.order_count || 0}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Spend</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">₹{(parseFloat(user?.total_spent || 0)).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 text-center sm:col-span-2 lg:col-span-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Order Date</p>
                  <p className="text-lg font-black text-amber-400 font-mono">{formatShortDate(user?.last_order_date)}</p>
                </div>
              </div>
              
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-6">
                <div className="space-y-5">
                   <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500"><Mail size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Email</p>
                      <p className="text-sm text-slate-200 font-bold truncate">{user?.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500"><Phone size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Contact</p>
                      <p className="text-sm text-slate-200 font-bold">{user?.phone || "N/A"}</p>
                    </div>
                  </div>
                   <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500"><Calendar size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Age Profile</p>
                      <p className="text-sm text-slate-200 font-bold">{user?.age || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
               <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
                 <div className="flex items-center gap-3 mb-6">
                  <MapPin size={20} className="text-orange-500" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Shipping Repository</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Detailed Address</p>
                      <p className="text-sm text-slate-300 font-medium leading-relaxed">{user?.address || "No records found."}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">City</p>
                      <p className="text-sm text-slate-100 font-bold">{user?.city || "N/A"}</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pincode</p>
                      <p className="text-sm text-slate-100 font-bold font-mono">{user?.pincode || "N/A"}</p>
                    </div>
                  </div>
                </div>
               </div>

               <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={18} className="text-cyan-400" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Transaction History</h3>
                  </div>
                  <span className="text-[10px] font-black px-3 py-1 bg-slate-900 text-slate-400 rounded-full border border-slate-800">{user?.orders?.length || 0} Records</span>
                </div>
                <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
                   <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0f172a] border-b border-slate-800 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                        <th className="p-6">Order ID</th>
                        <th className="p-6">Products</th>
                        <th className="p-6">Timeline</th>
                        <th className="p-6">Status</th>
                        <th className="p-6 text-right">Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(user?.orders || []).map(order => (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-6 text-xs font-mono font-black text-cyan-400 tracking-tighter">{order?.order_number}</td>
                          <td className="p-6">
                            <div className="flex flex-col gap-1">
                              {order.items?.map((item, idx) => (
                                <p key={idx} className="text-[10px] text-slate-300 font-medium truncate max-w-[150px]">{item.product_name} <span className="text-slate-500">x{item.quantity}</span></p>
                              ))}
                            </div>
                          </td>
                          <td className="p-6 text-xs text-slate-300 font-bold">{order?.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black border uppercase tracking-widest ${getStatusColor(order?.status)}`}>
                              {order?.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-6 text-right text-sm font-black text-emerald-400 font-mono">₹{parseFloat(order?.total_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {(!user?.orders || user?.orders.length === 0) && (
                        <tr><td colSpan={4} className="p-20 text-center text-xs font-bold uppercase tracking-widest text-slate-600">No transaction logs available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ show, editingProduct, productForm, productError, productSaving, categories, onFieldChange, onClose, onSave, onSelectImage, onUploadImage, onClearImage, productImageFile, productImagePreview, uploadingImage, uploadTarget }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{editingProduct ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20} /></button>
        </div>
        {productError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{productError}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300 mb-2">Product Name *</label>
            <input type="text" value={productForm.name} onChange={(e) => onFieldChange("name", e.target.value)}
              placeholder="e.g. Smart Thermostat Pro" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
            <textarea value={productForm.description} onChange={(e) => onFieldChange("description", e.target.value)}
              placeholder="Product description..." rows={3} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Price *</label>
            <input type="number" step="0.01" min="0" value={productForm.price} onChange={(e) => onFieldChange("price", e.target.value)}
              placeholder="99.99" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Stock</label>
            <input type="number" min="0" value={productForm.stock} onChange={(e) => onFieldChange("stock", e.target.value)}
              placeholder="10" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
            <select value={productForm.category_id} onChange={(e) => onFieldChange("category_id", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
              <option value="">-- Select Category --</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Brand</label>
            <input type="text" value={productForm.brand} onChange={(e) => onFieldChange("brand", e.target.value)}
              placeholder="e.g. Tekunik" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300 mb-2">Features (one per line)</label>
            <textarea value={productForm.features} onChange={(e) => onFieldChange("features", e.target.value)}
              placeholder="WiFi enabled&#10;Voice control" rows={3} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
            <select value={productForm.status} onChange={(e) => onFieldChange("status", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
              <option value="active">Active</option><option value="inactive">Inactive</option><option value="draft">Draft</option>
            </select></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Featured</label>
            <label className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer">
              <input type="checkbox" checked={productForm.featured} onChange={(e) => onFieldChange("featured", e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500" />
              <span className="text-sm text-gray-300">Show on homepage</span>
            </label></div>
          <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300 mb-2">Product Image</label>
            <ImageUploadField target="product" currentUrl={productForm.image_url} previewUrl={productImagePreview} uploading={uploadingImage} uploadTarget={uploadTarget} onSelectFile={(file) => onSelectImage(file, "product")} onUploadFile={() => onUploadImage(productImageFile, "product")} onClearSelection={onClearImage} /></div>
        </div>
        <div className="flex gap-3 pt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold">Cancel</button>
          <button onClick={onSave} disabled={productSaving}
            className="flex-1 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {productSaving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {editingProduct ? "Update" : "Create"}</>}</button>
        </div>
      </div>
    </div>
  );
}

function DiscountModal({ show, editingDiscount, discountForm, discountError, discountSaving, products, onFieldChange, onClose, onSave }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{editingDiscount ? "Edit Discount" : "Add Discount"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20} /></button>
        </div>
        {discountError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{discountError}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300 mb-2">Discount Name *</label>
            <input type="text" value={discountForm.name} onChange={(e) => onFieldChange("name", e.target.value)}
              placeholder="e.g. Summer Sale" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
            <select value={discountForm.type} onChange={(e) => onFieldChange("type", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
              <option value="bogo">Buy 1 Get 1 (BOGO)</option>
            </select></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Value *</label>
            <input type="number" step="0.01" min="0" value={discountForm.value}
              onChange={(e) => onFieldChange("value", e.target.value)}
              placeholder={discountForm.type === "percentage" ? "10" : "99.99"}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Product (optional)</label>
            <select value={discountForm.product_id} onChange={(e) => onFieldChange("product_id", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
              <option value="">All Products</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Min Order Value</label>
            <input type="number" step="0.01" min="0" value={discountForm.min_order_value}
              onChange={(e) => onFieldChange("min_order_value", e.target.value)}
              placeholder="50.00" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Active</label>
            <label className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer">
              <input type="checkbox" checked={discountForm.is_active}
                onChange={(e) => onFieldChange("is_active", e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500" />
              <span className="text-sm text-gray-300">Active</span>
            </label></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Start Date</label>
            <input type="datetime-local" value={discountForm.starts_at}
              onChange={(e) => onFieldChange("starts_at", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Expiry Date</label>
            <input type="datetime-local" value={discountForm.expires_at}
              onChange={(e) => onFieldChange("expires_at", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
        </div>
        <div className="flex gap-3 pt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold">Cancel</button>
          <button onClick={onSave} disabled={discountSaving}
            className="flex-1 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {discountSaving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> {editingDiscount ? "Update" : "Create"}</>}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel({ token, onLogout }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  const [inventoryStats, setInventoryStats] = useState(null);
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [recentInventoryUpdates, setRecentInventoryUpdates] = useState([]);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockData, setStockData] = useState({ stock_quantity: 0, action_type: "manual_adjust", notes: "" });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", image_url: "" });
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "", description: "", price: "", stock: "", category_id: "",
    image_url: "", status: "active", featured: false, brand: "", features: ""
  });
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState("");

  const [discounts, setDiscounts] = useState([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    name: "", type: "percentage", value: "", product_id: "",
    min_order_value: "", starts_at: "", expires_at: "", is_active: true
  });
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [discountPage, setDiscountPage] = useState(1);
  const [discountTotalPages, setDiscountTotalPages] = useState(1);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const [orderFilter, setOrderFilter] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProfileLoading, setUserProfileLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    const isFormData = options.body instanceof FormData;
    const requestHeaders = {
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const res = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: requestHeaders,
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    if (!res.ok) throw new Error(data.message || "API Error");
    return data || { success: true, data: null };
  }, [token]);

  // Synchronize management view with professional URL routing structure
  useEffect(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    const validTabs = ["dashboard", "products", "categories", "inventory", "discounts", "orders", "users"];
    if (validTabs.includes(lastSegment)) {
      setActiveTab(lastSegment);
    }
  }, [location.pathname]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const clearCategoryImageSelection = useCallback(() => {
    if (categoryImagePreview) URL.revokeObjectURL(categoryImagePreview);
    setCategoryImageFile(null);
    setCategoryImagePreview("");
  }, [categoryImagePreview]);

  const clearProductImageSelection = useCallback(() => {
    if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    setProductImageFile(null);
    setProductImagePreview("");
  }, [productImagePreview]);

  const handleImageSelection = useCallback((file, target) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (target === "category") {
      clearCategoryImageSelection();
      setCategoryImageFile(file);
      setCategoryImagePreview(preview);
    } else {
      clearProductImageSelection();
      setProductImageFile(file);
      setProductImagePreview(preview);
    }
  }, [clearCategoryImageSelection, clearProductImageSelection]);

  const handleImageUpload = useCallback(async (file, target) => {
    if (!file) {
      console.warn("[IMAGE UPLOAD] No file provided");
      showToast("Please choose an image first.", "error");
      return;
    }

    console.log(`[IMAGE UPLOAD] Starting upload for ${target}:`, {
      filename: file.name,
      size: file.size,
      type: file.type
    });

    setUploadingImage(true);
    setUploadTarget(target);
    
    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image is too large. Maximum size is 5MB.");
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid image format. Allowed: JPEG, PNG, WebP, GIF. Got: ${file.type}`);
      }

      const fd = new FormData();
      fd.append("image", file);

      console.log(`[IMAGE UPLOAD] Sending FormData to /api/admin/upload`);

      const res = await fetch(getApiUrl("/api/admin/upload"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      console.log(`[IMAGE UPLOAD] Response status: ${res.status}`);
      
      const data = await res.json();
      
      console.log(`[IMAGE UPLOAD] Response data:`, data);

      if (!res.ok) {
        throw new Error(data.message || `Upload failed (${res.status})`);
      }

      const url = data.data?.url || data.url;
      if (!url) {
        throw new Error("No image URL returned from server");
      }

      console.log(`[IMAGE UPLOAD] ✅ Upload successful. URL: ${url}`);

      if (target === "category") {
        setCategoryForm((prev) => ({ ...prev, image_url: url }));
        clearCategoryImageSelection();
        console.log("[IMAGE UPLOAD] ✅ Category image updated");
      } else {
        setProductForm((prev) => ({ ...prev, image_url: url }));
        clearProductImageSelection();
        console.log("[IMAGE UPLOAD] ✅ Product image updated");
      }

      showToast(`✅ ${target === 'category' ? 'Category' : 'Product'} image uploaded successfully!`, "success");
      return url;

    } catch (err) {
      console.error(`[IMAGE UPLOAD] ❌ Error:`, err);
      const errorMsg = err.message || "Image upload failed. Please try again.";
      showToast(`❌ ${errorMsg}`, "error");
      return null;
    } finally {
      setUploadingImage(false);
      setUploadTarget(null);
    }
  }, [token, clearCategoryImageSelection, clearProductImageSelection, showToast]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const res = await apiCall("/api/admin/dashboard/stats");
        const p = res.data;
        setStats(p?.stats || null);
        setRecentOrders(p?.recentOrders || []);
        setRecentUsers(p?.recentUsers || []);
      } else if (activeTab === "inventory") {
        const dr = await apiCall("/api/admin/inventory/dashboard");
        const dp = dr.data;
        setInventoryStats(dp || {});
        setRecentInventoryUpdates(dp?.recentUpdates || []);
        setInventoryAlerts(dp?.alertProducts || []);
        const lr = await apiCall(`/api/admin/inventory?page=${page}&search=${search}`);
        const lp = lr.data;
        setInventoryList(lp?.products || []);
        setTotalPages(lp?.pagination?.pages || 1);
      } else if (activeTab === "categories") {
        const res = await categoryService.getAdminCategories();
        setCategories(res.data?.categories || []);
      } else if (activeTab === "products") {
        const [res, catRes] = await Promise.all([
          apiCall(`/api/admin/products?page=${page}&search=${search}`),
          categoryService.getAdminCategories().catch(() => null),
        ]);
        const p = res.data;
        setProducts(p?.products || []);
        setTotalPages(p?.pagination?.pages || 1);
        if (catRes?.data?.categories) setCategories(catRes.data.categories);
      } else if (activeTab === "orders") {
        const params = new URLSearchParams();
        params.set("page", page);
        params.set("limit", 20);
        if (orderFilter) params.set("status", orderFilter);
        const res = await apiCall(`/api/admin/orders?${params.toString()}`);
        const p = res.data;
        setOrders(p?.orders || []);
        setTotalPages(p?.pagination?.pages || 1);
      } else if (activeTab === "users") {
        const res = await apiCall(`/api/admin/users?page=${page}&search=${search}`);
        const p = res.data;
        setUsers(p?.users || []);
        setTotalPages(p?.pagination?.pages || 1);
      } else if (activeTab === "discounts") {
        const res = await apiCall(`/api/admin/discounts?page=${discountPage}`);
        const p = res.data;
        setDiscounts(p?.discounts || []);
        setDiscountTotalPages(p?.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Admin fetchData error:", err);
    }
    setLoading(false);
  }, [apiCall, activeTab, page, search, discountPage, orderFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryFieldChange = useCallback((field, value) => {
    setCategoryForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleProductFieldChange = useCallback((field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDiscountFieldChange = useCallback((field, value) => {
    setDiscountForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "", image_url: "" });
    setCategoryImagePreview("");
    setCategoryImageFile(null);
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name || "", description: cat.description || "", image_url: cat.image_url || "" });
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) { setCategoryError("Category name is required"); return; }
    setCategorySaving(true);
    setCategoryError("");
    try {
      let imageUrl = categoryForm.image_url || "";
      if (categoryImageFile) {
        const uploadedUrl = await handleImageUpload(categoryImageFile, "category");
        if (!uploadedUrl) throw new Error("Category image upload failed");
        imageUrl = uploadedUrl;
      }
      const body = { ...categoryForm, image_url: imageUrl || null };
      if (editingCategory) await categoryService.updateCategory(editingCategory.id, body);
      else await categoryService.createCategory(body);
      setShowCategoryModal(false);
      fetchData();
    } catch (err) { setCategoryError(err.message || "Failed to save category"); }
    finally { setCategorySaving(false); }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try { await categoryService.deleteCategory(id); fetchData(); }
    catch (err) { alert(err.message); }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "", description: "", price: "", stock: "", category_id: "",
      image_url: "", status: "active", featured: false, brand: "", features: ""
    });
    setProductImagePreview("");
    setProductImageFile(null);
    setProductError("");
    setShowProductModal(true);
  };

  const openEditProduct = async (product) => {
    try {
      const res = await apiCall(`/api/admin/products/${product.id}`);
      const p = res.data?.product || product;
      setEditingProduct(p);
      setProductForm({
        name: p.name || "", description: p.description || "", price: p.price || "",
        stock: p.stock || p.stock_quantity || "", category_id: p.category_id || "",
        image_url: p.image_url || "", status: p.status || "active",
        featured: p.featured ? true : false, brand: p.brand || "", features: p.features || "",
      });
      setProductError("");
      setShowProductModal(true);
    } catch (err) { alert("Failed to load product: " + err.message); }
  };

  const saveProduct = async () => {
    // Frontend validation
    if (!productForm.name || !productForm.name.trim()) { 
      setProductError("⚠️ Product name is required"); 
      return; 
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) { 
      setProductError("⚠️ Price is required and must be greater than 0"); 
      return; 
    }
    
    setProductSaving(true);
    setProductError("");
    
    try {
      console.log("[ADMIN] Starting product save...");
      console.log("[ADMIN] Product form:", {
        name: productForm.name,
        price: productForm.price,
        stock: productForm.stock,
        image_url: productForm.image_url ? "✓ present" : "✗ missing",
        category_id: productForm.category_id,
        brand: productForm.brand,
        status: productForm.status,
      });

      let imageUrl = productForm.image_url || null;
      if (productImageFile) {
        const uploadedUrl = await handleImageUpload(productImageFile, "product");
        if (!uploadedUrl) throw new Error("Product image upload failed");
        imageUrl = uploadedUrl;
      }

      // Prepare body with proper type conversions
      const body = {
        name: productForm.name.trim(),
        description: productForm.description?.trim() || null,
        price: parseFloat(productForm.price),
        stock: Math.max(0, parseInt(productForm.stock) || 0),
        category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
        image_url: imageUrl,
        status: productForm.status || "active",
        featured: productForm.featured ? 1 : 0,
        brand: productForm.brand?.trim() || "",
        features: productForm.features?.trim() || null,
      };

      console.log("[ADMIN] Prepared body for API:", body);

      // Validate converted values
      if (isNaN(body.price) || body.price <= 0) {
        throw new Error("Price must be a valid number greater than 0");
      }

      const endpoint = editingProduct 
        ? `/api/admin/products/${editingProduct.id}` 
        : `/api/admin/products`;
      
      const method = editingProduct ? "PUT" : "POST";
      
      console.log(`[ADMIN] ${method} ${endpoint}`);

      const response = await apiCall(endpoint, { 
        method, 
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("[ADMIN] ✅ Product saved successfully:", response.data?.product?.id);
      
      showToast(
        editingProduct 
          ? "✅ Product updated successfully!" 
          : "✅ Product created successfully!", 
        "success"
      );
      
      setShowProductModal(false);
      setProductForm({
        name: "", description: "", price: "", stock: "", category_id: "",
        image_url: "", status: "active", featured: false, brand: "", features: ""
      });
      setProductImageFile(null);
      setProductImagePreview("");
      
      // Refresh product list
      setTimeout(() => fetchData(), 500);
      
    } catch (err) {
      console.error("[ADMIN] ❌ Product save error:", err);
      const errorMsg = err.message || "Failed to save product";
      setProductError(`❌ Error: ${errorMsg}`);
      showToast(errorMsg, "error");
    } finally { 
      setProductSaving(false); 
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await apiCall(`/api/admin/products/${id}`, { method: "DELETE" }); fetchData(); }
    catch (err) { alert(err.message); }
  };

  const openAddDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm({ name: "", type: "percentage", value: "", product_id: "", min_order_value: "", starts_at: "", expires_at: "", is_active: true });
    setDiscountError("");
    setShowDiscountModal(true);
  };

  const openEditDiscount = (d) => {
    setEditingDiscount(d);
    setDiscountForm({
      name: d.name || "", type: d.type || "percentage", value: d.value || "",
      product_id: d.product_id || "", min_order_value: d.min_order_value || "",
      starts_at: d.starts_at ? d.starts_at.slice(0, 16) : "",
      expires_at: d.expires_at ? d.expires_at.slice(0, 16) : "",
      is_active: d.is_active ? true : false,
    });
    setDiscountError("");
    setShowDiscountModal(true);
  };

  const saveDiscount = async () => {
    if (!discountForm.name.trim()) { setDiscountError("Discount name is required"); return; }
    if (!discountForm.value) { setDiscountError("Discount value is required"); return; }
    setDiscountSaving(true);
    setDiscountError("");
    try {
      const body = {
        ...discountForm,
        value: parseFloat(discountForm.value) || 0,
        product_id: discountForm.product_id || null,
        min_order_value: discountForm.min_order_value ? parseFloat(discountForm.min_order_value) : null,
        starts_at: discountForm.starts_at || null,
        expires_at: discountForm.expires_at || null,
      };
      if (editingDiscount) await apiCall(`/api/admin/discounts/${editingDiscount.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await apiCall("/api/admin/discounts", { method: "POST", body: JSON.stringify(body) });
      setShowDiscountModal(false);
      fetchData();
    } catch (err) { setDiscountError(err.message || "Failed to save discount"); }
    finally { setDiscountSaving(false); }
  };

  const deleteDiscount = async (id) => {
    if (!window.confirm("Delete this discount?")) return;
    try { await apiCall(`/api/admin/discounts/${id}`, { method: "DELETE" }); fetchData(); }
    catch (err) { alert(err.message); }
  };

  const toggleDiscountStatus = async (id) => {
    try { await apiCall(`/api/admin/discounts/${id}/toggle`, { method: "PATCH" }); fetchData(); }
    catch (err) { alert(err.message); }
  };

  const toggleUserStatus = async (id) => {
    if (!window.confirm("Toggle user verification status?")) return;
    try { await apiCall(`/api/admin/users/${id}/toggle`, { method: "PATCH" }); fetchData(); }
    catch (err) { alert(err.message); }
  };

  const updateStock = async () => {
    if (!selectedProduct) { alert("Please fill all fields"); return; }
    try {
      await apiCall(`/api/admin/stock/${selectedProduct.id}`, { method: "PUT", body: JSON.stringify(stockData) });
      setShowStockModal(false);
      setSelectedProduct(null);
      setStockData({ stock_quantity: 0, action_type: "manual_adjust", notes: "" });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const openStockModal = (p) => {
    setSelectedProduct(p);
    setStockData({ stock_quantity: p.stock_quantity, action_type: "manual_adjust", notes: "" });
    setShowStockModal(true);
  };

  const updateOrderStatus = async (id, status) => {
    try { await apiCall(`/api/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); fetchData(); }
    catch (err) { alert(err.message); }
  };

  const fetchOrders = async (pageNum = 1, statusFilter = "") => {
    try {
      const params = new URLSearchParams();
      params.set("page", pageNum);
      params.set("limit", 20);
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiCall(`/api/admin/orders?${params.toString()}`);
      const p = res.data;
      setOrders(p?.orders || []);
      setTotalPages(p?.pagination?.pages || 1);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const viewUserProfile = async (user) => {
    console.log("[Admin] View Profile clicked. User ID passed:", user?.id);
    setUserProfileLoading(user.id);
    const endpoint = `/api/admin/users/${user?.id}`;
    console.log("[Admin] Calling API URL:", getApiUrl(endpoint));
    try {
      const res = await apiCall(endpoint);
      console.log("[Admin] API Response received:", res);
      setSelectedUserProfile(res.data?.user || res.data);
    } catch (err) {
      console.error("[Admin] API Error in viewUserProfile:", err);
      showToast("Failed to load user profile: " + err.message, "error");
    } finally {
      setUserProfileLoading(null);
    }
  };

  const openOrderDetail = async (order) => {
    setOrderDetailLoading(order.id);
    try {
      const res = await apiCall(`/api/admin/orders/${order.id}`);
      const detail = res.data?.order;
      if (!detail) throw new Error("Order details are unavailable");
      setSelectedOrderDetail(detail);
    } catch (err) {
      showToast("Failed to load order details: " + err.message, "error");
    } finally {
      setOrderDetailLoading(null);
    }
  };

  const downloadInvoice = async (orderId) => {
    setInvoiceLoading(orderId);
    try {
      const response = await fetch(getApiUrl(`/api/admin/orders/${orderId}/invoice`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to download invoice");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${orderId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast("Invoice downloaded successfully!", "success");
    } catch (err) {
      showToast("Failed to download invoice: " + err.message, "error");
    } finally {
      setInvoiceLoading(null);
    }
  };

  const NavItem = ({ id, label, icon: Icon }) => (
    <button onClick={() => { setActiveTab(id); setPage(1); setSearch(""); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === id ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"}`}>
      <Icon size={18} /><span className="font-medium text-sm">{label}</span>
    </button>
  );

  const ImageUploadBtn = ({ target }) => {
    const url = target === "category" ? categoryForm.image_url : productForm.image_url;
    const preview = target === "category" ? categoryImagePreview : productImagePreview;

    const handleFileChange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      handleImageSelection(file, target);
      await handleImageUpload(file, target);
    };

    return (
      <div className="flex items-center gap-3">
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-cyan-500/50 transition">
          {uploadingImage && uploadTarget === target ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploadingImage && uploadTarget === target ? "Uploading..." : "Upload Image"}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
        {(preview || url) && (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-700">
            <SafeImage src={preview || url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => {
              if (target === "category") {
                setCategoryForm((prev) => ({ ...prev, image_url: "" }));
                clearCategoryImageSelection();
              } else {
                setProductForm((prev) => ({ ...prev, image_url: "" }));
                clearProductImageSelection();
              }
            }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              <X size={10} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-shell min-h-screen flex flex-col lg:flex-row bg-[#0a0a0c] text-slate-200">
      {/* Sidebar - Restored internal stable version */}
      <div className="w-full lg:w-64 bg-black border-b lg:border-b-0 lg:border-r border-gray-800 p-6 flex flex-col z-20">
        <div className="mb-8 px-2">
          <h2 className="text-xl font-bold tracking-wider text-white">TEKUNIK <span className="text-cyan-400 text-xs">PRO</span></h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Management System</p>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} activeTab={activeTab} onClick={setActiveTab} />
          <NavItem id="products" label="Products" icon={Package} activeTab={activeTab} onClick={setActiveTab} />
          <NavItem id="categories" label="Categories" icon={FolderTree} activeTab={activeTab} onClick={setActiveTab} />
          <NavItem id="inventory" label="Inventory" icon={Warehouse} activeTab={activeTab} onClick={setActiveTab} />
          <NavItem id="discounts" label="Discounts" icon={Percent} activeTab={activeTab} onClick={setActiveTab} />
          <NavItem id="orders" label="Orders" icon={ShoppingCart} activeTab={activeTab} onClick={setActiveTab} />
          <NavItem id="users" label="Users" icon={Users} activeTab={activeTab} onClick={setActiveTab} />
        </nav>
        <button onClick={onLogout}
          className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition font-semibold text-sm border border-red-500/20">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent">
        <header className="h-20 border-b border-gray-800/50 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md">
          <h1 className="text-xl font-bold capitalize text-white">{activeTab} Overview</h1>
          <div className="flex items-center gap-4">
             <Toast toast={toast} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            
      {/* Management Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
           <h2 className="text-2xl font-bold text-white tracking-tight capitalize">{activeTab}</h2>
           <p className="text-xs text-gray-500">Manage your store {activeTab} settings</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "products" && (
            <button onClick={openAddProduct} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Plus size={16} /> Add Product
            </button>
          )}
          {activeTab === "categories" && (
            <button onClick={openAddCategory} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Plus size={16} /> Add Category
            </button>
          )}
          {activeTab === "discounts" && (
            <button onClick={openAddDiscount} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Plus size={16} /> Add Discount
            </button>
          )}
          {(activeTab === "products" || activeTab === "users" || activeTab === "inventory") && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Quick filter..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500 outline-none w-full sm:w-64 transition shadow-inner" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && stats && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Revenue", value: `₹${(stats?.revenue || 0).toLocaleString()}`, clr: "text-emerald-400" },
                      { label: "Total Orders", value: stats?.totalOrders || 0, clr: "text-blue-400" },
                      { label: "Active Products", value: stats?.totalProducts || 0, clr: "text-cyan-400" },
                      { label: "Total Users", value: stats?.totalUsers || 0, clr: "text-purple-400" },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">{s.label}</p>
                        <h3 className={`text-3xl font-bold font-mono ${s.clr}`}>{s.value}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "products" && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                        <th className="p-4 font-semibold">Product</th>
                        <th className="p-4 font-semibold">Category</th>
                        <th className="p-4 font-semibold">Brand</th>
                        <th className="p-4 font-semibold text-right">Price</th>
                        <th className="p-4 font-semibold text-center">Stock</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                        <th className="p-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-800/20 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {p.image_url ? <SafeImage src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                                : <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center"><Package size={16} className="text-gray-500" /></div>}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-white truncate max-w-[200px]">{p.name}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{p.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-300">{p.category_name || "-"}</td>
                          <td className="p-4 text-sm text-gray-300">{p.brand || "-"}</td>
                          <td className="p-4 text-sm font-mono text-cyan-400 text-right">₹{parseFloat(p.price).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${p.stock_quantity > 10 ? 'bg-emerald-500/10 text-emerald-400' : p.stock_quantity > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{p.stock_quantity}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'inactive' ? 'bg-gray-500/10 text-gray-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{p.status}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => openEditProduct(p)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition" title="Edit"><Edit2 size={16} /></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition" title="Delete"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">No products found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "categories" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map(c => (
                    <div key={c.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 hover:border-cyan-500/30 transition group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center overflow-hidden">
                          {c.image_url ? <SafeImage src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : <FolderTree size={24} className="text-cyan-400" />}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEditCategory(c)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => deleteCategory(c.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white">{c.name}</h3>
                      {c.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.description}</p>}
                      <p className="text-xs text-gray-500 mt-1 mb-4">{c.slug}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</span>
                        <span className="text-sm font-bold text-white bg-gray-800 px-2.5 py-1 rounded-md">{c.product_count}</span>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <div className="col-span-full rounded-2xl border border-gray-800 p-12 text-center text-gray-500">No categories found.</div>}
                </div>
              )}

              {activeTab === "discounts" && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Type</th>
                        <th className="p-4 font-semibold text-right">Value</th>
                        <th className="p-4 font-semibold">Product</th>
                        <th className="p-4 font-semibold">Min Order</th>
                        <th className="p-4 font-semibold text-center">Expires</th>
                        <th className="p-4 font-semibold text-center">Status</th>
                        <th className="p-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {discounts.map(d => (
                        <tr key={d.id} className="hover:bg-gray-800/20 transition">
                          <td className="p-4"><div className="flex items-center gap-2"><Tag size={16} className="text-cyan-400" /><span className="font-semibold text-sm text-white">{d.name}</span></div></td>
                          <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${d.type === 'percentage' ? 'bg-purple-500/10 text-purple-400' : d.type === 'fixed' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>{d.type === 'percentage' ? '% OFF' : d.type === 'fixed' ? '₹ OFF' : 'BOGO'}</span></td>
                          <td className="p-4 text-sm font-mono text-emerald-400 text-right">{d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}</td>
                          <td className="p-4 text-sm text-gray-300">{d.product_name || "All Products"}</td>
                          <td className="p-4 text-sm text-gray-300">{d.min_order_value ? formatCurrency(d.min_order_value) : "-"}</td>
                          <td className="p-4 text-center text-xs text-gray-500">{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "Never"}</td>
                          <td className="p-4 text-center">
                            <button onClick={() => toggleDiscountStatus(d.id)} className={`p-1.5 rounded-md transition ${d.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-gray-500 hover:bg-gray-700'}`} title={d.is_active ? "Deactivate" : "Activate"}>
                              {d.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                          </td>
                          <td className="p-4"><div className="flex justify-center gap-2">
                            <button onClick={() => openEditDiscount(d)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => deleteDiscount(d.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition" title="Delete"><Trash2 size={16} /></button>
                          </div></td>
                        </tr>
                      ))}
                      {discounts.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-500">No discounts found.</td></tr>}
                    </tbody>
                  </table>
                  {discountTotalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-gray-800">
                      <button onClick={() => setDiscountPage(Math.max(1, discountPage - 1))} disabled={discountPage === 1} className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition text-sm">Previous</button>
                      <span className="px-4 py-2 text-gray-300 text-sm">Page {discountPage} of {discountTotalPages}</span>
                      <button onClick={() => setDiscountPage(Math.min(discountTotalPages, discountPage + 1))} disabled={discountPage === discountTotalPages} className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition text-sm">Next</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "inventory" && inventoryStats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total", value: inventoryStats.summary.totalProducts, clr: "bg-blue-500/10 text-blue-400", icon: Package },
                      { label: "In Stock", value: inventoryStats.summary.inStock, clr: "bg-emerald-500/10 text-emerald-400", icon: TrendingUp },
                      { label: "Low Stock", value: inventoryStats.summary.lowStock, clr: "bg-yellow-500/10 text-yellow-400", icon: AlertTriangle },
                      { label: "Out of Stock", value: inventoryStats.summary.outOfStock, clr: "bg-red-500/10 text-red-400", icon: TrendingDown },
                    ].map((s, i) => { const Icon = s.icon; return (
                      <div key={i} className={`${s.clr} border border-current/20 rounded-2xl p-6 backdrop-blur-sm`}>
                        <div className="flex justify-between items-start">
                          <div><p className="text-xs uppercase tracking-wider mb-2 font-semibold opacity-75">{s.label}</p><h3 className="text-3xl font-bold font-mono">{s.value}</h3></div>
                          <Icon size={24} className="opacity-50" />
                        </div>
                      </div>
                    );})}
                  </div>
                  <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-800"><h3 className="text-lg font-bold">Inventory</h3></div>
                    <table className="w-full text-left border-collapse">
                      <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                        <th className="p-4 font-semibold">Product</th><th className="p-4 font-semibold">SKU</th><th className="p-4 font-semibold text-right">Price</th>
                        <th className="p-4 font-semibold text-center">Stock</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Action</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {inventoryList.map(p => (
                          <tr key={p.id} className="hover:bg-gray-800/20 transition">
                            <td className="p-4"><div className="flex items-center gap-3">
                              {p.image_url ? <SafeImage src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center"><Package size={16} className="text-gray-500" /></div>}
                              <div><p className="font-semibold text-sm text-white">{p.name}</p><p className="text-xs text-gray-500">{p.category_name || "-"}</p></div>
                            </div></td>
                            <td className="p-4 text-sm font-mono text-cyan-400">{p.sku || "-"}</td>
                            <td className="p-4 text-sm font-mono text-emerald-400 text-right">{formatCurrency(p.price)}</td>
                            <td className="p-4 text-center"><span className={`px-2 py-1 rounded-md text-xs font-bold ${p.stock_quantity === 0 ? 'bg-red-500/10 text-red-400' : p.stock_quantity <= p.low_stock_limit ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{p.stock_quantity}</span></td>
                            <td className="p-4 text-center"><span className="text-xs font-bold">{p.stock_status === 'in_stock' ? 'IN STOCK' : p.stock_status === 'limited_stock' ? 'LIMITED' : 'OUT'}</span></td>
                            <td className="p-4 text-center"><button onClick={() => openStockModal(p)} className="px-3 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition">Edit</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {showStockModal && selectedProduct && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Update Stock</h2>
                        <div className="space-y-4">
                          <div><p className="text-sm font-semibold text-gray-300 mb-2">{selectedProduct.name}</p><p className="text-xs text-gray-500">Current Stock: {selectedProduct.stock_quantity}</p></div>
                          <div><label className="text-sm font-semibold text-gray-300 mb-2 block">New Quantity</label>
                            <input type="number" value={stockData.stock_quantity} onChange={(e) => setStockData({ ...stockData, stock_quantity: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
                          <div><label className="text-sm font-semibold text-gray-300 mb-2 block">Action</label>
                            <select value={stockData.action_type} onChange={(e) => setStockData({ ...stockData, action_type: e.target.value })}
                              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
                              <option value="manual_adjust">Manual Adjust</option><option value="restock">Restock</option><option value="damage">Damage</option><option value="lost">Lost</option>
                            </select></div>
                          <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowStockModal(false)} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">Cancel</button>
                            <button onClick={updateStock} className="flex-1 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition">Update Stock</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "users" && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                      <th className="p-4 font-semibold">User</th><th className="p-4 font-semibold">Contact</th><th className="p-4 font-semibold text-center">Orders</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-800/20 transition">
                          <td className="p-4"><div><p className="font-semibold text-sm text-white">{u.first_name} {u.last_name}</p><p className="text-xs text-gray-500">{u.email}</p></div></td>
                          <td className="p-4"><p className="text-sm text-gray-300">{u.phone || "-"}</p><p className="text-xs text-gray-500">{u.city || "-"}</p></td>
                          <td className="p-4 text-center text-sm font-bold text-cyan-400">{u.order_count}</td>
                          <td className="p-4 text-center">{u.is_verified ? <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400"><CheckCircle size={12} /> Active</span> : <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-gray-800 text-gray-400"><XCircle size={12} /> Inactive</span>}</td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => viewUserProfile(u)} 
                              disabled={userProfileLoading === u.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-bold hover:bg-cyan-500 hover:text-black transition-all group disabled:opacity-50"
                            >
                              {userProfileLoading === u.id ? (
                                <><Loader2 size={14} className="animate-spin" /> Loading profile...</>
                              ) : (
                                <><Eye size={14} className="group-hover:scale-110 transition-transform" /> View Profile</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                  {/* Order status filter */}
                  <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-800">
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Filter:</span>
                    {["all", "pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"].map(s => (
                      <button key={s} onClick={() => { setPage(1); setOrderFilter(s === "all" ? "" : s); fetchOrders(1, s === "all" ? "" : s); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${orderFilter === s || (s === "all" && !orderFilter) ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:text-white bg-gray-800/50 border border-gray-700/50"}`}>
                        {s === "all" ? "All" : s.replace(/_/g, " ").charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                      <th className="p-4 font-semibold">Order</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold text-right">Amount</th>
                      <th className="p-4 font-semibold text-center">Payment</th>
                      <th className="p-4 font-semibold text-center">Status</th>
                      <th className="p-4 font-semibold text-center">Date</th>
                      <th className="p-4 font-semibold text-center">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-800/20 transition">
                          <td className="p-4">
                            <p className="font-mono text-sm text-cyan-400">{o.order_number}</p>
                            {o.item_count && <p className="text-xs text-gray-500 mt-0.5">{o.item_count} items</p>}
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-sm text-white">{o.customer_name || "Guest"}</p>
                            <p className="text-xs text-gray-500">{o.customer_email || o.guest_email || ""}</p>
                          </td>
                          <td className="p-4 text-sm font-mono text-emerald-400 text-right font-bold">₹{parseFloat(o.total_amount).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <span className={`text-xs font-semibold ${o.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                              {o.payment_status?.charAt(0).toUpperCase() + o.payment_status?.slice(1) || "Pending"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                              className="bg-black border border-gray-700 text-xs rounded px-2 py-1.5 outline-none text-white focus:border-cyan-400 cursor-pointer">
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-center text-xs text-gray-500">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => openOrderDetail(o)}
                                className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition" 
                                title="View Details" disabled={orderDetailLoading === o.id}>
                                {orderDetailLoading === o.id ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                              </button>
                              <button onClick={() => downloadInvoice(o.id)}
                                className="p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition"
                                title="Download Invoice" disabled={invoiceLoading === o.id}>
                                {invoiceLoading === o.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">No orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-gray-800">
                      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition text-sm">Previous</button>
                      <span className="px-4 py-2 text-gray-300 text-sm">Page {page} of {totalPages}</span>
                      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition text-sm">Next</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
          </div>
        </main>
      </div>

      {showCategoryModal && (
        <CategoryModal
          show={showCategoryModal}
          editingCategory={editingCategory}
          categoryForm={categoryForm}
          categoryError={categoryError}
          categorySaving={categorySaving}
          onChange={handleCategoryFieldChange}
          onClose={() => setShowCategoryModal(false)}
          onSave={saveCategory}
          onSelectImage={handleImageSelection}
          onUploadImage={handleImageUpload}
          onClearImage={clearCategoryImageSelection}
          categoryImageFile={categoryImageFile}
          categoryImagePreview={categoryImagePreview}
          uploadingImage={uploadingImage}
          uploadTarget={uploadTarget}
        />
      )}
      {showProductModal && (
        <ProductModal
          show={showProductModal}
          editingProduct={editingProduct}
          productForm={productForm}
          productError={productError}
          productSaving={productSaving}
          categories={categories}
          onFieldChange={handleProductFieldChange}
          onClose={() => setShowProductModal(false)}
          onSave={saveProduct}
          onSelectImage={handleImageSelection}
          onUploadImage={handleImageUpload}
          onClearImage={clearProductImageSelection}
          productImageFile={productImageFile}
          productImagePreview={productImagePreview}
          uploadingImage={uploadingImage}
          uploadTarget={uploadTarget}
        />
      )}
      {showDiscountModal && (
        <DiscountModal
          show={showDiscountModal}
          editingDiscount={editingDiscount}
          discountForm={discountForm}
          discountError={discountError}
          discountSaving={discountSaving}
          products={products}
          onFieldChange={handleDiscountFieldChange}
          onClose={() => setShowDiscountModal(false)}
          onSave={saveDiscount}
        />
      )}
      {selectedUserProfile && (
        <UserProfileModal
          show={!!selectedUserProfile}
          user={selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          onToggleStatus={toggleUserStatus}
        />
      )}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Order Detail</p>
                <h2 className="text-xl font-bold text-white font-mono">{selectedOrderDetail.order_number}</h2>
              </div>
              <button onClick={() => setSelectedOrderDetail(null)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-black/30 border border-gray-800 p-4">
                  <p className="text-xs text-gray-500 uppercase">Customer</p>
                  <p className="mt-2 text-sm font-semibold text-white">{selectedOrderDetail.customer_name || selectedOrderDetail.guest_name || "Guest"}</p>
                  <p className="text-xs text-gray-400 break-all">{selectedOrderDetail.customer_email || selectedOrderDetail.guest_email || ""}</p>
                </div>
                <div className="rounded-xl bg-black/30 border border-gray-800 p-4">
                  <p className="text-xs text-gray-500 uppercase">Amount</p>
                  <p className="mt-2 text-lg font-bold text-emerald-400">₹{parseFloat(selectedOrderDetail.total_amount || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-black/30 border border-gray-800 p-4">
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <p className="mt-2 text-sm font-semibold text-cyan-400 capitalize">{String(selectedOrderDetail.status || "").replace(/_/g, " ")}</p>
                </div>
                <div className="rounded-xl bg-black/30 border border-gray-800 p-4">
                  <p className="text-xs text-gray-500 uppercase">Payment</p>
                  <p className="mt-2 text-sm font-semibold text-amber-400 capitalize">{selectedOrderDetail.payment_status || "pending"}</p>
                </div>
              </div>

              <div className="rounded-xl bg-black/30 border border-gray-800 p-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Delivery</p>
                <p className="text-sm text-gray-200">{selectedOrderDetail.delivery_address || "-"}</p>
                <p className="text-sm text-gray-400">
                  {[selectedOrderDetail.guest_city, selectedOrderDetail.guest_state, selectedOrderDetail.guest_pincode].filter(Boolean).join(", ")}
                </p>
              </div>

              <div className="rounded-xl bg-black/30 border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <p className="text-sm font-bold text-white">Items</p>
                </div>
                <div className="divide-y divide-gray-800">
                  {(selectedOrderDetail.items || []).map((item) => (
                    <div key={item.id || item.product_id} className="p-4 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                        {item.product_image ? (
                          <SafeImage src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-500"><Package size={18} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Qty {item.quantity} x ₹{parseFloat(item.price || 0).toFixed(2)}</p>
                      </div>
                      <p className="text-sm font-bold text-cyan-400">₹{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
