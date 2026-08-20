import React, { useEffect, useState } from "react";
import { Globe, ToggleLeft, ToggleRight } from "lucide-react";
import { useWebsiteSettings } from "../../context/WebsiteSettingsContext.jsx";
import Toast from "../../admin/components/common/Toast.jsx";

export default function AdminSettings() {
  const { websiteMode, setWebsiteMode, settings } = useWebsiteSettings();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleToggleMode = async (mode) => {
    if (mode === websiteMode) return;
    setSaving(true);
    try {
      await setWebsiteMode(mode);
      showToast(`Website mode switched to "${mode === "live" ? "Live" : "Coming Soon"}".`);
    } catch (err) {
      showToast(err.message || "Failed to update website mode", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Globe className="text-cyan-400" size={24} />
          Settings
        </h2>
        <p className="text-gray-400 mt-1">Manage general system settings for the store.</p>
      </div>

      <Toast toast={toast} />

      <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Website Mode</h3>
            <p className="text-gray-400 text-sm mt-1">
              {websiteMode === "live"
                ? "Your website is currently live and visible to all visitors."
                : "Your website is currently in maintenance mode. Visitors will see the Coming Soon page."}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleToggleMode("live")}
              disabled={saving || websiteMode === "live"}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                websiteMode === "live"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-default"
                  : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700/50"
              }`}
            >
              <ToggleRight size={18} /> Live
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("coming_soon")}
              disabled={saving || websiteMode === "coming_soon"}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                websiteMode === "coming_soon"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 cursor-default"
                  : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700/50"
              }`}
            >
              <ToggleLeft size={18} /> Maintanance Mode 
            </button>
          </div>
        </div>
        {saving && <p className="text-gray-500 text-xs mt-4">Saving...</p>}
      </div>

      <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Store Information</h3>
        <p className="text-gray-400 text-sm">
          Company: <span className="text-white">{settings.company_name || "Tekunik Automation"}</span>
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Email: <span className="text-white">{settings.company_email || "—"}</span>
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Phone: <span className="text-white">{settings.company_phone || "—"}</span>
        </p>
      </div>
    </div>
  );
}