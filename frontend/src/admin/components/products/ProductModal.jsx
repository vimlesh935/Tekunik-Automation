import { X, Save, RefreshCw } from "lucide-react";
import ImageUploadField from "../common/ImageUploadField.jsx";

export default function ProductModal({ show, editingProduct, productForm, productError, productSaving, categories, onFieldChange, onClose, onSave, onSelectImage, onUploadImage, onClearImage, productImageFile, productImagePreview, uploadingImage, uploadTarget }) {
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
          <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300 mb-2">Application Usage</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Smart Home", "Office Automation", "Hotel Solutions", "Hospital Automation", "School & College Solutions", "Industrial Automation"].map((app) => {
                const selected = (productForm.applications || []).includes(app);
                return (
                  <label key={app} className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${selected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>
                    <input type="checkbox" checked={selected} onChange={() => {
                      const current = productForm.applications || [];
                      const updated = selected ? current.filter(a => a !== app) : [...current, app];
                      onFieldChange("applications", updated);
                    }} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500" />
                    <span className="text-sm text-gray-300">{app}</span>
                  </label>
                );
              })}
            </div>
          </div>
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
