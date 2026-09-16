import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RotateCcw, Loader2, CheckCircle2, XCircle, RefreshCcw, Clock, ShieldCheck, Info,
  AlertCircle, Banknote, Smartphone, CreditCard,
} from "lucide-react";
import { orderService } from "../services/api";
import { useToast } from "./Toast.jsx";
import { getErrorMessage } from "../utils/backendMessageMapper.js";

const STATUS_STYLE = {
  pending: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  approved: "text-cyan-300 bg-cyan-500/10 border-cyan-500/25",
  rejected: "text-rose-300 bg-rose-500/10 border-rose-500/25",
  product_received: "text-blue-300 bg-blue-500/10 border-blue-500/25",
  refund_processing: "text-indigo-300 bg-indigo-500/10 border-indigo-500/25",
  refunded: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
};

const REFUND_STATUS_STYLE = {
  pending: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  processing: "text-indigo-300 bg-indigo-500/10 border-indigo-500/25",
  completed: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  failed: "text-rose-300 bg-rose-500/10 border-rose-500/25",
  details_submitted: "text-cyan-300 bg-cyan-500/10 border-cyan-500/25",
  details_required: "text-amber-300 bg-amber-500/10 border-amber-500/25",
};

const STATUS_LABELS = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
  product_received: "statusProductReceived",
  refund_processing: "statusRefundProcessing",
  refunded: "statusRefunded",
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  product_received: ShieldCheck,
  refund_processing: RefreshCcw,
  refunded: CheckCircle2,
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const maskAccountNumber = (num) => {
  if (!num) return "-";
  const s = String(num);
  return `****${s.slice(-4)}`;
};

const isCodOrder = (order) => {
  const method = String(order?.payment_method || "").toLowerCase();
  return ["cod", "cash_on_delivery"].includes(method);
};

