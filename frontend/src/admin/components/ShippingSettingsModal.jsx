import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import apiCall from "../../services/api.js";

export default function ShippingSettingsModal({ isOpen, onClose, onSave }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    enabled: true,
    free_shipping_threshold: 5000,
    default_charge: 50,
    express_charge: 150,
    cod_charge: 0,
    default_delivery_days_min: 2,
    default_delivery_days_max: 7,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiCall("/api/admin/shipping/settings", { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error("Failed to load shipping settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiCall("/api/admin/shipping/settings", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      onSave?.();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Settings size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Shipping Settings</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={(e) => handleChange("enabled", e.target.checked)}
                      className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-white">Enable Shipping</span>
                  </label>
                </div>

                <hr className="border-slate-800" />

                <div className="grid gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Free Shipping Threshold
                    </label>
                    <input
                      type="number"
                      value={settings.free_shipping_threshold}
                      onChange={(e) => handleChange("free_shipping_threshold", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="100"
                    />
                    <p className="text-xs text-slate-500 mt-1">Orders above this amount get free shipping</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Default Shipping Charge
                    </label>
                    <input
                      type="number"
                      value={settings.default_charge}
                      onChange={(e) => handleChange("default_charge", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Express Shipping Charge
                    </label>
                    <input
                      type="number"
                      value={settings.express_charge}
                      onChange={(e) => handleChange("express_charge", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      COD Shipping Charge
                    </label>
                    <input
                      type="number"
                      value={settings.cod_charge}
                      onChange={(e) => handleChange("cod_charge", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Min Delivery Days
                      </label>
                      <input
                        type="number"
                        value={settings.default_delivery_days_min}
                        onChange={(e) => handleChange("default_delivery_days_min", parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        min="1"
                        max="30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Max Delivery Days
                      </label>
                      <input
                        type="number"
                        value={settings.default_delivery_days_max}
                        onChange={(e) => handleChange("default_delivery_days_max", parseInt(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        min="1"
                        max="30"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    {saving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}