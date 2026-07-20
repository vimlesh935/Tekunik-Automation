import { useState } from "react";
import {
  X,
  Upload,
  Loader2,
  CheckCircle,
  File,
  FolderArchive,
  Download,
} from "lucide-react";

export default function BulkImportModal({ show, onClose, onImportComplete, apiCall, getApiUrl, token }) {
  const [file, setFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ phase: "", percent: 0 });
  const [results, setResults] = useState(null);
  const [duplicateAction, setDuplicateAction] = useState("skip");
  const [error, setError] = useState("");

  if (!show) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const ext = droppedFile.name.split(".").pop().toLowerCase();
      if (["csv", "xlsx"].includes(ext)) {
        setFile(droppedFile);
        setError("");
      } else {
        setError("Please drop a .csv or .xlsx file");
      }
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError("");
    }
  };

  const handleZipSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setZipFile(selected);
      setError("");
    }
  };

  const handleDownloadTemplate = async (format) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/products/download-template?format=${format}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `product-import-template.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download template: " + err.message);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    setImporting(true);
    setError("");
    setProgress({ phase: "Reading File...", percent: 10 });
    setResults(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (zipFile) fd.append("zip", zipFile);
      fd.append("duplicate_action", duplicateAction);

      setProgress({ phase: "Uploading Images...", percent: 30 });

      const res = await fetch(getApiUrl("/api/admin/products/bulk-import"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      setProgress({ phase: "Importing Products...", percent: 65 });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Import failed");

      setProgress({ phase: "Completed", percent: 100 });
      setResults(data.data?.results || data.results);

      if (onImportComplete) onImportComplete();
    } catch (err) {
      setError(err.message || "Import failed");
      setProgress({ phase: "Failed", percent: 0 });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setZipFile(null);
    setError("");
    setProgress({ phase: "", percent: 0 });
    setResults(null);
    setDuplicateAction("skip");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Bulk Import Products</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          {!importing && !results && (
            <div className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition ${
                  dragOver
                    ? "border-cyan-400 bg-cyan-500/5"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <File size={48} className="mx-auto mb-4 text-gray-500" />
                <p className="text-gray-300 font-semibold mb-2">
                  {file ? file.name : "Drag & drop your file here"}
                </p>
                <p className="text-gray-500 text-sm mb-4">Supported: .csv, .xlsx</p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition cursor-pointer">
                  <Upload size={16} /> Browse File
                  <input type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Product Images ZIP (optional)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-cyan-500/50 transition">
                    <FolderArchive size={16} />
                    {zipFile ? zipFile.name : "Choose ZIP folder"}
                    <input type="file" accept=".zip" onChange={handleZipSelect} className="hidden" />
                  </label>
                  {zipFile && (
                    <button onClick={() => setZipFile(null)} className="text-red-400 hover:text-red-300 text-sm">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">If duplicate product exists</label>
                <select
                  value={duplicateAction}
                  onChange={(e) => setDuplicateAction(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none"
                >
                  <option value="skip">Skip Duplicate</option>
                  <option value="update">Update Existing</option>
                </select>
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold text-gray-300 mb-3">Download Sample Template</p>
                <div className="flex gap-3">
                  <button onClick={() => handleDownloadTemplate("xlsx")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-cyan-500/50 transition">
                    <Download size={16} /> Excel (.xlsx)
                  </button>
                  <button onClick={() => handleDownloadTemplate("csv")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-cyan-500/50 transition">
                    <Download size={16} /> CSV
                  </button>
                </div>
              </div>

              <button onClick={handleImport}
                disabled={!file}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Upload size={16} /> Import Products
              </button>
            </div>
          )}

          {importing && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <Loader2 size={48} className="mx-auto mb-4 text-cyan-400 animate-spin" />
                <p className="text-lg font-semibold text-white">{progress.phase}</p>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-400">{progress.percent}%</p>
            </div>
          )}

          {results && !importing && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
                <h3 className="text-xl font-bold text-white">Import Completed</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{results.total}</p>
                  <p className="text-xs text-gray-400">Total Rows</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{results.imported}</p>
                  <p className="text-xs text-gray-400">Imported Successfully</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{results.skipped}</p>
                  <p className="text-xs text-gray-400">Skipped</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{results.failed}</p>
                  <p className="text-xs text-gray-400">Failed</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{results.duplicates}</p>
                  <p className="text-xs text-gray-400">Duplicate Products</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-orange-400">{results.missingImages}</p>
                  <p className="text-xs text-gray-400">Missing Images</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{results.invalidCategories}</p>
                  <p className="text-xs text-gray-400">Invalid Categories</p>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Error Details</h4>
                  <div className="max-h-40 overflow-y-auto bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    {results.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-400 mb-1">
                        Row {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
