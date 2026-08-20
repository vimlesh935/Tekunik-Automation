import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmDeleteModal({ show, title = "Delete Item", message = "This action cannot be undone.", details, onCancel, onConfirm, confirmLabel = "Delete" }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-900 border border-red-500/20 rounded-[1.5rem] w-full max-w-md p-8 shadow-2xl shadow-red-500/5 animate-fade-in">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 mb-6">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h3 className="text-xl font-black text-white text-center tracking-tight">{title}</h3>
        <p className="mt-3 text-sm text-gray-400 text-center leading-relaxed">{message}</p>
        {details && <div className="mt-4 bg-black/30 border border-gray-800 rounded-xl p-4">{details}</div>}
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition font-bold text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-bold text-sm flex items-center justify-center gap-2">
            <Trash2 size={15} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
