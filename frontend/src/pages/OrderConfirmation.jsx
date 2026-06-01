import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  CheckCircle, Package, MapPin, CreditCard, Clock,
  Copy, Check, ArrowRight, Truck, ShieldCheck,
  Mail, Phone, Calendar, Hash, User
} from "lucide-react";
import SafeImage from "../components/SafeImage.jsx";
import { formatCurrency } from "../utils/currency.js";

export default function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;
  const [copied, setCopied] = React.useState(false);

  if (!order) return <Navigate to="/" replace />;

  const {
    order_number, tracking_number, invoice_number,
    payment_method, payment_status, total_amount, status,
    guest_name, guest_email, guest_phone,
    guest_city, guest_state, guest_pincode,
    delivery_address, items = [], created_at, estimated_delivery,
  } = order;

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    pending:          { label: "Pending",          bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-400"   },
    confirmed:        { label: "Confirmed",         bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-500"    },
    processing:       { label: "Processing",        bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
    packed:           { label: "Packed",            bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  dot: "bg-purple-500"  },
    shipped:          { label: "Shipped",           bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-500"  },
    out_for_delivery: { label: "Out for Delivery",  bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  dot: "bg-orange-400"  },
    delivered:        { label: "Delivered",         bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
    cancelled:        { label: "Cancelled",         bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500"     },
  };

  const sc = statusConfig[status] || statusConfig.pending;

  const formatDate = (d) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return d; }
  };

  const formatDeliveryDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        weekday: "long", month: "long", day: "numeric",
      });
    } catch { return null; }
  };

  const subtotal = items.reduce(
    (s, i) => s + parseFloat(i.price || 0) * Number(i.quantity || 0), 0
  );

  return (
    <div className="min-h-screen bg-[#f1f3f6] font-sans antialiased selection:bg-blue-600 selection:text-white">

      {/* ── Success Hero Banner ─────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white pt-10 pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

            {/* Left: success message */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={28} className="text-emerald-300" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                  ✓ Order Confirmed
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  Thank you for your purchase!
                </h1>
                <p className="text-blue-200 text-sm mt-1 font-medium max-w-md">
                  Your order has been received and will be processed shortly.
                </p>
              </div>
            </div>

            {/* Right: order number card */}
            <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4 min-w-[220px]">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Order Number</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-white font-mono tracking-wide">{order_number}</p>
                <button
                  onClick={copyOrderNumber}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white transition"
                  title="Copy order number"
                >
                  {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>
              {created_at && (
                <p className="text-xs text-blue-300 mt-2 font-medium">
                  Placed on {formatDate(created_at)}
                </p>
              )}
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-6 flex flex-wrap gap-5">
            {[
              { icon: ShieldCheck, text: "SSL Secured Payment" },
              { icon: Truck,       text: "3–5 Day Delivery" },
              { icon: Mail,        text: "Invoice Sent to Email" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs font-semibold text-blue-200">
                <Icon size={13} className="text-amber-400" /> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

          {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Shipping Details */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <MapPin size={15} className="text-blue-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Shipping Details</h2>
              </div>
              <div className="p-5">
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Recipient</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{guest_name || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Contact</p>
                    <div className="space-y-1">
                      {guest_email && (
                        <p className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                          <Mail size={12} className="text-blue-500" /> {guest_email}
                        </p>
                      )}
                      {guest_phone && (
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                          <Phone size={12} className="text-blue-500" /> {guest_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Delivery Address</p>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{delivery_address || "—"}</p>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">
                    {[guest_city, guest_state, guest_pincode].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <Package size={15} className="text-blue-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Order Summary</h2>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.product_id || item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0">
                      {item.product_image ? (
                        <SafeImage
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-contain p-1 mix-blend-multiply"
                          fallback={<div className="flex h-full items-center justify-center text-slate-400"><Package size={18} /></div>}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400"><Package size={18} /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.product_name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Qty {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-slate-900 flex-shrink-0">
                      {formatCurrency(parseFloat(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Delivery</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-base font-black text-slate-900">Total Paid</span>
                  <span className="text-xl font-black text-blue-700">{formatCurrency(total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Track Order CTA */}
            <Link
              to="/track-order"
              state={{ order_number, contact: guest_email }}
              className="flex items-center justify-between bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl px-5 py-4 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Truck size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Track This Order</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Use your order number</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Payment Info */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <CreditCard size={15} className="text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Payment</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Method</span>
                  <span className="font-bold text-slate-900">
                    {payment_method === "online" ? "Online Payment" : "Cash on Delivery"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs border ${
                    payment_status === "paid"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    {payment_status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Amount</span>
                  <span className="font-black text-blue-700">{formatCurrency(total_amount)}</span>
                </div>
                {invoice_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Invoice</span>
                    <span className="font-mono text-xs font-bold text-slate-600">{invoice_number}</span>
                  </div>
                )}
                {tracking_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Tracking #</span>
                    <span className="font-mono text-xs font-bold text-indigo-600">{tracking_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Estimate */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-blue-600" />
                <p className="text-sm font-black text-blue-800">Estimated Delivery</p>
              </div>
              <p className="text-base font-black text-slate-900">
                {formatDeliveryDate(estimated_delivery) || "3–5 Business Days"}
              </p>
              <p className="text-xs text-blue-600 font-medium mt-1">
                Standard delivery across India
              </p>
            </div>

            {/* Order Date */}
            {created_at && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Calendar size={15} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Order Placed</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formatDate(created_at)}</p>
                </div>
              </div>
            )}

            {/* Continue Shopping CTA */}
            <Link
              to="/shop"
              className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl py-4 transition-colors shadow-md hover:shadow-amber-500/30 hover:shadow-lg active:scale-[0.98]"
            >
              Continue Shopping <ArrowRight size={16} />
            </Link>

            {/* My Orders link */}
            <Link
              to="/orders"
              className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-bold text-sm rounded-xl py-3 transition-colors shadow-sm"
            >
              <Package size={15} /> View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