export default function ReturnRequestSection({ order, onRefresh }) {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // COD refund details form state
  const [codSubmitting, setCodSubmitting] = useState(false);
  const [refundMethod, setRefundMethod] = useState(""); // "upi" or "bank"
  const [upiId, setUpiId] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

  const returnRequest = order?.returnRequest;

  const eligibleForRequest =
    !!returnRequest === false &&
    order?.status !== "cancelled" &&
    order?.status !== "pending";

  const submitReturn = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast(t("returns.returnReason") + " required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await orderService.requestReturn(order.id, {
        reason: reason.trim(),
        details: details.trim(),
      });
      addToast(res?.message || t("returns.requestReturn"), "success");
      setReason("");
      setDetails("");
      if (typeof onRefresh === "function") onRefresh();
    } catch (err) {
      addToast(getErrorMessage(err, t, "common.somethingWentWrong"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const submitCodDetails = async (e) => {
    e.preventDefault();
    if (!refundMethod) {
      addToast("Please select a refund method", "error");
      return;
    }
    if (refundMethod === "upi") {
      if (!upiId.trim()) {
        addToast("UPI ID is required", "error");
        return;
      }
      if (!upiId.includes("@")) {
        addToast("Invalid UPI ID format (must contain @)", "error");
        return;
      }
    } else {
      if (!accountHolderName.trim()) {
        addToast("Account holder name is required", "error");
        return;
      }
      if (!accountNumber.trim()) {
        addToast("Account number is required", "error");
        return;
      }
      if (!ifscCode.trim()) {
        addToast("IFSC code is required", "error");
        return;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase())) {
        addToast("Invalid IFSC code format", "error");
        return;
      }
      if (!bankName.trim()) {
        addToast("Bank name is required", "error");
        return;
      }
    }
    setCodSubmitting(true);
    try {
      const res = await orderService.submitCodRefundDetails(order.id, {
        refund_method: refundMethod,
        upi_id: refundMethod === "upi" ? upiId : undefined,
        account_holder_name: refundMethod === "bank" ? accountHolderName : undefined,
        account_number: refundMethod === "bank" ? accountNumber : undefined,
        ifsc_code: refundMethod === "bank" ? ifscCode : undefined,
        bank_name: refundMethod === "bank" ? bankName : undefined,
      });
      addToast(res?.message || "Refund details submitted", "success");
      setRefundMethod("");
      setUpiId("");
      setAccountHolderName("");
      setAccountNumber("");
      setIfscCode("");
      setBankName("");
      if (typeof onRefresh === "function") onRefresh();
    } catch (err) {
      addToast(getErrorMessage(err, t, "common.somethingWentWrong"), "error");
    } finally {
      setCodSubmitting(false);
    }
  };

  // Helper: determine if order is COD
  const codOrder = isCodOrder(order);

  // Helper: determine COD refund status
  const codRefundStatus = returnRequest?.refund_status;
  const codRefundMethod = returnRequest?.refund_method;

  // Show existing return request
  if (returnRequest) {
    const StatusIcon = STATUS_ICONS[returnRequest.status] || Clock;
    const normalizedStatus = returnRequest.status;

    return (
      <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <RotateCcw size={18} className="text-cyan-400" />
          {t("returns.returnStatus")}
        </h2>

        <div className="mt-5 rounded-3xl bg-white/5 p-5">
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${STATUS_STYLE[normalizedStatus] || STATUS_STYLE.pending}`}>
            <StatusIcon size={14} />
            {t(`returns.${STATUS_LABELS[normalizedStatus] || "statusPending"}`)}
          </span>

          {/* COD Refund Details Section */}
          {codOrder && normalizedStatus === "approved" && (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={18} className="text-amber-400" />
                  <p className="text-sm font-semibold text-amber-300">
                    {codRefundStatus === "details_submitted"
                      ? t("returns.refundDetailsSubmitted")
                      : t("returns.refundDetailsRequired")}
                  </p>
                </div>

                {codRefundStatus === "details_submitted" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">{t("returns.refundMethod")}</p>
                        <p className="font-medium text-white capitalize">{codRefundMethod}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t("returns.refundStatus")}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${REFUND_STATUS_STYLE[codRefundStatus] || REFUND_STATUS_STYLE.pending}`}>
                          {t(`returns.${codRefundStatus === "details_submitted" ? "refundDetailsSubmitted" : "refundDetailsRequired"}`)}
                        </span>
                      </div>
                    </div>
                    {codRefundMethod === "upi" && returnRequest.upi_id && (
                      <div>
                        <p className="text-xs text-gray-500">{t("returns.upiId")}</p>
                        <p className="font-mono text-sm text-white break-all">{returnRequest.upi_id}</p>
                      </div>
                    )}
                    {codRefundMethod === "bank" && (
                      <div className="space-y-2">
                        {returnRequest.account_holder_name && (
                          <div>
                            <p className="text-xs text-gray-500">{t("returns.accountHolderName")}</p>
                            <p className="text-sm text-white">{returnRequest.account_holder_name}</p>
                          </div>
                        )}
                        {returnRequest.account_number && (
                          <div>
                            <p className="text-xs text-gray-500">{t("returns.accountNumber")}</p>
                            <p className="font-mono text-sm text-white">{maskAccountNumber(returnRequest.account_number)}</p>
                          </div>
                        )}
                        {returnRequest.ifsc_code && (
                          <div>
                            <p className="text-xs text-gray-500">{t("returns.ifscCode")}</p>
                            <p className="font-mono text-sm text-white">{returnRequest.ifsc_code}</p>
                          </div>
                        )}
                        {returnRequest.bank_name && (
                          <div>
                            <p className="text-xs text-gray-500">{t("returns.bankName")}</p>
                            <p className="text-sm text-white">{returnRequest.bank_name}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      {t("returns.submittedOn")} {formatDate(returnRequest.refund_details_submitted_at)}
                    </p>
                  </div>
                ) : (
                  <CodRefundDetailsForm
                    onSubmit={submitCodDetails}
                    submitting={codSubmitting}
                    refundMethod={refundMethod}
                    setRefundMethod={setRefundMethod}
                    upiId={upiId}
                    setUpiId={setUpiId}
                    accountHolderName={accountHolderName}
                    setAccountHolderName={setAccountHolderName}
                    accountNumber={accountNumber}
                    setAccountNumber={setAccountNumber}
                    ifscCode={ifscCode}
                    setIfscCode={setIfscCode}
                    bankName={bankName}
                    setBankName={setBankName}
                    t={t}
                  />
                )}
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{t("returns.requestedAmount")}</p>
              <p className="mt-1 font-semibold text-white">{formatMoney(returnRequest.requested_amount)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{t("returns.approvedAmount")}</p>
              <p className="mt-1 font-semibold text-emerald-300">
                {returnRequest.approved_amount != null ? formatMoney(returnRequest.approved_amount) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{t("returns.refundStatus")}</p>
              <p className="mt-1 capitalize text-sm font-medium text-white">
                {returnRequest.refund_status ? t(`returns.${returnRequest.refund_status === "processing" ? "refundPending" : "refundCompleted"}`) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{t("returns.requestedOn")}</p>
              <p className="mt-1 text-sm text-gray-300">{formatDate(returnRequest.requested_at)}</p>
            </div>
          </div>

          {returnRequest.reason && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{t("returns.returnReason")}</p>
              <p className="mt-1 text-sm text-gray-300">{returnRequest.reason}</p>
            </div>
          )}
          {returnRequest.details && (
            <div className="mt-2">
              <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{t("returns.requestDetails")}</p>
              <p className="mt-1 text-sm text-gray-400">{returnRequest.details}</p>
            </div>
          )}
          {returnRequest.rejection_reason && (
            <div className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
              <p className="text-xs font-semibold text-rose-300">{t("returns.rejectionReason")}</p>
              <p className="mt-1 text-sm text-rose-200">{returnRequest.rejection_reason}</p>
            </div>
          )}
          {returnRequest.refund_reference && (
            <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold text-emerald-300">{t("returns.refundReference")}</p>
              <p className="mt-1 font-mono text-xs text-emerald-200 break-all">{returnRequest.refund_reference}</p>
            </div>
          )}
        </div>

        {returnRequest.timeline?.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-white">{t("returns.timeline")}</p>
            <ol className="mt-3 space-y-3 border-l border-white/10 ml-2">
              {returnRequest.timeline.map((entry, i) => (
                <li key={i} className="relative pl-5">
                  <span className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${entry.type === "rejected" ? "bg-rose-400" : entry.type === "refund_completed" ? "bg-emerald-400" : "bg-cyan-400"}`} />
                  <p className="text-sm text-gray-200">{entry.label}</p>
                  {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                  <p className="text-xs text-gray-600 mt-0.5">{formatDate(entry.at)}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  if (!eligibleForRequest) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-6">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <RotateCcw size={18} className="text-cyan-400" />
        {t("returns.requestReturn")}
      </h2>

      <p className="mt-2 text-sm text-gray-400 flex items-center gap-2">
        <Info size={14} className="text-cyan-400" />
        {t("returns.refundPolicy")}
      </p>

      <form onSubmit={submitReturn} className="mt-5 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
            {t("returns.returnReason")} *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-400 [color-scheme:dark]"
            required
          >
            <option value="" disabled>{t("returns.reasonPlaceholder")}</option>
            <option value="Item not as expected">Item not as expected</option>
            <option value="Item damaged or defective">Item damaged or defective</option>
            <option value="Wrong item received">Wrong item received</option>
            <option value="Wrong size received">Wrong size received</option>
            <option value="Changed my mind">Changed my mind</option>
            <option value="Received too late">Received too late</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
            {t("returns.requestDetails")}
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder={t("returns.detailsPlaceholder")}
            className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-400"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-black hover:shadow-xl hover:shadow-cyan-500/30 transition-all disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
          {t("returns.submit")}
        </button>
      </form>
    </div>
  );
}

function CodRefundDetailsForm({
  onSubmit,
  submitting,
  refundMethod,
  setRefundMethod,
  upiId,
  setUpiId,
  accountHolderName,
  setAccountHolderName,
  accountNumber,
  setAccountNumber,
  ifscCode,
  setIfscCode,
  bankName,
  setBankName,
  t,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
          {t("returns.selectRefundMethod")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 cursor-pointer transition ${
            refundMethod === "upi"
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-gray-700 hover:border-gray-500"
          }`}>
            <input
              type="radio"
              name="refund_method"
              value="upi"
              checked={refundMethod === "upi"}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="sr-only"
            />
            <Smartphone size={28} className="text-cyan-400" />
            <span className="font-medium text-white">UPI</span>
            <p className="text-xs text-gray-500 text-center">Enter UPI ID</p>
          </label>
          <label className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 cursor-pointer transition ${
            refundMethod === "bank"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-gray-700 hover:border-gray-500"
          }`}>
            <input
              type="radio"
              name="refund_method"
              value="bank"
              checked={refundMethod === "bank"}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="sr-only"
            />
            <Banknote size={28} className="text-emerald-400" />
            <span className="font-medium text-white">Bank Account</span>
            <p className="text-xs text-gray-500 text-center">Account details</p>
          </label>
        </div>
      </div>

      {refundMethod === "upi" && (
        <div>
          <label className="block text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
            {t("returns.upiId")} *
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="example@upi"
            className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-400"
            required
          />
        </div>
      )}

      {refundMethod === "bank" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
              {t("returns.accountHolderName")} *
            </label>
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
              {t("returns.accountNumber")} *
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="1234567890"
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
              {t("returns.ifscCode")} *
            </label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              placeholder="SBIN0001234"
              maxLength={11}
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
              {t("returns.bankName")} *
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="State Bank of India"
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-400"
              required
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-black hover:shadow-xl hover:shadow-cyan-500/30 transition-all disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        {t("returns.saveRefundDetails")}
      </button>
    </form>
  );
}