import { X, Save, RefreshCw, Upload } from "lucide-react";
import { getImageUrl } from "../../../utils/imageUrl.js";
import { OfferCard } from "../../../components/HomeOfferCarousel.jsx";

export default function DiscountModal({
  show,
  editingDiscount,
  discountForm,
  discountError,
  discountSaving,
  onFieldChange,
  onClose,
  onSave,
  onImageUpload,
}) {
  if (!show) return null;

  const previewOffer = {
    ...discountForm,
    title: discountForm.title || "Smart Home Fest",
    description: discountForm.description || "",
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{editingDiscount ? "Edit Offer" : "Add New Offer"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20} /></button>
        </div>

        {discountError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{discountError}</div>
        )}

        <div className="grid grid-cols-1 gap-5">
          {/* Offer Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Offer Title *</label>
            <input
              type="text"
              value={discountForm.title || ""}
              onChange={(e) => onFieldChange("title", e.target.value)}
              placeholder="e.g. Smart Home Fest"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Offer / Discount */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Offer / Discount *</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[130px_1fr]">
              <select
                value={discountForm.type}
                onChange={(e) => onFieldChange("type", e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none"
              >
                <option value="percentage">% OFF</option>
                <option value="fixed">₹ OFF</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountForm.value}
                onChange={(e) => onFieldChange("value", e.target.value)}
                placeholder={discountForm.type === "percentage" ? "e.g. 30" : "e.g. 500"}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {discountForm.type === "percentage" ? "e.g. 30 = 30% OFF" : "e.g. 500 = ₹500 OFF"}
            </p>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Short Description</label>
            <textarea
              rows={2}
              value={discountForm.description || ""}
              onChange={(e) => onFieldChange("description", e.target.value)}
              placeholder="e.g. Upgrade your home with smart automation products."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none resize-none"
            />
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Banner Image</label>
            <div className="flex items-start gap-4">
              {discountForm.banner_image ? (
                <img
                  src={getImageUrl(discountForm.banner_image)}
                  alt="Offer banner"
                  className="h-16 w-32 object-cover rounded border border-gray-700"
                />
              ) : (
                <div className="flex h-16 w-32 items-center justify-center rounded border border-dashed border-gray-600 text-[10px] text-gray-500">
                  No image
                </div>
              )}
              <div className="flex flex-col items-start gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold rounded-lg cursor-pointer hover:bg-cyan-500/20 transition text-sm">
                  <Upload size={14} /> Upload Banner Image
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onImageUpload} />
                </label>
                {discountForm.banner_image && (
                  <button
                    type="button"
                    onClick={() => onFieldChange("banner_image", "")}
                    className="text-red-400 text-xs hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Recommended: 1920 × 600. JPG, JPEG, PNG, WEBP.</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={discountForm.starts_at || ""}
                onChange={(e) => onFieldChange("starts_at", e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">End Date</label>
              <input
                type="datetime-local"
                value={discountForm.expires_at || ""}
                onChange={(e) => onFieldChange("expires_at", e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800 border border-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => onFieldChange("is_active", true)}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
                  discountForm.is_active
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${discountForm.is_active ? "bg-emerald-400" : "bg-gray-600"}`} />
                Active
              </button>
              <button
                type="button"
                onClick={() => onFieldChange("is_active", false)}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
                  !discountForm.is_active
                    ? "bg-gray-600/40 text-gray-200 border border-gray-500/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${!discountForm.is_active ? "bg-gray-400" : "bg-gray-600"}`} />
                Disabled
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {discountForm.is_active ? "This offer is live on the homepage and public Offers page." : "Disabled offers are hidden from all public pages."}
            </p>
          </div>

          {/* Homepage preview */}
          {discountForm.banner_image || discountForm.title || discountForm.value ? (
            <div className="pt-4 border-t border-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-3">Homepage Preview</p>
              <div className="overflow-hidden rounded-2xl border border-gray-800">
                <OfferCard offer={previewOffer} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 pt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={discountSaving}
            className="flex-1 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {discountSaving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Offer</>}
          </button>
        </div>
      </div>
    </div>
  );
}