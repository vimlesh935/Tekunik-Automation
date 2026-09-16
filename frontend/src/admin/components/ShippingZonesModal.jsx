import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Loader2, MapPin, Trash2, Edit, Save, X as XIcon, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import apiCall from "../../services/api.js";

export default function ShippingZonesModal({ isOpen, onClose, onSave }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    zone_name: "",
    pincodes: "",
    states: "",
    shipping_charge: 0,
    express_charge: "",
    cod_charge: "",
    estimated_delivery_days_min: 2,
    estimated_delivery_days_max: 7,
    is_enabled: true,
    is_default: false,
    priority: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadZones();
    }
  }, [isOpen]);

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await apiCall("/api/admin/shipping/zones", { headers: { Authorization: `Bearer ${token}` } });
      setZones(res.data?.zones || []);
    } catch (err) {
      console.error("Failed to load zones:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      zone_name: "",
      pincodes: "",
      states: "",
      shipping_charge: 0,
      express_charge: "",
      cod_charge: "",
      estimated_delivery_days_min: 2,
      estimated_delivery_days_max: 7,
      is_enabled: true,
      is_default: false,
      priority: 0,
    });
    setEditingZone(null);
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      zone_name: zone.zone_name,
      pincodes: Array.isArray(zone.pincodes) ? zone.pincodes.join(", ") : "",
      states: Array.isArray(zone.states) ? zone.states.join(", ") : "",
      shipping_charge: zone.shipping_charge || 0,
      express_charge: zone.express_charge || "",
      cod_charge: zone.cod_charge || "",
      estimated_delivery_days_min: zone.estimated_delivery_days_min || 2,
      estimated_delivery_days_max: zone.estimated_delivery_days_max || 7,
      is_enabled: !!zone.is_enabled,
      is_default: !!zone.is_default,
      priority: zone.priority || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        zone_name: formData.zone_name,
        pincodes: formData.pincodes.split(",").map(s => s.trim()).filter(Boolean),
        states: formData.states.split(",").map(s => s.trim()).filter(Boolean),
        shipping_charge: formData.shipping_charge,
        express_charge: formData.express_charge ? parseFloat(formData.express_charge) : null,
        cod_charge: formData.cod_charge ? parseFloat(formData.cod_charge) : null,
        estimated_delivery_days_min: formData.estimated_delivery_days_min,
        estimated_delivery_days_max: formData.estimated_delivery_days_max,
        is_enabled: formData.is_enabled,
        is_default: formData.is_default,
        priority: formData.priority,
      };

      if (editingZone) {
        await apiCall(`/api/admin/shipping/zones/${editingZone.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await apiCall("/api/admin/shipping/zones", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      resetForm();
      setShowForm(false);
      loadZones();
      onSave?.();
    } catch (err) {
      alert(err.message || "Failed to save zone");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this zone?")) return;
    try {
      await apiCall(`/api/admin/shipping/zones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadZones();
      onSave?.();
    } catch (err) {
      alert(err.message || "Failed to delete zone");
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

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
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <MapPin size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Shipping Zones</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-2 transition-colors">
                <Plus size={16} /> Add Zone
              </button>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
                <h3 className="text-lg font-bold text-white mb-4">{editingZone ? "Edit Zone" : "Add Zone"}</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Zone Name *</label>
                  <input
                    type="text"
                    value={formData.zone_name}
                    onChange={(e) => handleChange("zone_name", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pincodes (comma separated)</label>
                  <input
                    type="text"
                    value={formData.pincodes}
                    onChange={(e) => handleChange("pincodes", e.target.value)}
                    placeholder="400001, 400002, 400003"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">States (comma separated)</label>
                  <input
                    type="text"
                    value={formData.states}
                    onChange={(e) => handleChange("states", e.target.value)}
                    placeholder="Maharashtra, Gujarat"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Shipping Charge *</label>
                    <input
                      type="number"
                      value={formData.shipping_charge}
                      onChange={(e) => handleChange("shipping_charge", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Express Charge</label>
                    <input
                      type="number"
                      value={formData.express_charge}
                      onChange={(e) => handleChange("express_charge", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">COD Charge</label>
                    <input
                      type="number"
                      value={formData.cod_charge}
                      onChange={(e) => handleChange("cod_charge", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => handleChange("priority", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Delivery Days</label>
                    <input
                      type="number"
                      value={formData.estimated_delivery_days_min}
                      onChange={(e) => handleChange("estimated_delivery_days_min", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Delivery Days</label>
                    <input
                      type="number"
                      value={formData.estimated_delivery_days_max}
                      onChange={(e) => handleChange("estimated_delivery_days_max", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_enabled}
                      onChange={(e) => handleChange("is_enabled", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => handleChange("is_default", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Default Zone</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                    {editingZone ? "Update" : "Create"} Zone
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-indigo-400" />
                  </div>
                ) : zones.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <MapPin size={48} className="mx-auto mb-4 text-slate-600" />
                    <p>No shipping zones configured</p>
                    <p className="text-xs mt-1">Click "Add Zone" to create one</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <th className="pb-2">Zone Name</th>
                          <th className="pb-2">Pincodes</th>
                          <th className="pb-2">Charge</th>
                          <th className="pb-2">Delivery</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {zones.map((zone) => (
                          <tr key={zone.id} className="hover:bg-slate-800/30">
                            <td className="py-3 font-medium text-white">{zone.zone_name}</td>
                            <td className="py-3 text-sm text-slate-400 max-w-xs truncate">
                              {Array.isArray(zone.pincodes) ? zone.pincodes.join(", ") : "All"}
                            </td>
                            <td className="py-3 text-sm text-white">₹{zone.shipping_charge}</td>
                            <td className="py-3 text-sm text-slate-400">
                              {zone.estimated_delivery_days_min}-{zone.estimated_delivery_days_max} days
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${zone.is_enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                                {zone.is_default && <span className="text-amber-400">★</span>}
                                {zone.is_enabled ? "Active" : "Disabled"}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEdit(zone)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors" title="Edit">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDelete(zone.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}