import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { smartHomeProposalService } from "../../services/api";

const STATUSES = [
  "New",
  "Contacted",
  "Under Review",
  "Quotation Prepared",
  "Quotation Sent",
  "Site Visit Scheduled",
  "Awaiting Customer Approval",
  "Approved",
  "Converted to Order",
  "Completed",
  "Cancelled",
];

const HOME_TYPES = [
  "1-rk", "1-bhk", "2-bhk", "3-bhk", "4-bhk", "villa", "office", "custom",
];

export default function SmartHomeProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [filters, setFilters] = useState({
    status: "",
    search: "",
    home_type: "",
    assigned_admin: "",
    date_from: "",
    date_to: "",
    sort: "latest",
    page: 1,
  });

  const load = useCallback(async (f = filters) => {
    setLoading(true);
    setError("");
    try {
      const res = await smartHomeProposalService.list(f);
      const data = res?.data || res;
      setProposals(data?.proposals || []);
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err?.message || "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : prev.page }));
  };

  const applyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ status: "", search: "", home_type: "", assigned_admin: "", date_from: "", date_to: "", sort: "latest", page: 1 });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await smartHomeProposalService.updateStatus(id, newStatus, "Status updated from list");
      load();
    } catch (err) {
      setError(err?.message || "Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      "New": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "Contacted": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      "Under Review": "bg-amber-500/20 text-amber-300 border-amber-500/30",
      "Quotation Prepared": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      "Quotation Sent": "bg-purple-500/20 text-purple-300 border-purple-500/30",
      "Site Visit Scheduled": "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "Awaiting Customer Approval": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      "Approved": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      "Converted to Order": "bg-teal-500/20 text-teal-300 border-teal-500/30",
      "Completed": "bg-green-500/20 text-green-300 border-green-500/30",
      "Cancelled": "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colors[status] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(val || 0));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Smart Home Proposals</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage customer smart home proposals &middot; {pagination.total} total
            </p>
          </div>
          <Link to="/admin" className="text-sm text-indigo-400 hover:text-indigo-300">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-4">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Status</label>
            <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white">
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Search</label>
            <input type="text" value={filters.search} onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white"
              placeholder="Proposal / name / email / phone / city" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Home Type</label>
            <select value={filters.home_type} onChange={(e) => updateFilter("home_type", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white">
              <option value="">All Types</option>
              {HOME_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Sort</label>
            <select value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white">
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="proposal_number">Proposal Number</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">From</label>
            <input type="date" value={filters.date_from} onChange={(e) => updateFilter("date_from", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">To</label>
            <input type="date" value={filters.date_to} onChange={(e) => updateFilter("date_to", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white" />
          </div>
          <div className="flex items-end gap-2">
            <button type="button" onClick={applyFilters}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition">
              Apply
            </button>
            <button type="button" onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition">
              Clear
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">{error}</div>}

        {/* Proposals Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Proposal</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">City</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Home Type</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Cost</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">Loading proposals...</td></tr>
              ) : proposals.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No proposals found</td></tr>
              ) : (
                proposals.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/admin/smart-home-proposals/${p.id}`)}
                        className="font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        {p.proposal_number}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.full_name}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{p.email}</div>
                      <div className="text-[11px] text-slate-500">{p.phone || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{p.city || "-"}</td>
                    <td className="px-4 py-3 text-xs">{p.home_type || "-"}</td>
                    <td className="px-4 py-3 text-xs font-mono">{formatINR(p.estimated_cost)}</td>
                    <td className="px-4 py-3">
                      <select value={p.status} onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        className={`text-[11px] px-2 py-1 rounded-lg border font-medium ${getStatusBadge(p.status)}`}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => navigate(`/admin/smart-home-proposals/${p.id}`)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors">
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/60">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateFilter("page", Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                &larr; Prev
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                const pageNum = startPage + i;
                if (pageNum > pagination.totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => updateFilter("page", pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                      pageNum === pagination.page
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-700 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => updateFilter("page", Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}