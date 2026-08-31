import { X, Save, RefreshCw, Upload, Ticket } from "lucide-react";
import { getImageUrl } from "../../../utils/imageUrl.js";

export default function DiscountModal({ show, editingDiscount, discountForm, discountError, discountSaving, products, categories, onFieldChange, onClose, onSave, onImageUpload }) {
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
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Discount Internal Name *</label>
            <input type="text" value={discountForm.name} onChange={(e) => onFieldChange("name", e.target.value)}
              placeholder="e.g. Summer Sale 2024" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Customer Facing Title</label>
            <input type="text" value={discountForm.title || ""} onChange={(e) => onFieldChange("title", e.target.value)}
              placeholder="e.g. 🔥 Get 20% OFF Summer Sale" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
            <textarea rows={2} value={discountForm.description || ""} onChange={(e) => onFieldChange("description", e.target.value)}
              placeholder="Describe the offer..." className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none resize-none" />
          </div>
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
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Apply To</label>
            <select value={discountForm.apply_to || "all"} onChange={(e) => onFieldChange("apply_to", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
              <option value="all">All Products</option>
              <option value="selected_products">Selected Products</option>
              <option value="selected_category">Selected Category</option>
            </select></div>
            
          {discountForm.apply_to === "selected_products" && (
            <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300 mb-2">Select Products</label>
              <select multiple size={4} value={discountForm.product_ids || []} onChange={(e) => onFieldChange("product_ids", Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">Hold CTRL/CMD to select multiple</p>
            </div>
          )}

          {discountForm.apply_to === "selected_category" && (
            <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300 mb-2">Select Categories</label>
              <select multiple size={4} value={discountForm.category_ids || []} onChange={(e) => onFieldChange("category_ids", Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
                {categories && categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">Hold CTRL/CMD to select multiple</p>
            </div>
          )}
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Min Order Value</label>
            <input type="number" step="0.01" min="0" value={discountForm.min_order_value || ""}
              onChange={(e) => onFieldChange("min_order_value", e.target.value)}
              placeholder="Optional..." className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Max Discount Amount</label>
            <input type="number" step="0.01" min="0" value={discountForm.maximum_discount || ""}
              onChange={(e) => onFieldChange("maximum_discount", e.target.value)}
              placeholder="Optional..." className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Active</label>
            <label className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer">
              <input type="checkbox" checked={discountForm.is_active}
                onChange={(e) => onFieldChange("is_active", e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500" />
              <span className="text-sm text-gray-300">Active</span>
            </label></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Start Date</label>
            <input type="datetime-local" value={discountForm.starts_at ? new Date(discountForm.starts_at).toISOString().slice(0, 16) : ""}
              onChange={(e) => onFieldChange("starts_at", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Expiry Date</label>
            <input type="datetime-local" value={discountForm.expires_at ? new Date(discountForm.expires_at).toISOString().slice(0, 16) : ""}
              onChange={(e) => onFieldChange("expires_at", e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>

          {/* ─── Coupon Configuration ─── */}
          <div className="md:col-span-2 mt-3 pt-5 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <Ticket size={16} className="text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Coupon Configuration</h3>
            </div>
            <p className="text-xs text-gray-500">Optional — controls how coupons that unlock this offer are issued.</p>
          </div>

          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Coupon Generation Mode</label>
            <select value={discountForm.coupon_generation || "NONE"}
              onChange={(e) => {
                onFieldChange("coupon_generation", e.target.value);
                if (e.target.value === "AUTOMATIC") onFieldChange("new_user_only", true);
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
              <option value="NONE">Manual (no auto coupons)</option>
              <option value="SHARED">Shared coupon code</option>
              <option value="UNIQUE">Unique coupon per user</option>
              <option value="AUTOMATIC">Automatic new-user coupon</option>
            </select></div>

          <div><label className="block text-sm font-semibold text-gray-300 mb-2">New Users Only</label>
            <label className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer">
              <input type="checkbox" checked={!!discountForm.new_user_only}
                onChange={(e) => onFieldChange("new_user_only", e.target.checked)}
                disabled={(discountForm.coupon_generation || "NONE") === "AUTOMATIC"}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500" />
              <span className={`text-sm ${(discountForm.coupon_generation || "NONE") === "AUTOMATIC" ? "text-gray-500" : "text-gray-300"}`}>
                {(discountForm.coupon_generation || "NONE") === "AUTOMATIC" ? "Always enabled for automatic coupons" : "Restrict to first purchase"}
              </span>
            </label></div>

          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Coupon Prefix</label>
            <input type="text" maxLength={20}
              value={discountForm.coupon_prefix || ""}
              onChange={(e) => onFieldChange("coupon_prefix", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g. WELCOME"
              disabled={!["UNIQUE", "AUTOMATIC"].includes(discountForm.coupon_generation || "NONE")}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none disabled:opacity-40 uppercase tracking-wider" /></div>

          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Coupon Validity (days)</label>
            <input type="number" min="1" step="1"
              value={discountForm.coupon_validity_days ?? ""}
              onChange={(e) => onFieldChange("coupon_validity_days", e.target.value)}
              placeholder="e.g. 7"
              disabled={!["UNIQUE", "AUTOMATIC"].includes(discountForm.coupon_generation || "NONE")}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none disabled:opacity-40" /></div>

          <div><label className="block text-sm font-semibold text-gray-300 mb-2">Total Redemption Limit</label>
            <input type="number" min="0" step="1"
              value={discountForm.usage_limit ?? ""}
              onChange={(e) => onFieldChange("usage_limit", e.target.value)}
              placeholder="Blank = unlimited"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
              
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Banner Image</label>
            <div className="flex items-start gap-4">
              {discountForm.banner_image && (
                <img src={getImageUrl(discountForm.banner_image)} alt="Banner" className="h-16 w-32 object-cover rounded border border-gray-700" />
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold rounded-lg cursor-pointer hover:bg-cyan-500/20 transition text-sm">
                <Upload size={14} /> Upload Banner
                <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onImageUpload} />
              </label>
              {discountForm.banner_image && (
                <button type="button" onClick={() => onFieldChange("banner_image", "")} className="text-red-400 text-xs hover:underline mt-2">Remove</button>
              )}
            </div>
          </div>
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
