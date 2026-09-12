import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Mail, PenLine, Eye, Loader2, ShieldCheck, XCircle, X,
  Search, Clock, FileText, Zap, Send,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import apiCall from "../../services/api.js";
import Toast from "../../admin/components/common/Toast.jsx";
import AdminCustomEmail from "./AdminCustomEmail.jsx";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "enabled", label: "Enabled" },
  { key: "disabled", label: "Disabled" },
];

function StatusBadge({ enabled }) {
  return enabled ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 whitespace-nowrap">
      <ShieldCheck size={13} /> Enabled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-red-500/10 text-red-400 border-red-500/30 whitespace-nowrap">
      <XCircle size={13} /> Disabled
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition ${
        active
          ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
          : "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-gray-200"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

export default function AdminEmailTemplates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "custom" ? "custom" : "automated";
  const setTab = (tab) => {
    if (tab === "custom") setSearchParams({ tab: "custom" }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewingKey, setPreviewingKey] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const json = await apiCall("/api/admin/email-templates");
      if (json.success) {
        setTemplates(json.data || []);
        setError(null);
      } else {
        setError(json.message || "Failed to load email templates");
      }
    } catch (err) {
      setError(err.message || "Failed to load email templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const statusOk =
        filter === "all" ||
        (filter === "enabled" && t.is_enabled) ||
        (filter === "disabled" && !t.is_enabled);
      if (!statusOk) return false;
      if (!q) return true;
      return (
        String(t.template_name || "").toLowerCase().includes(q) ||
        String(t.trigger || "").toLowerCase().includes(q) ||
        String(t.subject || "").toLowerCase().includes(q)
      );
    });
  }, [templates, search, filter]);

  const openPreview = async (template) => {
    setPreviewingKey(template.template_key);
    try {
      const json = await apiCall(`/api/admin/email-templates/${encodeURIComponent(template.template_key)}/preview`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (json.success) {
        setPreview({
          template,
          subject: json.data.subject,
          body: json.data.body,
          unknownVariables: json.data.unknownVariables || [],
        });
      } else {
        showToast(json.message || "Preview failed", "error");
      }
    } catch (err) {
      showToast(err.message || "Preview failed", "error");
    } finally {
      setPreviewingKey(null);
    }
  };

  const counts = useMemo(() => {
    return templates.reduce((acc, t) => {
      acc.all += 1;
      if (t.is_enabled) acc.enabled += 1;
      else acc.disabled += 1;
      return acc;
    }, { all: 0, enabled: 0, disabled: 0 });
  }, [templates]);

  return (
    <div className="space-y-6 min-w-0">
      <Toast toast={toast} />

      {/* Page header */}
      <div>
        <Link
          to="/admin/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-cyan-400 transition mb-3"
        >
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Settings / Email Templates</p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Mail className="text-cyan-400" size={24} /> Email Templates
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-700 bg-gray-800/50 text-gray-400">
            Applied to live emails instantly
          </span>
        </div>
        <p className="text-gray-400 mt-1">
          Manage emails sent to your customers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-3">
        <TabButton active={activeTab === "automated"} onClick={() => setTab("automated")} icon={Mail} label="Automated Emails" />
        <TabButton active={activeTab === "custom"} onClick={() => setTab("custom")} icon={Send} label="Send Custom Email" />
      </div>

      {activeTab === "automated" ? (
        <>
          {/* Search + filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1 max-w-md min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-0">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search email templates..."
                    className="w-full bg-black border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                    filter === f.key
                      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                      : "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-gray-200"
                  }`}
                >
                  {f.label}
                  {counts[f.key] > 0 && (
                    <span className="ml-1.5 text-[11px] text-gray-500">({counts[f.key]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="animate-spin text-cyan-400" />
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <p className="text-red-300 font-semibold">{error}</p>
              <button
                type="button"
                onClick={loadTemplates}
                className="mt-3 text-sm font-semibold text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-black/40 border border-gray-800 rounded-2xl p-10 text-center">
              <FileText size={32} className="text-gray-600 mx-auto" />
              <p className="text-gray-400 text-sm mt-3">
                {templates.length === 0 ? "No email templates found." : "No templates match your search."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-4">
                {filtered.map((template) => (
                  <div key={template.template_key} className="bg-black/40 border border-gray-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-white break-words">{template.template_name}</div>
                        {template.subject && (
                          <div className="text-gray-500 text-xs mt-1 break-words">
                            <span className="text-gray-600">Subject: </span>{template.subject}
                          </div>
                        )}
                      </div>
                      <StatusBadge enabled={Boolean(template.is_enabled)} />
                    </div>
                    <div className="flex items-start gap-2 text-gray-400 text-sm">
                      <Zap size={13} className="text-cyan-500/70 mt-0.5 shrink-0" />
                      <span className="break-words">{template.trigger || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Clock size={13} className="text-gray-600" /> Last updated: {formatDate(template.updated_at)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        to={`/admin/email-templates/${encodeURIComponent(template.template_key)}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-sm font-semibold transition"
                      >
                        <PenLine size={15} /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => openPreview(template)}
                        disabled={previewingKey === template.template_key}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 text-gray-300 hover:bg-gray-700/60 border border-gray-700 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      >
                        {previewingKey === template.template_key ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Eye size={15} />
                        )}
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / tablet table */}
              <div className="hidden md:block bg-black/40 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-left">
                      <th className="w-[30%] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Template</th>
                      <th className="w-[24%] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Email Type / Trigger</th>
                      <th className="w-[16%] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="w-[15%] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Last Updated</th>
                      <th className="w-[15%] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((template) => (
                      <tr key={template.template_key} className="border-b border-gray-800/60 last:border-0 hover:bg-white/[0.02] transition align-top">
                        <td className="px-4 py-4 min-w-0">
                          <div className="font-bold text-white break-words">{template.template_name}</div>
                          {template.subject && (
                            <div className="text-gray-500 text-xs mt-1 break-words line-clamp-2">
                              <span className="text-gray-600">Subject: </span>{template.subject}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 min-w-0">
                          <div className="flex items-start gap-2 text-gray-400 min-w-0">
                            <Zap size={13} className="text-cyan-500/70 mt-0.5 shrink-0" />
                            <span className="break-words">{template.trigger || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4"><StatusBadge enabled={Boolean(template.is_enabled)} /></td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-gray-400 text-xs whitespace-nowrap">
                            <Clock size={13} className="text-gray-600 shrink-0" /> {formatDate(template.updated_at)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Link
                              to={`/admin/email-templates/${encodeURIComponent(template.template_key)}`}
                              className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-sm font-semibold transition whitespace-nowrap"
                            >
                              <PenLine size={15} /> Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => openPreview(template)}
                              disabled={previewingKey === template.template_key}
                              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-800/50 text-gray-300 hover:bg-gray-700/60 border border-gray-700 rounded-xl text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap"
                            >
                              {previewingKey === template.template_key ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Eye size={15} />
                              )}
                              Preview
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : (
        /* Custom Email composer — lives inside the Email Templates section */
        <AdminCustomEmail />
      )}

      {/* Preview modal — renders sample values, never sends a real email */}
      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-6">
          <div className="w-full max-w-2xl bg-black/70 border border-gray-700 rounded-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye size={18} className="text-cyan-400" /> Email Preview — {preview.template.template_name}
                </h3>
                <p className="text-gray-500 text-xs mt-1">Shows how the email will look. No email is sent.</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="w-9 h-9 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 flex items-center justify-center"
                aria-label="Close preview"
              >
                <X size={16} />
              </button>
            </div>

            {preview.unknownVariables.length > 0 && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                <p className="text-amber-200 text-xs">Some of the details added are not supported by this email.</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Subject</p>
              <div className="bg-black/40 border border-gray-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white break-words">
                {preview.subject}
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Body</p>
            <div className="bg-black/40 border border-gray-800 rounded-xl overflow-hidden">
              <div className="w-full border-0 bg-white p-6" dangerouslySetInnerHTML={{ __html: preview.body }} />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-5 py-2.5 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}