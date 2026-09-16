import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { smartHomeProposalService } from "../services/api";
import { User, Home, DoorOpen, Cpu, ClipboardList, Check } from "lucide-react";

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

const STATUS_KEYS = {
  "New": "proposals.statusNew",
  "Contacted": "proposals.statusContacted",
  "Under Review": "proposals.statusUnderReview",
  "Quotation Prepared": "proposals.statusQuotationPrepared",
  "Quotation Sent": "proposals.statusQuotationSent",
  "Site Visit Scheduled": "proposals.statusSiteVisitScheduled",
  "Awaiting Customer Approval": "proposals.statusAwaitingApproval",
  "Approved": "proposals.statusApproved",
  "Converted to Order": "proposals.statusConvertedToOrder",
  "Completed": "proposals.statusCompleted",
  "Cancelled": "proposals.statusCancelled",
};

const WIZARD_STATUS_KEYS = {
  "New": "proposalDetail.wizardNew",
  "In Progress": "proposalDetail.wizardInProgress",
  "Pending": "proposalDetail.wizardPending",
  "Completed": "proposalDetail.wizardCompleted",
  "Submitted": "proposalDetail.wizardSubmitted",
  "Draft": "proposalDetail.wizardDraft",
};

const HOME_TYPES_LABELS = {
  "1-rk": "1 RK", "1-bhk": "1 BHK", "2-bhk": "2 BHK", "3-bhk": "3 BHK",
  "4-bhk": "4 BHK", "villa": "Villa", "office": "Office", "custom": "Custom",
};

const HOME_TYPE_KEYS = {
  "1-rk": "planner.home1rk",
  "1-bhk": "planner.home1bhk",
  "2-bhk": "planner.home2bhk",
  "3-bhk": "planner.home3bhk",
  "4-bhk": "planner.home4bhk",
  "villa": "planner.homeVilla",
  "office": "planner.homeOffice",
  "custom": "planner.homeCustom",
};

const DEVICE_KEYS = {
  lights: "planner.devLights",
  fans: "planner.devFans",
  curtains: "planner.devCurtains",
  ac: "planner.devAc",
  tv: "planner.devTv",
  "smart-plug": "planner.devSmartPlug",
  "door-lock": "planner.devDoorLock",
  "door-bell": "planner.devDoorBell",
  "motion-sensor": "planner.devMotionSensor",
  "smoke-sensor": "planner.devSmokeSensor",
  camera: "planner.devCamera",
  "wifi-ap": "planner.devWifiAp",
};

