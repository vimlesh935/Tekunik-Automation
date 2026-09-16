import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Loader2, Truck, Trash2, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import apiCall from "../../services/api.js";

export default function ShippingMethodsModal({ isOpen, onClose, onSave }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    method_key: "",
    name: "",
    description: "",
    base_charge: 0,
    estimated_days_min: 2,
    estimated_days_max: 7,
    is_enabled: true,
    is_default: false,
    supports_cod: true,
    supports_online: true,
    sort_order: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadMethods();
    }
  }, [isOpen]);

  const loadMethods = async () => {
    setLoading(true);
    try {
      const res = await apiCall("/api/admin/shipping/methods", { headers: { Authorization: `Bearer ${token}` } });
      setMethods(res.data?.methods || []);
    } catch (err) {
      console.error("Failed to load methods:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      method_key: "",
      name: "",
      description: "",
      base_charge: 0,
      estimated_days_min: 2,
      estimated_days_max: 7,
      is_enabled: true,
      is_default: false,
      supports_cod: true,
      supports_online: true,
      sort_order: 0,
    });
    setEditingMethod(null);
  };

  const handleEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      method_key: method.method_key,
      name: method.name,
      description: method.description || "",
      base_charge: method.base_charge || 0,
      estimated_days_min: method.estimated_days_min || 2,
      estimated_days_max: method.estimated_days_max || 7,
      is_enabled: !!method.is_enabled,
      is_default: !!method.is_default,
      supports_cod: !!method.supports_cod,
      supports_online: !!method.supports_online,
      sort_order: method.sort_order || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        method_key: formData.method_key,
        name: formData.name,
        description: formData.description,
        base_charge: formData.base_charge,
        estimated_days_min: formData.estimated_days_min,
        estimated_days_max: formData.estimated_days_max,
        is_enabled: formData.is_enabled,
        is_default: formData.is_default,
        supports_cod: formData.supports_cod,
        supports_online: formData.supports_online,
        sort_order: formData.sort_order,
      };

      if (editingMethod) {
        await apiCall(`/api/admin/shipping/methods/${editingMethod.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await apiCall("/api/admin/shipping/methods", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      resetForm();
      setShowForm(false);
      loadMethods();
      onSave?.();
    } catch (err) {
      alert(err.message || "Failed to save method");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shipping method?")) return;
    try {
      await apiCall(`/api/admin/shipping/methods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadMethods();
      onSave?.();
    } catch (err) {
      alert(err.message || "Failed to delete method");
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
                <Truck size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Shipping Methods</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-2 transition-colors">
                <Plus size={16} /> Add Method
              </button>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
                <h3 className="text-lg font-bold text-white mb-4">{editingMethod ? "Edit Method" : "Add Method"}</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Method Key *</label>
                  <input
                    type="text"
                    value={formData.method_key}
                    onChange={(e) => handleChange("method_key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                    disabled={!!editingMethod}
                  />
                  <p className="text-xs text-slate-500 mt-1">Unique identifier (e.g., standard, express, free)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Base Charge *</label>
                    <input
                      type="number"
                      value={formData.base_charge}
                      onChange={(e) => handleChange("base_charge", parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => handleChange("sort_order", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Delivery Days</label>
                    <input
                      type="number"
                      value={formData.estimated_days_min}
                      onChange={(e) => handleChange("estimated_days_min", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="1"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Delivery Days</label>
                    <input
                      type="number"
                      value={formData.estimated_days_max}
                      onChange={(e) => handleChange("estimated_days_max", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
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
                    <span className="text-sm text-white">Default Method</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.supports_cod}
                      onChange={(e) => handleChange("supports_cod", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Supports COD</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.supports_online}
                      onChange={(e) => handleChange("supports_online", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Supports Online</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                    {editingMethod ? "Update" : "Create"} Method
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-indigo-400" />
                  </div>
                ) : methods.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Truck size={48} className="mx-auto mb-4 text-slate-600" />
                    <p>No shipping methods configured</p>
                    <p className="text-xs mt-1">Click "Add Method" to create one</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <th className="pb-2">Name</th>
                          <th className="pb-2">Key</th>
                          <th className="pb-2">Charge</th>
                          <th className="pb-2">Delivery</th>
                          <th className="pb-2">Supports</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {methods.map((method) => (
                          <tr key={method.id} className="hover:bg-slate-800/30">
                            <td className="py-3 font-medium text-white">{method.name}</td>
                            <td className="py-3 text-sm font-mono text-slate-400">{method.method_key}</td>
                            <td className="py-3 text-sm text-white">₹{method.base_charge}</td>
                            <td className="py-3 text-sm text-slate-400">
                              {method.estimated_days_min}-{method.estimated_days_max} days
                            </td>
                            <td className="py-3 text-sm text-slate-400">
                              {method.supports_cod && <span className="mr-2 text-emerald-400">COD</span>}
                              {method.supports_online && <span className="text-indigo-400">Online</span>}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${method.is_enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"}`}>
                                {method.is_default && <span className="text-amber-400">★</span>}
                                {method.is_enabled ? "Active" : "Disabled"}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEdit(method)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors" title="Edit">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => handleDelete(method.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
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