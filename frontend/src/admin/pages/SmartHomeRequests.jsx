import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { smartHomeProposalService } from "../../services/api";

/**
 * Status values that match the actual `status` column in the database/api
 * (see database/smart-home-proposals-migration.sql ENUM). Using the real
 * stored values (not display labels) ensures the filter returns results.
 */
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

/**
 * home_type values stored in the database use the raw kebab-case form
 * (e.g. "1-bhk"). We keep raw values as the option `value` (what is sent to
 * the API) and only use a human friendly `label` for display, so there is no
 * display-label-vs-stored-value mismatch that would hide valid records.
 */
const HOME_TYPES = [
  { value: "1-rk", label: "1 RK" },
  { value: "1-bhk", label: "1 BHK" },
  { value: "2-bhk", label: "2 BHK" },
  { value: "3-bhk", label: "3 BHK" },
  { value: "4-bhk", label: "4 BHK" },
  { value: "villa", label: "Villa" },
  { value: "office", label: "Office" },
  { value: "custom", label: "Custom" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "proposal_number", label: "Proposal Number" },
];

const DEFAULT_DRAFT = {
  status: "",
  search: "",
  home_type: "",
  sort: "latest",
};

const PAGE_SIZE = 20;

function naturalProposalNumberCompare(a = "", b = "") {
  const num = (str) => {
    const digits = (str.match(/\d+/g) || []).map(Number);
    return digits.length ? digits : [0];
  };
  // Compare by the numeric fragments so that SR-9 sorts before SR-10.
  const an = num(a);
  const bn = num(b);
  const len = Math.max(an.length, bn.length);
  for (let i = 0; i < len; i++) {
    const av = an[i] ?? 0;
    const bv = bn[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return String(a).localeCompare(String(b));
}

export default function SmartHomeRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // draftFilters = values the admin is typing/selecting (not yet applied)
  const [draftFilters, setDraftFilters] = useState(DEFAULT_DRAFT);

  // activeFilters = committed filters that were submitted via Apply. These
  // drive the actual API call. Everything else is local UI state.
  const [activeFilters, setActiveFilters] = useState({ ...DEFAULT_DRAFT, page: 1, limit: PAGE_SIZE });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await smartHomeProposalService.list(activeFilters);
      const data = res?.data || res;
      const rows = data?.proposals || [];
      const pg = data?.pagination || { page: 1, totalPages: 1, total: 0 };
      // Client-side natural sort for proposal number is only meaningful when we
      // own the full dataset for the current page set. The backend already does
      // string ORDER BY proposal_number, which is correct for the zero-padded
      // SHP-YYYYMMDD-NNNN ids it generates. We still normalize Proposal Number
      // sort on the response to guarantee SR-9 before SR-10 ordering.
      if (activeFilters.sort === "proposal_number") {
        rows.sort((a, b) => naturalProposalNumberCompare(a.proposal_number, b.proposal_number));
      }
      setRequests(rows);
      setPagination({ page: pg.page, totalPages: pg.totalPages, total: pg.total });
    } catch (err) {
      setError(err?.message || "Failed to load smart home requests");
      setRequests([]);
      setPagination({ page: 1, totalPages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDraft = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    // Single API call combining all filters (AND logic) and resetting to page 1.
    setActiveFilters({ ...draftFilters, page: 1, limit: PAGE_SIZE });
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_DRAFT);
    setActiveFilters({ ...DEFAULT_DRAFT, page: 1, limit: PAGE_SIZE });
  };

  const changePage = (nextPage) => {
    setActiveFilters((prev) => ({ ...prev, page: nextPage }));
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

  const hasActiveFilters =
    draftFilters.status ||
    draftFilters.search ||
    draftFilters.home_type ||
    draftFilters.sort !== "latest";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Smart Home Requests</h1>
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
            <select
              value={draftFilters.status}
              onChange={(e) => updateDraft("status", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Search</label>
            <input
              type="text"
              value={draftFilters.search}
              onChange={(e) => updateDraft("search", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white"
              placeholder="Proposal / name / email / phone / city"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Home Type</label>
            <select
              value={draftFilters.home_type}
              onChange={(e) => updateDraft("home_type", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white"
            >
              <option value="">All Types</option>
              {HOME_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Sort</label>
            <select
              value={draftFilters.sort}
              onChange={(e) => updateDraft("sort", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">From</label>
            <input
              type="date"
              value={draftFilters.date_from || ""}
              onChange={(e) => updateDraft("date_from", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">To</label>
            <input
              type="date"
              value={draftFilters.date_to || ""}
              onChange={(e) => updateDraft("date_to", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">{error}</div>
        )}

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Proposal</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">City</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Home Type</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider text-center">Step</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    {hasActiveFilters
                      ? "No smart home requests found matching the selected filters."
                      : "No smart home requests found"}
                  </td>
                </tr>
              ) : (
                requests.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800 hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/smart-home-requests/${p.id}`)}
                        className="font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
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
                    <td className="px-4 py-3 text-center">
                      <span className="text-[11px] font-mono font-bold text-indigo-400">
                        {p.wizard_status === "Completed" ? "5/5" : `${p.current_step || 0}/5`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        className={`text-[11px] px-2 py-1 rounded-lg border font-medium ${getStatusBadge(p.status)}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/smart-home-requests/${p.id}`)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
                      >
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
                onClick={() => changePage(Math.max(1, pagination.page - 1))}
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
                    onClick={() => changePage(pageNum)}
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
                onClick={() => changePage(Math.min(pagination.totalPages, pagination.page + 1))}
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