const STATUS_COLORS = {
  "New": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-500" },
  "Contacted": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", dot: "bg-cyan-500" },
  "Under Review": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-500" },
  "Quotation Prepared": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", dot: "bg-indigo-500" },
  "Quotation Sent": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-500" },
  "Site Visit Scheduled": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-500" },
  "Awaiting Customer Approval": { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-500" },
  "Approved": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500" },
  "Converted to Order": { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", dot: "bg-teal-500" },
  "Completed": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", dot: "bg-green-500" },
  "Cancelled": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-500" },
};

export default function SmartHomeProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [proposal, setProposal] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Admin notes modal
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // Site visit modal
  const [showSiteVisitModal, setShowSiteVisitModal] = useState(false);
  const [siteVisitDate, setSiteVisitDate] = useState("");

  // Quotation modal
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationAmount, setQuotationAmount] = useState("");

  // Assign admin modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedAdmin, setAssignedAdmin] = useState("");

  // Contact modal
  const [showContactModal, setShowContactModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await smartHomeProposalService.get(id);
      const data = res?.data || res;
      setProposal(data?.proposal || data || null);
      setStatusHistory(data?.statusHistory || []);
      setAdminNotes(data?.proposal?.admin_notes || "");
      setSiteVisitDate(data?.proposal?.site_visit_date || "");
      setQuotationAmount(data?.proposal?.quotation_amount || "");
      setAssignedAdmin(data?.proposal?.assigned_admin || "");
    } catch (err) {
      setError(err?.message || t('proposalDetail.loadFailed', 'Failed to load proposal'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [id, load]);

  const handleUpdate = async (field, value) => {
    try {
      await smartHomeProposalService.update(id, { [field]: value });
      setSuccessMsg(t('proposalDetail.fieldUpdated', '{{field}} updated successfully', { field: field.replace(/_/g, " ") }));
      setTimeout(() => setSuccessMsg(""), 3000);
      load();
    } catch (err) {
      setError(err?.message || t('proposalDetail.updateFailed', 'Update failed'));
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await smartHomeProposalService.updateStatus(id, newStatus, "Status updated from detail page");
      setSuccessMsg(t('proposalDetail.statusChangedTo', 'Status changed to {{status}}', { status: t(STATUS_KEYS[newStatus], newStatus) }));
      setTimeout(() => setSuccessMsg(""), 3000);
      load();
    } catch (err) {
      setError(err?.message || t('proposalDetail.statusUpdateFailed', 'Status update failed'));
    }
  };

  const handleConvert = async () => {
    if (!window.confirm(t('proposalDetail.confirmConvert', 'Convert this proposal to an order? This action cannot be undone.'))) return;
    setConverting(true);
    setError("");
    try {
      await smartHomeProposalService.convert(id);
      setSuccessMsg(t('proposalDetail.convertedSuccess', 'Proposal converted to order successfully!'));
      setTimeout(() => setSuccessMsg(""), 3000);
      load();
    } catch (err) {
      setError(err?.message || t('proposalDetail.conversionFailed', 'Conversion failed'));
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('proposalDetail.confirmDelete', 'Permanently delete this proposal? This cannot be undone.'))) return;
    setDeleting(true);
    try {
      await smartHomeProposalService.remove(id);
      navigate("/admin/smart-home-requests");
    } catch (err) {
      setError(err?.message || t('proposalDetail.deleteFailed', 'Delete failed'));
      setDeleting(false);
    }
  };

  const handleSaveNotes = async () => {
    await handleUpdate("admin_notes", adminNotes);
    setShowNotesModal(false);
  };

  const handleSaveSiteVisit = async () => {
    await handleUpdate("site_visit_date", siteVisitDate);
    setShowSiteVisitModal(false);
  };

  const handleSaveQuotation = async () => {
    await handleUpdate("quotation_amount", quotationAmount);
    await handleStatusChange("Quotation Prepared");
    setShowQuotationModal(false);
  };

  const handleAssignAdmin = async () => {
    await handleUpdate("assigned_admin", assignedAdmin);
    setShowAssignModal(false);
  };

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(val || 0));

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const statusColors = STATUS_COLORS[proposal?.status] || STATUS_COLORS["New"];
  const currentStep = proposal?.current_step || 0;
  const wizardStatus = proposal?.wizard_status || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-500">{t('proposalDetail.loading', 'Loading proposal...')}</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{t('proposalDetail.notFound', 'Proposal not found')}</p>
          <Link to="/admin/smart-home-requests" className="text-indigo-400 hover:text-indigo-300">
            &larr; {t('proposalDetail.backToProposals', 'Back to Proposals')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/admin/smart-home-requests" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            &larr; {t('proposalDetail.backToProposals', 'Back to Proposals')}
          </Link>
          <Link to="/admin" className="text-sm text-indigo-400 hover:text-indigo-300">
            {t('nav.dashboard')}
          </Link>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-300">&times;</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
            {successMsg}
          </div>
        )}

        {/* Header */}
        <div className={`p-6 rounded-2xl border ${statusColors.border} ${statusColors.bg} mb-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-sm text-slate-400">{proposal.proposal_number}</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text} ${statusColors.border} border`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
                  {t(STATUS_KEYS[proposal.status], proposal.status)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">{proposal.full_name}</h1>
              <p className="text-sm text-slate-400 mt-1">{t('proposalDetail.createdAt', 'Created {{date}}', { date: formatDateTime(proposal.created_at) })}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={proposal.status} onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg text-sm px-3 py-2 text-white focus:border-indigo-500/50 outline-none">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(STATUS_KEYS[s], s)}</option>
                ))}
              </select>
              {proposal.status !== "Converted to Order" && (
                <button type="button" onClick={handleConvert} disabled={converting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition">
                  {converting ? t('proposalDetail.converting', 'Converting...') : t('proposalDetail.convertToOrder', 'Convert to Order')}
                </button>
              )}
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 disabled:opacity-50 transition">
                {deleting ? t('proposalDetail.deleting', 'Deleting...') : t('common.delete')}
              </button>
            </div>
          </div>
          {proposal.converted_order_id && (
            <div className="mt-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-sm text-teal-300">
              {t('proposalDetail.convertedOrder', 'Converted to Order #{{id}}', { id: proposal.converted_order_id })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Customer Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">{t('proposalDetail.customerDetails', 'Customer Details')}</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.fullName', 'Full Name')}</span>
                  <span className="text-slate-200">{proposal.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('common.email')}</span>
                  <a href={`mailto:${proposal.email}`} className="text-indigo-400 hover:text-indigo-300">{proposal.email}</a>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('common.phone')}</span>
                  <a href={`tel:${proposal.phone}`} className="text-slate-200 hover:text-white">{proposal.phone || "-"}</a>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('planner.city')}</span>
                  <span className="text-slate-200">{proposal.city || "-"}</span>
                </div>
                {proposal.state && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.state', 'State')}</span>
                    <span className="text-slate-200">{proposal.state}</span>
                  </div>
                )}
                {proposal.address && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.address', 'Address')}</span>
                    <span className="text-slate-200 text-xs">{proposal.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">{t('proposalDetail.quickActions', 'Quick Actions')}</h2>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => setShowContactModal(true)}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition text-left">
                  {t('proposalDetail.contactCustomer', 'Contact Customer')}
                </button>
                <button onClick={() => setShowNotesModal(true)}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition text-left">
                  {t('proposalDetail.addNotes', 'Add Notes')}
                </button>
                <button onClick={() => setShowAssignModal(true)}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition text-left">
                  {t('proposalDetail.assignAdmin', 'Assign Admin')}
                </button>
                <button onClick={() => { setShowSiteVisitModal(true); setSiteVisitDate(proposal.site_visit_date || ""); }}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition text-left">
                  {t('proposalDetail.scheduleSiteVisit', 'Schedule Site Visit')}
                </button>
                <button onClick={() => { setShowQuotationModal(true); setQuotationAmount(proposal.quotation_amount || ""); }}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition text-left">
                  {t('proposalDetail.uploadQuotation', 'Upload Quotation')}
                </button>
                {proposal.status !== "Approved" && proposal.status !== "Converted to Order" && (
                  <button onClick={() => handleStatusChange("Approved")}
                    className="px-3 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/10 transition text-left">
                    {t('proposalDetail.markApproved', 'Mark Approved')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Steps Completed Banner */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t('proposalDetail.progress', 'Progress:')}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      s <= currentStep
                        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
                        : "bg-slate-800/50 text-slate-600 border-slate-700"
                    }`}>
                      {s <= currentStep ? <Check className="w-3 h-3" /> : s}
                    </div>
                  ))}
                </div>
                <span className="text-sm font-bold text-indigo-400 ml-2">
                  {wizardStatus === "Completed" ? t('proposalDetail.wizardCompleted', 'Completed') : t('proposalDetail.stepsCount', '{{count}}/5 Steps', { count: currentStep })}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${
                wizardStatus === "Completed"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : wizardStatus === "In Progress"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-gray-500/20 text-gray-300 border-gray-500/30"
              }`}>
                {wizardStatus ? t(WIZARD_STATUS_KEYS[wizardStatus], wizardStatus) : t('proposalDetail.wizardNew', 'New')}
              </span>
            </div>

            {/* Step 1: Customer Details — always shown if full_name exists */}
            {proposal.full_name && (
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{t('proposalDetail.customerDetails', 'Customer Details')}</h2>
                  {currentStep >= 1 && <span className="text-[10px] text-emerald-400 flex items-center gap-1 ml-auto"><Check className="w-3 h-3" /> {t('proposalDetail.completed', 'Completed')}</span>}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.fullName', 'Full Name')}</span>
                    <span className="text-slate-200 font-semibold">{proposal.full_name}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('common.email')}</span>
                    <a href={`mailto:${proposal.email}`} className="text-indigo-400 hover:text-indigo-300">{proposal.email}</a>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('common.phone')}</span>
                    <a href={`tel:${proposal.phone}`} className="text-slate-200 hover:text-white">{proposal.phone || "-"}</a>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('planner.city')}</span>
                    <span className="text-slate-200">{proposal.city || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Home Type */}
            {currentStep >= 2 && proposal.home_type && (
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{t('proposalDetail.homeDetails', 'Home Details')}</h2>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 ml-auto"><Check className="w-3 h-3" /> {t('proposalDetail.completed', 'Completed')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('planner.homeType')}</span>
                    <span className="text-sm font-semibold text-slate-200">{proposal.home_type ? t(HOME_TYPE_KEYS[proposal.home_type], HOME_TYPES_LABELS[proposal.home_type] || proposal.home_type) : "-"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.totalRooms', 'Total Rooms')}</span>
                    <span className="text-sm font-semibold text-slate-200">{proposal.total_rooms || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.estBudget', 'Est. Budget')}</span>
                    <span className="text-sm font-semibold text-emerald-400">{formatINR(proposal.estimated_cost)}</span>
                  </div>
                  {proposal.quotation_amount && (
                    <div className="p-3 rounded-xl bg-slate-800/50">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.quotation', 'Quotation')}</span>
                      <span className="text-sm font-semibold text-amber-400">{formatINR(proposal.quotation_amount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Rooms */}
            {currentStep >= 3 && (() => {
              let rooms = [];
              try { rooms = proposal.rooms_json ? (typeof proposal.rooms_json === 'string' ? JSON.parse(proposal.rooms_json) : proposal.rooms_json) : []; } catch {}
              if (!rooms.length) return null;
              return (
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                  <div className="flex items-center gap-2 mb-3">
                    <DoorOpen className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{t('proposalDetail.selectedRooms', 'Selected Rooms')}</h2>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 ml-auto"><Check className="w-3 h-3" /> {t('proposalDetail.completed', 'Completed')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rooms.map((room, i) => (
                      <span key={room.id || i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 text-xs text-slate-300 border border-slate-700/50">
                        <Home size={12} className="text-indigo-400" />
                        {room.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Step 4: Devices */}
            {currentStep >= 4 && (() => {
              let rooms = [];
              try { rooms = proposal.rooms_json ? (typeof proposal.rooms_json === 'string' ? JSON.parse(proposal.rooms_json) : proposal.rooms_json) : []; } catch {}
              if (!rooms.length) return null;
              const hasDevices = rooms.some(r => Object.values(r.devices || {}).some(d => d && d.enabled));
              if (!hasDevices) return null;
              return (
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{t('proposalDetail.selectedDevices', 'Selected Devices')}</h2>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 ml-auto"><Check className="w-3 h-3" /> {t('proposalDetail.completed', 'Completed')}</span>
                  </div>
                  <div className="space-y-3">
                    {rooms.map((room) => {
                      const enabled = Object.entries(room.devices || {}).filter(([, cfg]) => cfg && cfg.enabled);
                      if (!enabled.length) return null;
                      return (
                        <div key={room.id} className="p-3 rounded-xl bg-slate-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-200">{room.name}</span>
                            <span className="text-[11px] text-slate-500">{t('proposalDetail.devicesCount', '{{count}} devices', { count: enabled.length })}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {enabled.map(([deviceId, cfg]) => (
                              <span key={deviceId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-[11px] text-indigo-300">
                                {t(DEVICE_KEYS[deviceId], deviceId.replace(/-/g, " "))} &times;{cfg.quantity || 1}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Step 5: Notes & Submission */}
            {currentStep >= 5 && proposal.additional_notes && (
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{t('planner.additionalNotes')}</h2>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 ml-auto"><Check className="w-3 h-3" /> {t('proposalDetail.completed', 'Completed')}</span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{proposal.additional_notes}</p>
              </div>
            )}

            {/* Home Configuration — fallback for legacy proposals without current_step */}
            {!currentStep && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">{t('proposalDetail.homeConfiguration', 'Home Configuration')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-slate-800/50">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('planner.homeType')}</span>
                  <span className="text-sm font-semibold text-slate-200">{proposal.home_type ? t(HOME_TYPE_KEYS[proposal.home_type], HOME_TYPES_LABELS[proposal.home_type] || proposal.home_type) : "-"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.totalRooms', 'Total Rooms')}</span>
                  <span className="text-sm font-semibold text-slate-200">{proposal.total_rooms || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/50">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.estBudget', 'Est. Budget')}</span>
                  <span className="text-sm font-semibold text-emerald-400">{formatINR(proposal.estimated_cost)}</span>
                </div>
                {proposal.quotation_amount && (
                  <div className="p-3 rounded-xl bg-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.quotation', 'Quotation')}</span>
                    <span className="text-sm font-semibold text-amber-400">{formatINR(proposal.quotation_amount)}</span>
                  </div>
                )}
              </div>
            </div>)}

            {/* Rooms & Devices — fallback for legacy proposals without current_step */}
            {!currentStep && (() => {
              let rooms = [];
              try { rooms = proposal.rooms_json ? (typeof proposal.rooms_json === 'string' ? JSON.parse(proposal.rooms_json) : proposal.rooms_json) : []; } catch {}
              if (!rooms.length) return null;
              return (
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                  <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">{t('proposalDetail.selectedRoomsAndDevices', 'Selected Rooms & Devices')}</h2>
                  <div className="space-y-3">
                    {rooms.map((room) => {
                      const devices = room.devices || {};
                      const enabled = Object.entries(devices).filter(([, cfg]) => cfg && cfg.enabled);
                      return (
                        <div key={room.id} className="p-3 rounded-xl bg-slate-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-200">{room.name}</span>
                            <span className="text-[11px] text-slate-500">{t('proposalDetail.devicesCount', '{{count}} devices', { count: enabled.length })}</span>
                          </div>
                          {enabled.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {enabled.map(([deviceId, cfg]) => (
                                <span key={deviceId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-[11px] text-indigo-300">
                                  {t(DEVICE_KEYS[deviceId], deviceId.replace(/-/g, " "))} &times;{cfg.quantity || 1}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-600 italic">{t('planner.noDevicesSelected')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Admin Notes */}
            {proposal.admin_notes && (
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">{t('proposalDetail.adminNotes', 'Admin Notes')}</h2>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{proposal.admin_notes}</p>
              </div>
            )}

            {/* Additional Notes */}
            {proposal.additional_notes && (
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
                <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">{t('proposalDetail.customerNotes', 'Customer Notes')}</h2>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{proposal.additional_notes}</p>
              </div>
            )}

            {/* Status Timeline */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">{t('proposalDetail.statusTimeline', 'Status Timeline')}</h2>
              {statusHistory.length > 0 ? (
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2.5 top-1 bottom-1 w-px bg-slate-700"></div>
                  {statusHistory.map((entry) => {
                    const colors = STATUS_COLORS[entry.to_status] || STATUS_COLORS["New"];
                    return (
                      <div key={entry.id} className="relative">
                        <div className={`absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-800 ${colors.dot}`}></div>
                        <div className="text-xs">
                          <span className={`font-semibold ${colors.text}`}>{t(STATUS_KEYS[entry.to_status], entry.to_status)}</span>
                          {entry.from_status && (
                            <span className="text-slate-500"> ({t('proposalDetail.fromStatus', 'from {{status}}', { status: t(STATUS_KEYS[entry.from_status], entry.from_status) })})</span>
                          )}
                          <div className="text-slate-500 text-[10px] mt-0.5">
                            {formatDateTime(entry.created_at)}
                            {entry.notes && <span className="ml-2 text-slate-400">- {entry.notes}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">{t('proposalDetail.noHistory', 'No status history available')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{t('proposalDetail.contactCustomer', 'Contact Customer')}</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('proposalDetail.nameLabel', 'Name')}</span>
                <span className="text-slate-200">{proposal.full_name}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('common.email')}</span>
                <a href={`mailto:${proposal.email}`} className="text-indigo-400 hover:text-indigo-300 text-sm">{proposal.email}</a>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('common.phone')}</span>
                <a href={`tel:${proposal.phone}`} className="text-slate-200 hover:text-white text-sm">{proposal.phone || t('proposalDetail.notProvided', 'Not provided')}</a>
              </div>
              {proposal.city && (
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{t('planner.city')}</span>
                  <span className="text-slate-200 text-sm">{proposal.city}</span>
                </div>
              )}
            </div>
            <button onClick={() => setShowContactModal(false)}
              className="mt-4 w-full px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition">
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNotesModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{t('proposalDetail.adminNotes', 'Admin Notes')}</h3>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
              rows={5} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500/50"
              placeholder={t('proposalDetail.notesPlaceholder', 'Add notes about this proposal...')} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition">
                {t('common.cancel')}
              </button>
              <button onClick={handleSaveNotes}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition">
                {t('proposalDetail.saveNotes', 'Save Notes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site Visit Modal */}
      {showSiteVisitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSiteVisitModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{t('proposalDetail.scheduleSiteVisit', 'Schedule Site Visit')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('proposalDetail.selectVisitDate', 'Select a date for the site visit:')}</p>
            <input type="date" value={siteVisitDate} onChange={(e) => setSiteVisitDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500/50" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowSiteVisitModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition">
                {t('common.cancel')}
              </button>
              <button onClick={handleSaveSiteVisit}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition">
                {t('proposalDetail.saveAndUpdateStatus', 'Save & Update Status')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Modal */}
      {showQuotationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQuotationModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{t('proposalDetail.setQuotation', 'Set Quotation Amount')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('proposalDetail.enterQuotation', 'Enter the quotation amount for this proposal:')}</p>
            <input type="number" step="0.01" min="0" value={quotationAmount} onChange={(e) => setQuotationAmount(e.target.value)}
              placeholder={t('proposalDetail.enterAmount', 'Enter amount')}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500/50" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowQuotationModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition">
                {t('common.cancel')}
              </button>
              <button onClick={handleSaveQuotation}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition">
                {t('proposalDetail.saveAndMarkPrepared', 'Save & Mark Prepared')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Admin Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{t('proposalDetail.assignAdmin', 'Assign Admin')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('proposalDetail.assignAdminHint', 'Enter the admin ID or email to assign:')}</p>
            <input type="text" value={assignedAdmin} onChange={(e) => setAssignedAdmin(e.target.value)}
              placeholder={t('proposalDetail.assignAdminPlaceholder', 'Admin ID or email')}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500/50" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition">
                {t('common.cancel')}
              </button>
              <button onClick={handleAssignAdmin}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition">
                {t('proposalDetail.assign', 'Assign')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}