import React, { useEffect, useState } from "react";
import { X, MapPin, Truck, Hash, Calendar, CreditCard, Package, User, Mail, Phone, Loader2, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import SafeImage from "../../components/SafeImage.jsx";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_FLOW = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: Package },
  { key: "processing", label: "Processing", icon: Loader2 },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Check },
  { key: "delivery_failed", label: "Delivery Failed", icon: X },
  { key: "cancelled", label: "Cancelled", icon: X },
];

const STATUS_CONFIG = {
  pending: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  confirmed: { color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  processing: { color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  packed: { color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  shipped: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  in_transit: { color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  out_for_delivery: { color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  delivered: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  delivery_failed: { color: "text-red-400 bg-red-500/10 border-red-500/20" },
  cancelled: { color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

export default function ShippingDetailModal({ shipment, onClose }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!shipment) return null;

  const getCurrentStepIndex = () => {
    if (shipment.status === "cancelled") return -1;
    if (shipment.status === "delivery_failed") return 8;
    if (shipment.status === "delivered") return 7;
    return STATUS_FLOW.findIndex((s) => s.key === shipment.status);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const copyOrderNumber = () => {
    if (!shipment.order_number) return;
    navigator.clipboard.writeText(shipment.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStatus = STATUS_FLOW.find((s) => s.key === shipment.status);
  const StatusIcon = currentStatus?.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Truck size={20} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Shipment Details</h2>
                <p className="text-xs text-slate-400">Order #{shipment.order_number || shipment.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status & Order Info */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border ${STATUS_CONFIG[shipment.status]?.color || STATUS_CONFIG.pending.color}`}>
                    {StatusIcon && (
                      <StatusIcon size={14} className="text-white" />
                    )}
                    {currentStatus?.label || shipment.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white">{shipment.order_number || `#${shipment.id}`}</span>
                    <button
                      onClick={copyOrderNumber}
                      className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
                      title="Copy Order Number"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-400" />
                    Shipping Timeline
                  </h3>
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-slate-800" />
                    <div className="space-y-4">
                      {STATUS_FLOW.map((step, index) => {
                        const trackingEntry = shipment.trackingHistory?.find(e => e.status === step.key);
                        const currentStep = getCurrentStepIndex();
                        const isCompleted = currentStep >= index;
                        const isCurrent = currentStep === index;

                        return (
                          <div key={step.key} className="relative flex gap-4 items-start">
                            <div className="relative z-10 shrink-0">
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                isCompleted 
                                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10" 
                                  : "bg-slate-950 border-slate-800 text-slate-600"
                              } ${isCurrent ? "ring-4 ring-indigo-600/20 border-indigo-400 scale-105" : ""}`}>
                                <step.icon size={16} className={isCompleted ? "text-white" : "text-slate-600"} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <p className={`text-sm font-bold ${isCompleted ? "text-white" : "text-slate-500"}`}>
                                  {step.label}
                                </p>
                                {trackingEntry && (
                                  <span className="text-xs font-mono text-slate-400">
                                    {formatDate(trackingEntry.timestamp || trackingEntry.created_at)}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-1 ${isCompleted ? "text-slate-400" : "text-slate-600"}`}>
                                {trackingEntry?.description || `Waiting for ${step.label.toLowerCase()}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Shipping Info */}
                <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Truck size={16} className="text-indigo-400" />
                    Shipment Info
                  </h4>
                  <div className="space-y-3 text-sm">
                    {shipment.shipping_method && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Method</span>
                        <span className="text-white capitalize">{shipment.shipping_method}</span>
                      </div>
                    )}
                    {shipment.shipping_provider && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Provider</span>
                        <span className="text-white">{shipment.shipping_provider}</span>
                      </div>
                    )}
                    {shipment.tracking_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tracking</span>
                        <span className="font-mono text-indigo-400">{shipment.tracking_number}</span>
                      </div>
                    )}
                    {shipment.estimated_delivery && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">ETA</span>
                        <span className="text-white">{formatDate(shipment.estimated_delivery)}</span>
                      </div>
                    )}
                    {shipment.shipped_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shipped</span>
                        <span className="text-white">{formatDate(shipment.shipped_at)}</span>
                      </div>
                    )}
                    {shipment.out_for_delivery_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Out for Delivery</span>
                        <span className="text-white">{formatDate(shipment.out_for_delivery_at)}</span>
                      </div>
                    )}
                    {shipment.delivered_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Delivered</span>
                        <span className="text-white">{formatDate(shipment.delivered_at)}</span>
                      </div>
                    )}
                    {shipment.failed_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Failed</span>
                        <span className="text-white">{formatDate(shipment.failed_at)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-800 pt-3">
                      <span className="text-slate-400">Shipping Charge</span>
                      <span className="text-white font-semibold">{formatCurrency(shipment.shipping_charge)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <CreditCard size={16} className="text-indigo-400" />
                    Payment
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Method</span>
                      <span className="text-white capitalize">{shipment.payment_method === "online" ? "Online Payment" : "Cash on Delivery"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className={`font-medium ${shipment.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                        {shipment.payment_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total</span>
                      <span className="text-white font-bold">{formatCurrency(shipment.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Address */}
            <div className="grid gap-4 md:grid-cols-2 border-t border-slate-800 pt-6">
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <User size={16} className="text-indigo-400" />
                  Customer Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Name</span>
                    <p className="text-white">{shipment.customer_name || shipment.guest_name || "Guest"}</p>
                  </div>
                  {shipment.customer_email && (
                    <div>
                      <span className="text-slate-400">Email</span>
                      <p className="text-white">{shipment.customer_email}</p>
                    </div>
                  )}
                  {shipment.customer_phone && (
                    <div>
                      <span className="text-slate-400">Phone</span>
                      <p className="text-white">{shipment.customer_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-400" />
                  Shipping Address
                </h4>
                <div className="space-y-1 text-sm text-slate-300">
                  <p>{shipment.delivery_address || shipment.guest_address || "-"}</p>
                  <p>
                    {shipment.guest_city || shipment.customer_city || "-"}
                    {shipment.guest_state || shipment.customer_state ? `, ${shipment.guest_state || shipment.customer_state}` : ""}
                    {shipment.guest_pincode || shipment.customer_pincode ? ` - ${shipment.guest_pincode || shipment.customer_pincode}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            {shipment.items && shipment.items.length > 0 && (
              <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Package size={16} className="text-indigo-400" />
                  Order Items ({shipment.items.length})
                </h4>
                <div className="space-y-3">
                  {shipment.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-slate-900/50 border border-slate-800/50 rounded-xl p-3">
                      <div className="h-12 w-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                        {item.product_image && (
                          <SafeImage
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                            fallback={<div className="flex h-full items-center justify-center text-slate-600 text-xs">No Image</div>}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.product_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Qty: {item.quantity} × {formatCurrency(item.price || item.final_price)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-white">
                        {formatCurrency((parseFloat(item.price || item.final_price || 0) * (item.quantity || 0)))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}