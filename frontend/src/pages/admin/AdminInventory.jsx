import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bell, Package, TrendingDown, TrendingUp, X } from "lucide-react";
import { formatCurrency } from "../../utils/currency.js";
import apiCall from "../../services/api.js";
import SafeImage from "../../components/SafeImage.jsx";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPageToolbar from "../../components/admin/AdminPageToolbar.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import Toast from "../../admin/components/common/Toast.jsx";

export default function AdminInventory() {
  const [inventoryStats, setInventoryStats] = useState(null);
  const [inventoryList, setInventoryList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockData, setStockData] = useState({ stock_quantity: 0, action_type: "restock" });
  // Waiting customers modal (real back-in-stock alert data)
  const [waitingProduct, setWaitingProduct] = useState(null);
  const [waitingCustomers, setWaitingCustomers] = useState([]);
  const [waitingLoading, setWaitingLoading] = useState(false);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const dashboardRes = await apiCall("/api/admin/inventory/dashboard");
      const dashboard = dashboardRes.data;
      setInventoryStats(dashboard || {});
      const listRes = await apiCall(`/api/admin/inventory?page=${page}&search=${encodeURIComponent(search)}`);
      const list = listRes.data;
      setInventoryList(list?.products || []);
      setTotalPages(list?.pagination?.pages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockData({ stock_quantity: 0, action_type: "restock" });
    setShowStockModal(true);
  };

  const updateStock = async () => {
    if (!selectedProduct) return;
    const qty = parseInt(stockData.stock_quantity, 10);
    const action = stockData.action_type;
    if (Number.isNaN(qty) || qty <= 0) {
      showToast("Quantity must be greater than 0", "error");
      return;
    }
    if (action === "damaged" && qty > (selectedProduct.stock || 0)) {
      showToast("Quantity exceeds available stock", "error");
      return;
    }
    try {
      const res = await apiCall(`/api/admin/stock/${selectedProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({ stock_quantity: qty, action_type: action }),
      });
      setShowStockModal(false);
      setSelectedProduct(null);
      setStockData({ stock_quantity: 0, action_type: "restock" });
      // Surface real restock outcome from the backend response.
      const bis = res?.data?.backInStock;
      if (bis?.backInStock) {
        showToast(
          `Restocked. ${bis.notificationsCreated} customer notification(s) sent${bis.demandExceedsRestock ? " — ⚠ demand exceeds restock" : ""}.`,
          bis.demandExceedsRestock ? "error" : "success"
        );
      } else {
        showToast("Stock updated successfully.");
      }
      fetchInventory();
    } catch (err) {
      showToast(err.message || "Failed to update stock", "error");
    }
  };

  const openWaitingCustomers = async (product) => {
    setWaitingProduct(product);
    setWaitingCustomers([]);
    setWaitingLoading(true);
    try {
      const res = await apiCall(`/api/admin/back-in-stock/product/${product.id}/waiting?limit=200`);
      setWaitingCustomers(res?.data?.customers || []);
    } catch (err) {
      showToast(err.message || "Failed to load waiting customers", "error");
    } finally {
      setWaitingLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const summary = inventoryStats?.summary || {};

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <AdminPageToolbar title="Inventory" description="Track stock levels, stock status, and inventory updates." search={search} onSearchChange={(value) => { setPage(1); setSearch(value); }} showSearch />
      {loading ? <AdminLoading /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: summary.totalProducts || 0, clr: "bg-blue-500/10 text-blue-400", icon: Package },
              { label: "In Stock", value: summary.inStock || 0, clr: "bg-emerald-500/10 text-emerald-400", icon: TrendingUp },
              { label: "Low Stock", value: summary.lowStock || 0, clr: "bg-yellow-500/10 text-yellow-400", icon: AlertTriangle },
              { label: "Out of Stock", value: summary.outOfStock || 0, clr: "bg-red-500/10 text-red-400", icon: TrendingDown },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${s.clr} border border-current/20 rounded-2xl p-6 backdrop-blur-sm`}>
                  <div className="flex justify-between items-start">
                    <div><p className="text-xs uppercase tracking-wider mb-2 font-semibold opacity-75">{s.label}</p><h3 className="text-3xl font-bold font-mono">{s.value}</h3></div>
                    <Icon size={24} className="opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800"><h3 className="text-lg font-bold">Inventory</h3></div>
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-semibold">Product</th><th className="p-4 font-semibold text-right">Price</th>
                <th className="p-4 font-semibold text-center">Stock</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-800/50">
                {inventoryList.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/20 transition">
                    <td className="p-4"><div className="flex items-center gap-3">
                      {p.image_url ? <SafeImage src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center"><Package size={16} className="text-gray-500" /></div>}
                      <div>
                        <p className="font-semibold text-sm text-white">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.category_name || "-"}</p>
                        {/* Real demand signal: active back-in-stock alerts */}
                        {Number(p.waiting_customers) > 0 && (
                          <button
                            type="button"
                            onClick={() => openWaitingCustomers(p)}
                            title="View Waiting Customers"
                            className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300 hover:bg-amber-500 hover:text-black transition"
                          >
                            <Bell size={11} /> {Number(p.waiting_customers)} waiting
                          </button>
                        )}
                      </div>
                    </div></td>
                    <td className="p-4 text-sm font-mono text-emerald-400 text-right">{formatCurrency(p.price)}</td>
                    <td className="p-4 text-center"><span className={`px-2 py-1 rounded-md text-xs font-bold ${p.stock === 0 ? "bg-red-500/10 text-red-400" : p.stock <= p.low_stock_limit ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"}`}>{p.stock}</span></td>
                    <td className="p-4 text-center"><span className="text-xs font-bold">{p.stock_status === "in_stock" ? "IN STOCK" : p.stock_status === "limited_stock" ? "LIMITED" : "OUT"}</span></td>
                    <td className="p-4 text-center"><button onClick={() => openStockModal(p)} className="px-3 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition">Edit</button></td>
                  </tr>
                ))}
                {inventoryList.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No inventory items found.</td></tr>}
              </tbody>
            </table>
            <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Update Stock</h2>
            <div className="space-y-4">
              <div><p className="text-sm font-semibold text-gray-300 mb-2">{selectedProduct.name}</p><p className="text-xs text-gray-500">Current Stock: {selectedProduct.stock}</p></div>
              <div><label className="text-sm font-semibold text-gray-300 mb-2 block">Stock Quantity</label>
                <input type="number" min="1" value={stockData.stock_quantity} onChange={(e) => setStockData({ ...stockData, stock_quantity: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none" /></div>
              <div><label className="text-sm font-semibold text-gray-300 mb-2 block">Action</label>
                <select value={stockData.action_type} onChange={(e) => setStockData({ ...stockData, action_type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 outline-none">
                  <option value="restock">Restock</option>
                  <option value="damaged">Damaged</option>
                </select></div>
              {Number(selectedProduct.waiting_customers) > 0 && (
                <p className="text-xs text-amber-300 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  🔔 {Number(selectedProduct.waiting_customers)} customer(s) are waiting for this product.
                  Restocking from 0 will notify them automatically.
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowStockModal(false)} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">Cancel</button>
                <button onClick={updateStock} className="flex-1 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition">Update Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {waitingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Bell size={18} className="text-amber-400" /> Waiting Customers</h2>
                <p className="text-xs text-gray-500 mt-1">{waitingProduct.name}</p>
              </div>
              <button onClick={() => setWaitingProduct(null)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {waitingLoading ? (
                <p className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading waiting customers...</p>
              ) : waitingCustomers.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-500">No customers are waiting for this product.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-black/50 border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-400 sticky top-0">
                    <th className="p-3 font-semibold">Customer</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Requested At</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Notified At</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {waitingCustomers.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 text-sm text-white font-medium">{c.customer_name || "-"}</td>
                        <td className="p-3 text-xs text-gray-400 break-all">{c.customer_email || "-"}</td>
                        <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{formatDateTime(c.created_at)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === "ACTIVE" ? "bg-amber-500/10 text-amber-300"
                              : c.status === "NOTIFIED" ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-gray-500/10 text-gray-400"
                          }`}>{c.status}</span>
                        </td>
                        <td className="p-3 text-xs text-gray-400 whitespace-nowrap">{formatDateTime(c.notified_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}