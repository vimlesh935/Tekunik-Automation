import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminDemoEnquiryService } from "../../services/api.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import Toast from "../../admin/components/common/Toast.jsx";

export default function AdminDemoBookings() {
  const [demoEnquiries, setDemoEnquiries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchDemoBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminDemoEnquiryService.list(page, 50);
      setDemoEnquiries(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load demo bookings", "error");
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchDemoBookings();
  }, [fetchDemoBookings]);

  const updateDemoStatus = async (id, status) => {
    try {
      const res = await adminDemoEnquiryService.updateStatus(id, status);
      showToast(res.message || "Status updated");
      fetchDemoBookings();
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  const deleteDemoEnquiry = async (id) => {
    if (!window.confirm("Delete this demo enquiry?")) return;
    try {
      await adminDemoEnquiryService.delete(id);
      showToast("Enquiry deleted");
      fetchDemoBookings();
    } catch (err) {
      showToast(err.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Demo Bookings</h2>
        <p className="text-xs text-gray-500">Manage demo booking enquiries and follow-up status.</p>
      </div>
      {loading ? <AdminLoading /> : (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-semibold">Name</th><th className="p-4 font-semibold">Email</th><th className="p-4 font-semibold">Phone</th><th className="p-4 font-semibold">Date</th><th className="p-4 font-semibold">Time</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Created</th><th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {demoEnquiries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-800/20 transition">
                  <td className="p-4"><p className="font-semibold text-sm text-white">{e.full_name}</p>{e.message && <p className="text-xs text-gray-500 truncate max-w-[150px]">{e.message}</p>}</td>
                  <td className="p-4 text-sm text-gray-300">{e.email}</td>
                  <td className="p-4 text-sm text-gray-300">{e.phone}</td>
                  <td className="p-4 text-sm text-gray-300">{e.preferred_date || "-"}</td>
                  <td className="p-4 text-sm text-gray-300">{e.preferred_time || "-"}</td>
                  <td className="p-4 text-center">
                    <select value={e.status} onChange={(ev) => updateDemoStatus(e.id, ev.target.value)} className="bg-black border border-gray-700 text-xs rounded px-2 py-1.5 outline-none text-white focus:border-cyan-400 cursor-pointer">
                      <option value="Pending">Pending</option><option value="Contacted">Contacted</option><option value="Scheduled">Scheduled</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option><option value="Email Failed">Email Failed</option>
                    </select>
                  </td>
                  <td className="p-4 text-center text-xs text-gray-500">{e.created_at ? new Date(e.created_at).toLocaleDateString() : "-"}</td>
                  <td className="p-4 text-center"><button onClick={() => deleteDemoEnquiry(e.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition" title="Delete"><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {demoEnquiries.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-500">No demo enquiries found.</td></tr>}
            </tbody>
          </table>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
