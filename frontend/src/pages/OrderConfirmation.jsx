import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { orderService } from "../services/api";
import {
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  Clock,
  Copy,
  Check,
  ArrowRight,
  Truck,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Hash,
  User,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import SafeImage from "../components/SafeImage.jsx";
import { formatCurrency } from "../utils/currency.js";

export default function OrderConfirmation({ token }) {
  const location = useLocation();
  const order = location.state?.order;
  const [copied, setCopied] = React.useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = React.useState(false);

  if (!order) return <Navigate to="/" replace />;

  const {
    order_number,
    tracking_number,
    invoice_number,
    payment_method,
    payment_status,
    total_amount,
    status,
    guest_name,
    guest_email,
    guest_phone,
    guest_city,
    guest_state,
    guest_pincode,
    delivery_address,
    items = [],
    created_at,
    estimated_delivery,
  } = order;

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = token
        ? await orderService.downloadUserInvoice(order.id)
        : await orderService.downloadGuestInvoice(
            order_number,
            guest_email || "",
          );

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice_number || order_number || "invoice"}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.warn("Invoice download failed:", error);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Upgraded Status Configuration matching Premium Palette Architecture
  const statusConfig = {
    pending: {
      label: "Pending System Release",
      bg: "bg-amber-400/10",
      border: "border-amber-400/30",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
    confirmed: {
      label: "Order Confirmed",
      bg: "bg-indigo-600/10",
      border: "border-indigo-600/30",
      text: "text-indigo-400",
      dot: "bg-indigo-500",
    },
    processing: {
      label: "Allocation Engine",
      bg: "bg-indigo-600/10",
      border: "border-indigo-600/30",
      text: "text-indigo-400",
      dot: "bg-indigo-500",
    },
    packed: {
      label: "Manifest Layer Ready",
      bg: "bg-indigo-600/10",
      border: "border-indigo-600/30",
      text: "text-indigo-400",
      dot: "bg-indigo-400",
    },
    shipped: {
      label: "In Transit Route",
      bg: "bg-indigo-600/10",
      border: "border-indigo-600/30",
      text: "text-indigo-400",
      dot: "bg-indigo-400",
    },
    out_for_delivery: {
      label: "Last-Mile Distribution",
      bg: "bg-amber-400/10",
      border: "border-amber-400/30",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
    delivered: {
      label: "Fulfillment Complete",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      dot: "bg-emerald-500",
    },
    cancelled: {
      label: "Pipeline Terminated",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      dot: "bg-red-500",
    },
  };

  const sc = statusConfig[status] || statusConfig.pending;

  const formatDate = (d) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  const formatDeliveryDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  const subtotal = items.reduce(
    (s, i) => s + parseFloat(i.price || 0) * Number(i.quantity || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      {/* ── Premium High-Tech Background Aesthetics ────────────────── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.15] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-600/10 via-transparent to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Top Dynamic Header / Hero Area ─────────────────────────── */}
      <div className="relative pt-12 pb-8 border-b border-slate-900/60 bg-slate-950/40 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Left Column: Authentic Thank You Core Branding */}
            <div className="flex items-start gap-5 animate-[fadeIn_0.6s_ease-out]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center flex-shrink-0 relative shadow-[0_0_30px_rgba(79,70,229,0.25)] border border-indigo-400/20 group">
                <CheckCircle
                  size={32}
                  className="text-white animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]"
                />
                <div className="absolute -inset-1 bg-indigo-600 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
                  <Sparkles
                    size={10}
                    className="text-amber-400 fill-amber-400"
                  />{" "}
                  Transaction Authorized
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  Thank you for your order
                </h1>
                <p className="text-slate-400 text-sm mt-1.5 font-medium max-w-xl">
                  Your platform request has been successfully finalized. System
                  provisioning logs have been updated.
                </p>
              </div>
            </div>

            {/* Right Column: High-End Crypto/Tech Styled Receipt Info Card */}
            <div className="w-full md:w-auto relative group animate-[fadeIn_0.8s_ease-out]">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-800 via-indigo-600/30 to-slate-800 rounded-2xl opacity-70" />
              <div className="relative bg-slate-900 rounded-2xl px-6 py-5 min-w-[280px] border border-slate-800/80 shadow-2xl">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order System Key
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${sc.bg} ${sc.border} ${sc.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`}
                    />
                    {sc.label}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2.5 font-mono">
                  <span className="text-sm font-bold text-white tracking-wide">
                    {order_number}
                  </span>
                  <button
                    onClick={copyOrderNumber}
                    className="p-1.5 rounded-md bg-slate-900 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 border border-slate-800/80 hover:border-indigo-500/30 transition-all duration-300"
                    title="Copy System Key"
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>

                {created_at && (
                  <p className="text-[11px] text-slate-500 mt-3 font-semibold flex items-center gap-1.5 justify-end">
                    <Clock size={12} className="text-slate-600" /> System Date:{" "}
                    {formatDate(created_at)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Secure System Strip */}
          <div className="mt-8 pt-4 border-t border-slate-900/60 flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              { icon: ShieldCheck, text: "SSL Secure Platform Handshake" },
              { icon: Truck, text: "3–5 Operational Express Pipeline" },
              { icon: Mail, text: "Automated Cryptographic Invoice Sent" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wide"
              >
                <Icon
                  size={14}
                  className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                />{" "}
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid Content Matrix ─────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── LEFT FRAME MATRIX ────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Matrix Frame 1: Shipping Parameters */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-600 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-800/50 bg-slate-900/50">
                <MapPin size={16} className="text-indigo-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Logistics & Destination Parameters
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-6 sm:grid-cols-2 mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                      Primary Consignee
                    </p>
                    <div className="flex items-center gap-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <User size={15} className="text-indigo-400" />
                      </div>
                      <p className="font-bold text-white text-sm tracking-tight">
                        {guest_name || "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                      Comms Endpoint
                    </p>
                    <div className="space-y-1.5 bg-slate-950 border border-slate-800/80 rounded-xl p-3 h-[62px] flex flex-col justify-center">
                      {guest_email && (
                        <p className="text-xs text-slate-300 font-medium flex items-center gap-2 truncate">
                          <Mail size={12} className="text-indigo-500" />{" "}
                          {guest_email}
                        </p>
                      )}
                      {guest_phone && (
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                          <Phone size={12} className="text-indigo-500" />{" "}
                          {guest_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 relative">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                    Routing Physical Address
                  </p>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    {delivery_address || "—"}
                  </p>
                  <p className="text-xs text-indigo-400 font-bold tracking-wide mt-2 flex items-center gap-1">
                    <ChevronRight size={12} className="text-amber-400" />
                    {[guest_city, guest_state, guest_pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Matrix Frame 2: Order Core Manifest Line Items */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-600 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-800/50 bg-slate-900/50">
                <Package size={16} className="text-indigo-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Itemized Hardware Manifest
                </h2>
              </div>

              <div className="divide-y divide-slate-800/40 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {items.map((item) => (
                  <div
                    key={item.product_id || item.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-950/30 transition-colors duration-200"
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 flex-shrink-0 p-1 flex items-center justify-center">
                      {item.product_image ? (
                        <SafeImage
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-contain filter brightness-95 contrast-105"
                          fallback={
                            <div className="flex h-full items-center justify-center text-slate-600">
                              <Package size={18} />
                            </div>
                          }
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-600">
                          <Package size={18} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm tracking-tight truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-slate-400 font-medium mt-1 font-mono">
                        QTY{" "}
                        <span className="text-indigo-400 font-bold">
                          {item.quantity}
                        </span>{" "}
                        × {formatCurrency(item.price)}
                      </p>
                    </div>

                    <p className="text-sm font-black text-white font-mono tracking-tight flex-shrink-0">
                      {formatCurrency(parseFloat(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Aggregation Frame Block */}
              <div className="px-6 py-5 border-t border-slate-800/60 bg-slate-950/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Subtotal Stream</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">
                    Pipeline Transport Route
                  </span>
                  <span className="font-black text-amber-400 tracking-wider text-[10px] bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    FREE FREIGHT
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                  <span className="text-sm font-black text-white uppercase tracking-wider">
                    Gross Total Settled
                  </span>
                  <span className="text-xl font-black text-indigo-400 font-mono drop-shadow-[0_0_15px_rgba(129,140,248,0.2)]">
                    {formatCurrency(total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT CONTROL MATRIX PANEL ───────────────────────────── */}
          <div className="space-y-4">
            {/* Control Element 1: High Priority Link Track CTA */}
            <Link
              to="/track-order"
              state={{ order_number, contact: guest_email }}
              className="flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/80 rounded-2xl px-5 py-4 transition-all duration-300 group shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <Truck
                    size={20}
                    className="text-indigo-400 group-hover:text-white transition-colors duration-300"
                  />
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-tight">
                    Telemetry Pipeline
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Real-time status tracking active
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-indigo-500 group-hover:translate-x-1.5 transition-transform duration-300"
              />
            </Link>

            {/* Control Element 2: Financial/Invoice Matrix Details */}
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl shadow-xl overflow-hidden relative group">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-800/50 bg-slate-900/50">
                <CreditCard size={15} className="text-indigo-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Payment Metrics
                </h3>
              </div>
              <div className="p-5 space-y-3.5 font-medium">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Gateway Method</span>
                  <span className="font-bold text-slate-200">
                    {payment_method === "online"
                      ? "Digital Network Token"
                      : "Cash Settlement Layer"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Ledger Status</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-md text-[11px] border ${
                      payment_status === "paid"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-400/10 border-amber-400/30 text-amber-400"
                    }`}
                  >
                    {payment_status === "paid" ? "Cleared" : "Pending Sync"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Captured Amount</span>
                  <span className="font-bold text-indigo-400 font-mono">
                    {formatCurrency(total_amount)}
                  </span>
                </div>

                {(invoice_number || tracking_number) && (
                  <div className="border-t border-slate-800/50 pt-3.5 space-y-3" />
                )}

                {invoice_number && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Invoice Hash</span>
                    <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                      {invoice_number}
                    </span>
                  </div>
                )}
                {tracking_number && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tracking Node</span>
                    <span className="font-mono text-[11px] font-bold text-indigo-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                      {tracking_number}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Control Element 3: Delivery Window Prediction */}
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 relative group overflow-hidden">
              <div className="absolute inset-0 bg-indigo-600/[0.02] pointer-events-none" />
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-indigo-400" />
                <p className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                  Estimated Fulfillment Window
                </p>
              </div>
              <p className="text-lg font-black text-white tracking-tight">
                {formatDeliveryDate(estimated_delivery) ||
                  "3–5 System Business Days"}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Standard processing matrix applied nationwide.
              </p>
            </div>

            {/* Control Element 4: Secondary Order Lifecycle Placement Log */}
            {created_at && (
              <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Node Placement Complete
                  </p>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">
                    {formatDate(created_at)}
                  </p>
                </div>
              </div>
            )}

            {/* Action CTAs Area */}
            <div className="pt-2 space-y-3">
              <Link
                to="/track-order"
                state={{
                  tracking_number: tracking_number || "",
                  order_number,
                  contact: guest_email || "",
                }}
                className="flex items-center justify-center gap-2 w-full bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300 font-bold text-sm rounded-xl py-3 transition-colors duration-300 shadow-sm"
              >
                <Truck size={15} className="text-indigo-500" /> Track Order
              </Link>

              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="flex items-center justify-center gap-2 w-full bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300 font-bold text-sm rounded-xl py-3 transition-colors duration-300 shadow-sm disabled:opacity-60"
              >
                <CreditCard size={15} className="text-indigo-500" />
                {downloadingInvoice
                  ? "Preparing Invoice..."
                  : "Download Invoice"}
              </button>

              <Link
                to="/shop"
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl py-4 transition-all duration-300 shadow-[0_4px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-[0.98]"
              >
                Continue Shopping <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
