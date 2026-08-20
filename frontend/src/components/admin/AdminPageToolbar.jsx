import React from "react";
import { Plus, Search, Upload } from "lucide-react";

export default function AdminPageToolbar({ title, description, search, onSearchChange, searchPlaceholder = "Quick filter...", showSearch = false, actions = [] }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actions.map((action) => {
          const Icon = action.icon === "upload" ? Upload : Plus;
          return (
            <button key={action.label} onClick={action.onClick} className={action.className || "inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]"}>
              <Icon size={16} /> {action.label}
            </button>
          );
        })}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder={searchPlaceholder} value={search} onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-cyan-500 outline-none w-full sm:w-64 transition shadow-inner" />
          </div>
        )}
      </div>
    </div>
  );
}
