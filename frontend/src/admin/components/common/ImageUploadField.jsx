import React from "react";
import { Upload, RefreshCw } from "lucide-react";
import SafeImage from "../../../components/SafeImage.jsx";

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

export default ImageUploadField;
