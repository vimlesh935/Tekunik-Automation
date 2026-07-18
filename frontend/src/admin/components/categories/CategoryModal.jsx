import { X, Save, RefreshCw } from "lucide-react";
import ImageUploadField from "../common/ImageUploadField.jsx";

export default function CategoryModal({ show, editingCategory, categoryForm, categoryError, categorySaving, onChange, onClose, onSave, onSelectImage, onUploadImage, onClearImage, categoryImageFile, categoryImagePreview, uploadingImage, uploadTarget }) {
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
