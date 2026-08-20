import React, { useCallback, useEffect, useState } from "react";
import { ClipboardList, Cpu, DoorOpen, Eye, Home, Mail, Phone, Trash2, User, X } from "lucide-react";
import { smartHomeProposalService } from "../../services/api.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import ConfirmDeleteModal from "../../components/admin/ConfirmDeleteModal.jsx";
import Toast from "../../admin/components/common/Toast.jsx";

const DEVICE_LABELS = {
  lights: "Lights",
  fans: "Fans",
  curtains: "Curtains",
  ac: "AC",
  tv: "TV",
  "smart-plug": "Smart Plug",
  "door-lock": "Door Lock",
  "door-bell": "Door Bell",
  "motion-sensor": "Motion Sensor",
  "smoke-sensor": "Smoke Sensor",
  camera: "Camera",
  "wifi-ap": "Wi-Fi AP",
};

const HOME_TYPE_LABELS = {
  "1-rk": "1 RK",
  "1-bhk": "1 BHK",
  "2-bhk": "2 BHK",
  "3-bhk": "3 BHK",
  "4-bhk": "4 BHK",
  villa: "Villa",
  office: "Office",
  custom: "Custom",
};

function parseJsonField(value, fallback = []) {
  try {
    if (!value) return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

function InstallationDetailModal({ request, onClose }) {
  if (!request) return null;
  const rooms = parseJsonField(request.rooms_json, []);
  const deviceRooms = parseJsonField(request.devices_json, []);
  const estimatedProducts = parseJsonField(request.estimated_products_json, []);
  const hasCustomerInfo = request.full_name || request.email || request.phone || request.city || request.state || request.pincode || request.address;
  const hasHomeDetails = request.home_type;
  const hasRooms = rooms.length > 0;
  const hasDevices = deviceRooms.some((room) => Object.values(room.devices || {}).some((cfg) => cfg.enabled));
  const hasBudget = request.estimated_cost > 0 || estimatedProducts.length > 0;
  const hasNotes = request.additional_notes;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-5 flex items-center justify-between z-10">
          <div><p className="text-xs uppercase tracking-wider text-gray-500">Installation Enquiry Detail</p><h2 className="text-xl font-bold text-white font-mono">{request.proposal_number || `#${request.id}`}</h2></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          {hasCustomerInfo && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2"><User size={16} className="text-indigo-400" /><h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Customer Information</h3></div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {request.full_name && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Name</p><p className="text-sm font-semibold text-white">{request.full_name}</p></div>}
                {request.email && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Email</p><p className="text-sm text-gray-200 break-all">{request.email}</p></div>}
                {request.phone && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Phone</p><p className="text-sm text-gray-200">{request.phone}</p></div>}
                {request.city && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">City</p><p className="text-sm text-gray-200">{request.city}</p></div>}
                {request.state && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">State</p><p className="text-sm text-gray-200">{request.state}</p></div>}
                {request.pincode && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Pincode</p><p className="text-sm text-gray-200">{request.pincode}</p></div>}
                {request.address && <div className="sm:col-span-2"><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Address</p><p className="text-sm text-gray-200">{request.address}</p></div>}
              </div>
            </div>
          )}

          {hasHomeDetails && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2"><Home size={16} className="text-indigo-400" /><h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Home Details</h3></div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4"><div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Home Type</p><p className="text-sm font-semibold text-white">{HOME_TYPE_LABELS[request.home_type] || request.home_type}</p></div>{request.total_rooms > 0 && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Total Rooms</p><p className="text-sm text-gray-200">{request.total_rooms}</p></div>}</div>
            </div>
          )}

          {hasRooms && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2"><DoorOpen size={16} className="text-indigo-400" /><h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Room Details</h3></div>
              <div className="p-4"><div className="flex flex-wrap gap-2">{rooms.map((room, i) => <span key={room.id || i} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700">{room.name}</span>)}</div></div>
            </div>
          )}

          {hasDevices && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2"><Cpu size={16} className="text-indigo-400" /><h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Device Selection</h3></div>
              <div className="p-4 space-y-3">
                {deviceRooms.map((room, i) => {
                  const enabledDevices = Object.entries(room.devices || {}).filter(([, cfg]) => cfg.enabled);
                  if (enabledDevices.length === 0) return null;
                  return <div key={room.id || i} className="rounded-xl bg-black/30 border border-slate-800 p-3"><p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">{room.name}</p><div className="flex flex-wrap gap-1.5">{enabledDevices.map(([deviceId, cfg]) => <span key={deviceId} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{DEVICE_LABELS[deviceId] || deviceId}{cfg.quantity > 1 && <span className="text-indigo-500">x{cfg.quantity}</span>}</span>)}</div></div>;
                })}
              </div>
            </div>
          )}

          {hasBudget && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center gap-2"><ClipboardList size={16} className="text-indigo-400" /><h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Budget</h3></div>
              <div className="p-4 space-y-3">
                {request.estimated_cost > 0 && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Estimated Budget</p><p className="text-lg font-bold text-emerald-400">₹{Number(request.estimated_cost).toLocaleString("en-IN")}</p></div>}
                {estimatedProducts.length > 0 && <div><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Selected Products</p><div className="space-y-1">{estimatedProducts.map((item, i) => <div key={i} className="flex items-center justify-between text-sm bg-black/30 rounded-lg px-3 py-2 border border-slate-800"><span className="text-gray-200">{item.deviceLabel || item.name || "Item"}</span><div className="flex items-center gap-3">{item.roomName && <span className="text-[11px] text-gray-500">{item.roomName}</span>}{item.quantity > 0 && <span className="text-xs font-semibold text-cyan-400">x{item.quantity}</span>}</div></div>)}</div></div>}
              </div>
            </div>
          )}

          {hasNotes && <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"><div className="p-4 border-b border-slate-800 flex items-center gap-2"><ClipboardList size={16} className="text-indigo-400" /><h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Proposal Summary</h3></div><div className="p-4"><p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Additional Notes</p><p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{request.additional_notes}</p></div></div>}
        </div>
      </div>
    </div>
  );
}

export default function AdminInstallationRequests() {
  const [installRequests, setInstallRequests] = useState([]);
  const [installPage, setInstallPage] = useState(1);
  const [installTotal, setInstallTotal] = useState(0);
  const [installTotalPages, setInstallTotalPages] = useState(1);
  const [installStatusFilter, setInstallStatusFilter] = useState("");
  const [installDetail, setInstallDetail] = useState(null);
  const [deleteInstallId, setDeleteInstallId] = useState(null);
  const [showDeleteInstallModal, setShowDeleteInstallModal] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchInstallRequests = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { page: installPage, limit: 20 };
      if (installStatusFilter) filters.status = installStatusFilter;
      const res = await smartHomeProposalService.list(filters);
      const data = res?.data || res;
      setInstallRequests(data?.proposals || []);
      setInstallTotal(data?.pagination?.total || 0);
      setInstallTotalPages(data?.pagination?.totalPages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load installation requests", "error");
    } finally {
      setLoading(false);
    }
  }, [installPage, installStatusFilter, showToast]);

  useEffect(() => {
    fetchInstallRequests();
  }, [fetchInstallRequests]);

  const handleInstallStatusChange = async (id, newStatus) => {
    setUpdatingStatusId(id);
    try {
      const res = await smartHomeProposalService.updateStatus(id, newStatus);
      setInstallRequests((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      showToast(res?.message || "Status updated successfully.");
    } catch (err) {
      showToast(err?.message || "Failed to update status", "error");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const deleteInstallRequest = async () => {
    try {
      await smartHomeProposalService.remove(deleteInstallId);
      showToast("Installation request deleted successfully");
      setShowDeleteInstallModal(false);
      setDeleteInstallId(null);
      fetchInstallRequests();
    } catch (err) {
      showToast(err.message || "Failed to delete", "error");
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Installation Requests</h2>
        <p className="text-xs text-gray-500">Review installation enquiries, room details, devices, and status.</p>
      </div>
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-800">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Filter:</span>
          {["", "Pending", "Confirmed", "Completed"].map((status) => <button key={status} onClick={() => { setInstallPage(1); setInstallStatusFilter(status); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${installStatusFilter === status ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:text-white bg-gray-800/50 border border-gray-700/50"}`}>{status || "All"}</button>)}
        </div>
        {loading ? <AdminLoading /> : <>
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400"><th className="p-4 font-semibold">Customer</th><th className="p-4 font-semibold">Contact</th><th className="p-4 font-semibold">Home Type</th><th className="p-4 font-semibold text-center">Rooms</th><th className="p-4 font-semibold text-center">Devices</th><th className="p-4 font-semibold text-center">Date</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {installRequests.map((request) => {
                const rooms = parseJsonField(request.rooms_json, []);
                const totalDevices = rooms.reduce((sum, room) => sum + Object.values(room.devices || {}).filter((device) => device.enabled).length, 0);
                return (
                  <tr key={request.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4"><p className="text-sm font-bold text-white">{request.full_name}</p><p className="text-[10px] text-slate-500">{request.city || "-"}</p></td>
                    <td className="p-4"><div className="flex flex-col gap-1"><span className="text-xs text-slate-300 flex items-center gap-1"><Mail size={10} />{request.email}</span><span className="text-xs text-slate-300 flex items-center gap-1"><Phone size={10} />{request.phone || "-"}</span></div></td>
                    <td className="p-4 text-xs text-slate-300 uppercase font-bold"><span className="flex items-center gap-1"><Home size={12} />{request.home_type || "-"}</span></td>
                    <td className="p-4 text-center text-sm font-bold text-white">{rooms.length}</td>
                    <td className="p-4 text-center text-sm font-bold text-cyan-400">{totalDevices}</td>
                    <td className="p-4 text-xs text-slate-500 font-mono">{request.created_at ? new Date(request.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td>
                    <td className="p-4 text-center">{request.status === "Completed" ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Completed</span> : <select value={request.status || "Pending"} onChange={(e) => handleInstallStatusChange(request.id, e.target.value)} disabled={updatingStatusId === request.id} className="bg-black border border-gray-700 text-xs rounded px-2 py-1.5 outline-none text-white focus:border-indigo-500/50 cursor-pointer disabled:opacity-50"><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Completed">Completed</option></select>}</td>
                    <td className="p-4 text-center"><div className="flex justify-center gap-1.5"><button onClick={() => setInstallDetail(request)} className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition" title="View Details"><Eye size={15} /></button><button onClick={() => { setDeleteInstallId(request.id); setShowDeleteInstallModal(true); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition" title="Delete"><Trash2 size={15} /></button></div></td>
                  </tr>
                );
              })}
              {installRequests.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-500">No installation requests found.</td></tr>}
            </tbody>
          </table>
          <AdminPagination page={installPage} totalPages={installTotalPages} onPageChange={setInstallPage} label={`Page ${installPage} of ${installTotalPages} · ${installTotal} total requests`} />
        </>}
      </div>
      <ConfirmDeleteModal show={showDeleteInstallModal && !!deleteInstallId} title="Delete Installation Request" message="Are you sure you want to delete this installation request? This action cannot be undone." onCancel={() => { setShowDeleteInstallModal(false); setDeleteInstallId(null); }} onConfirm={deleteInstallRequest} />
      <InstallationDetailModal request={installDetail} onClose={() => setInstallDetail(null)} />
    </div>
  );
}
