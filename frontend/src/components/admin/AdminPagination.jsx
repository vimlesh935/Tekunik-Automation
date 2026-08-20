import React from "react";

export default function AdminPagination({ page, totalPages, onPageChange, label }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between p-4 border-t border-gray-800">
      <p className="text-xs text-gray-600">{label || `Page ${page} of ${totalPages}`}</p>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition text-xs font-semibold">
          Previous
        </button>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 transition text-xs font-semibold">
          Next
        </button>
      </div>
    </div>
  );
}
