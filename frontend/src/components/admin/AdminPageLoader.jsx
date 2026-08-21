import React from "react";

/**
 * Professional loader shown briefly inside the Admin shell while a
 * route-level chunk (Dashboard, Products, Settings, ...) is being fetched.
 * The Admin sidebar/header stay visible; this only fills the content area.
 */
export default function AdminPageLoader({ label = "Loading section" }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 space-y-5"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)]">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-sm">{label}...</p>
        <p className="text-gray-500 text-xs mt-1">Preparing your workspace, please wait.</p>
      </div>
    </div>
  );
}