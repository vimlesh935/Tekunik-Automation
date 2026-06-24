import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { orderService } from "../services/api";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";
import { 
  Search, Mail, Phone, Package, ArrowLeft, MapPin, Clock, 
  CreditCard, CheckCircle, Loader2, Truck, Copy, Check, Star, Hash, ShieldCheck
} from "lucide-react";

/**
 * Formats a number to Indian currency notation (e.g. ₹50,000)
 */
function formatIndianPrice(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return "₹0";
  const whole = Math.round(num);
  const str = whole.toString();
  const lastThree = str.slice(-3);
  const otherDigits = str.slice(0, -3);
  if (otherDigits === "") return `₹${lastThree}`;
  const formatted = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  return `₹${formatted}`;
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [orderNumber, setOrderNumber] = useState(location.state?.order_number || "");
  const [trackingNumber, setTrackingNumber] = useState(location.state?.tracking_number || "");
  const [contact, setContact] = useState(location.state?.contact || "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState("tracking"); // "tracking" or "order"

   useEffect(() => {
     if (order) {
       const interval = setInterval(() => {
         const payload = order.tracking_number
           ? { tracking_number: order.tracking_number }
           : { order_number: order.order_number, contact: contact.trim() };
         orderService.trackOrder(payload).then((response) => {
           const updated = response.data?.order;
           if (updated) setOrder(updated);
         }).catch(() => {});
       }, 30000);
       return () => clearInterval(interval);
     }
   }, [order]);

  const handleTrack = async (event) => {
    event.preventDefault();
    const trackingNum = trackingNumber.trim();
    const orderNum = orderNumber.trim();
    
    if (mode === "tracking") {
      if (!trackingNum) {
        addToast("Please provide your tracking number.", "warning");
        return;
      }
    } else {
      if (!orderNum || !contact.trim()) {
        addToast("Please provide your order number and email/phone.", "warning");
        return;
      }
    }

    setLoading(true);
    setOrder(null);
    setSearched(false);

    try {
      const payload = mode === "tracking"
        ? { tracking_number: trackingNum }
        : { order_number: orderNum, contact: contact.trim() };
      
      const response = await orderService.trackOrder(payload);
      const orderData = response.data?.order;
      if (!orderData) throw new Error("Order not found.");
      setOrder(orderData);
      setSearched(true);
      addToast("Order found successfully!", "success");
    } catch (error) {
      addToast(error?.message || "Unable to track the order. Please check your details.", "error");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!order) return;
    setRefreshing(true);
    try {
      const payload = order.tracking_number
        ? { tracking_number: order.tracking_number }
        : { order_number: order.order_number, contact: contact.trim() };
      const response = await orderService.trackOrder(payload);
      const updated = response.data?.order;
      if (updated) setOrder(updated);
      addToast("Status refreshed!", "success");
    } catch {
      addToast("Could not refresh status. Try again.", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const copyOrderNumber = () => {
    if (!order?.order_number) return;
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (s) => {
    const colors = {
      pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      confirmed: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      processing: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      shipped: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      out_for_delivery: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
    };
    return colors[s] || colors.pending;
  };

  const getStatusIcon = (s) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      processing: Package,
      shipped: Truck,
      out_for_delivery: Truck,
      delivered: CheckCircle,
      cancelled: Package,
    };
    const Icon = icons[s] || Clock;
    return <Icon size={14} />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const trackingSteps = [
    { key: "pending", label: "Order Confirmed", icon: CheckCircle, desc: "Your order has been placed" },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle, desc: "Order has been confirmed" },
    { key: "processing", label: "Processing", icon: Package, desc: "Items are being processed" },
    { key: "packed", label: "Packed", icon: Package, desc: "Items are packed and ready" },
    { key: "shipped", label: "Shipped", icon: Truck, desc: "Package is on its way" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, desc: "Out for delivery today" },
    { key: "delivered", label: "Delivered", icon: CheckCircle, desc: "Package delivered" },
  ];

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === "cancelled") return -1;
    const statusOrder = ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];
    return statusOrder.indexOf(order.status);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* ═══ TRACK ORDER HERO BANNER ═══ */}
      <section className="relative border-b border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950 pt-10 pb-10 overflow-hidden">
        {/* Tech Grid Backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold px-3 py-1 rounded-full text-xs tracking-wider uppercase mb-4 backdrop-blur-sm">
            <ShieldCheck size={12} className="text-amber-400" /> Secure Verification
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Track Shipment Status
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Track your order status in real time. Enter your tracking or order number below.
          </p>
        </div>
      </section>

      {/* ═══ MAIN TRACKING SECTION ═══ */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Control Desk Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-60" />
          
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Input System */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Track Order</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your tracking number or order number to check the current status.
                </p>
              </div>
              
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setMode("tracking")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === "tracking" 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Hash size={12} className="inline mr-1" /> Tracking Number
                </button>
                <button
                  type="button"
                  onClick={() => setMode("order")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === "order" 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Search size={12} className="inline mr-1" /> Order Number
                </button>
              </div>
              
              <form onSubmit={handleTrack} className="space-y-5">
                {mode === "tracking" ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 block">
                      Tracking Number
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        <Hash size={16} />
                      </div>
                      <input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g., TRK-2026-874521"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono tracking-wider"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Enter your unique tracking number. No contact details needed.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
                        Order Number
                      </label>
                      <div className="relative">
                        <input
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          placeholder="e.g., ORD-12345"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">
                        Associated Contact
                      </label>
                      <input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Email or phone endpoint"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98]"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin text-amber-400" /> Searching...</>
                  ) : (
                    <><Search size={16} className="text-amber-400" /> Track Order</>
                  )}
                </button>
              </form>
            </div>

            {/* How to Track Panel */}
            <div className="rounded-xl bg-slate-950/40 border border-slate-800/80 p-5 flex flex-col justify-between backdrop-blur-sm">
              <div>
                <div className="flex items-center gap-2 text-indigo-400">
                  <Package size={16} className="text-amber-400" />
                  <p className="text-[11px] font-bold uppercase tracking-widest">How to Track</p>
                </div>
                <p className="mt-3 text-slate-400 text-xs leading-relaxed">
                  Use your tracking number for instant updates, or enter your order number with the registered email or phone number.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-2 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-2.5"><Hash size={13} className="text-amber-400" /> Use tracking number for instant lookup</div>
                <div className="flex items-center gap-2.5"><Mail size={13} className="text-indigo-400" /> Order number requires email or phone verification</div>
                <div className="flex items-center gap-2.5"><MapPin size={13} className="text-indigo-400" /> Status updates from the warehouse</div>
              </div>
            </div>
          </div>

          {/* ═══ ORDER RESULTS PANEL ═══ */}
          {order && (
            <div className="mt-10 pt-10 border-t border-slate-800/80 space-y-8 animate-slide-up">
              
               {/* Order Details Grid */}
               <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5 md:p-6 relative">
                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-5">
                   <div>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-1">
                       Order Number
                     </span>
                     <div className="flex items-center gap-2">
                       <h2 className="text-lg font-bold text-white tracking-tight font-mono">{order.order_number}</h2>
                       <button
                         onClick={copyOrderNumber}
                         className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                         title="Copy order number"
                       >
                         {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                       </button>
                     </div>
                   </div>
                  
                  <span className={`self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace(/_/g, " ")}
                  </span>

                  <button
                    type="button"
                    onClick={handleRefreshStatus}
                    disabled={refreshing}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50"
                  >
                    {refreshing
                      ? <><Loader2 size={12} className="animate-spin" /> Refreshing...</>
                      : <><Search size={12} /> Refresh Status</>
                    }
                  </button>
                </div>

                 {/* Order Summary Grid */}
                 <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                   <div className="rounded-xl bg-slate-900 border border-slate-800/80 p-4 text-xs">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Customer</p>
                     <p className="text-slate-200 font-bold">{order.guest_name || "Guest"}</p>
                     <p className="text-slate-400 mt-1 truncate">{order.guest_email || ""}</p>
                     <p className="text-indigo-400 font-mono mt-0.5">{order.guest_phone || ""}</p>
                   </div>

                   <div className="rounded-xl bg-slate-900 border border-slate-800/80 p-4 text-xs">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Delivery Address</p>
                     <p className="text-slate-300 font-medium line-clamp-2">{order.delivery_address}</p>
                     <p className="text-slate-400 mt-1">
                       {order.guest_city}{order.guest_state ? `, ${order.guest_state}` : ""} <span className="font-mono text-slate-500">{order.guest_pincode || ""}</span>
                     </p>
                   </div>

                   <div className="rounded-xl bg-slate-900 border border-slate-800/80 p-4 text-xs">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Payment</p>
                     <p className="text-slate-200 font-bold">{order.payment_method === "online" ? "Online Payment" : "Cash on Delivery"}</p>
                     <p className={`text-[10px] uppercase font-mono font-bold tracking-wider mt-2 inline-block px-2 py-0.5 rounded ${
                       order.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                     }`}>
                       {order.payment_status}
                     </p>
                   </div>

                   <div className="rounded-xl bg-slate-900 border border-slate-800/80 p-4 text-xs flex flex-col justify-between">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Amount</p>
                       <p className="text-lg font-extrabold text-white tracking-tight">{formatIndianPrice(order.total_amount)}</p>
                     </div>
                     {order.estimated_delivery && (
                       <p className="text-[10px] text-indigo-400 font-medium mt-2">
                         Est. Delivery: <span className="text-white font-semibold">{new Date(order.estimated_delivery).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                       </p>
                     )}
                   </div>
                 </div>
               </div>

               {/* Tracking Number */}
               {order.tracking_number && (
                 <div className="rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-indigo-500/10 p-4 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                     <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                       <Hash size={16} />
                     </div>
                     <div>
                       <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Tracking Number</p>
                       <p className="text-sm font-bold text-white tracking-wider font-mono">{order.tracking_number}</p>
                     </div>
                   </div>
                   <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">Active</span>
                 </div>
               )}

               {/* Order Timeline */}
               <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                 <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-8">
                   <Truck size={14} className="text-indigo-400" />
                   Order Timeline
                 </h3>

                 {order.status === "cancelled" ? (
                   <div className="text-center py-8">
                     <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-3">
                       <Package size={20} className="text-red-400" />
                     </div>
                     <p className="text-sm font-bold text-slate-200">Order Cancelled</p>
                     <p className="text-xs text-slate-500 mt-1">This order has been cancelled.</p>
                   </div>
                 ) : (
                  <div className="relative">
                    {/* Linear Node Link */}
                    <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-slate-800" />
                    
                    <div className="space-y-6">
                      {(() => {
                        const currentStep = getCurrentStepIndex();
                        return trackingSteps.map((step, index) => {
                          const StepIcon = step.icon;
                          const isCompleted = currentStep >= index;
                          const isCurrent = currentStep === index;
                          
                          const trackingEntry = order.trackingHistory?.find(
                            t => t.status === step.key
                          );

                          return (
                            <div key={step.key} className="relative flex gap-4 items-start">
                              {/* Vector Points */}
                              <div className="relative z-10 shrink-0">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                  isCompleted 
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10" 
                                    : "bg-slate-950 border-slate-800 text-slate-600"
                                } ${isCurrent ? "ring-4 ring-indigo-600/20 border-indigo-400 scale-105" : ""}`}>
                                  <StepIcon size={14} className={isCompleted ? "text-white" : "text-slate-600"} />
                                </div>
                              </div>
                              
                              {/* Data Node Output */}
                              <div className="flex-1 min-w-0 pt-1.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <p className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? "text-white" : "text-slate-500"}`}>
                                    {step.label}
                                  </p>
                                  {trackingEntry && (
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {formatDate(trackingEntry.timestamp || trackingEntry.created_at)}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs mt-1 leading-relaxed ${isCompleted ? "text-slate-400" : "text-slate-600"}`}>
                                  {trackingEntry?.description || step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Estimated Delivery */}
                    {order.estimated_delivery && getCurrentStepIndex() >= 0 && getCurrentStepIndex() < 5 && (
                      <div className="mt-8 rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-0.5">Estimated Delivery</span>
                        <p className="text-sm font-bold text-white font-mono">
                          {new Date(order.estimated_delivery).toLocaleDateString("en-US", {
                            weekday: "long", month: "long", day: "numeric"
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

               {/* Order Items */}
               {order.items && order.items.length > 0 && (
                 <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Order Items</p>
                  <div className="space-y-2.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                        <div className="h-11 w-11 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                          {item.product_image && (
                            <SafeImage
                              src={item.product_image}
                              alt={item.product_name}
                              className="h-full w-full object-cover opacity-85 hover:opacity-100 transition-opacity"
                              fallback={<div className="flex h-full items-center justify-center text-slate-700 text-[9px] font-bold bg-slate-950">NULL</div>}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate tracking-tight">{item.product_name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            Units: {item.quantity} <span className="text-slate-700 px-1">/</span> {formatIndianPrice(item.price)}
                          </p>
                        </div>
                        <p className="text-xs font-bold font-mono text-white tracking-tight">
                          {formatIndianPrice(parseFloat(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Manifest Mapping */}
          {searched && !order && (
            <div className="mt-8 border border-dashed border-slate-800 rounded-xl p-8 text-center bg-slate-950/40">
          <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                 No order found matching the provided details. Please check and try again.
               </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}