import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { orderService } from "../services/api";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";
import { 
  Search, Mail, Phone, Package, ArrowLeft, MapPin, Clock, 
  CreditCard, CheckCircle, Loader2, Truck, Copy, Check, Star, Hash
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

  const handleTrack = async (event) => {
    event.preventDefault();
    const identifier = orderNumber.trim() || trackingNumber.trim();
    if (!identifier || !contact.trim()) {
      addToast("Please provide your order/tracking number and email or phone.", "warning");
      return;
    }

    setLoading(true);
    setOrder(null);
    setSearched(false);

    try {
      const response = await orderService.trackOrder({
        order_number: identifier,
        contact: contact.trim(),
      });
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

  const copyOrderNumber = () => {
    if (!order?.order_number) return;
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (s) => {
    const colors = {
      pending: "text-amber-600 bg-amber-50 border-amber-200",
      confirmed: "text-blue-600 bg-blue-50 border-blue-200",
      processing: "text-blue-600 bg-blue-50 border-blue-200",
      shipped: "text-amber-600 bg-amber-50 border-amber-200",
      out_for_delivery: "text-amber-600 bg-amber-50 border-amber-200",
      delivered: "text-emerald-600 bg-emerald-50 border-emerald-200",
      cancelled: "text-red-600 bg-red-50 border-red-200",
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

  // Tracking steps for the timeline
  const trackingSteps = [
    { key: "pending", label: "Order Confirmed", icon: CheckCircle, desc: "Your order has been placed" },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle, desc: "Order has been confirmed" },
    { key: "processing", label: "Packed", icon: Package, desc: "Items are being packed" },
    { key: "shipped", label: "Shipped", icon: Truck, desc: "Package is on its way" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, desc: "Out for delivery today" },
    { key: "delivered", label: "Delivered", icon: CheckCircle, desc: "Package delivered" },
  ];

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === "cancelled") return -1;
    const statusOrder = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
    return statusOrder.indexOf(order.status);
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* ═══ TRACK ORDER HERO BANNER ═══ */}
      <section className="relative bg-gradient-to-r from-blue-700 to-indigo-800 text-white pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-left space-y-6 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded text-xs tracking-wider uppercase shadow-sm">
              Track Location
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Track Your Order
            </h1>
            <p className="text-blue-100 text-base sm:text-lg max-w-xl leading-relaxed">
              Enter your order number and contact details to view real-time delivery status and tracking information.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ MAIN TRACKING SECTION ═══ */}
      <section className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Input fields form */}
            <div className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Provide your order number and the email or phone used during checkout to track your shipment.
              </p>
              
              <form onSubmit={handleTrack} className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Order Number
                    </label>
                    <input
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g., ORD-12345"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Email or Phone
                    </label>
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="you@example.com or phone"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold px-6 py-3 rounded-lg text-sm transition-colors active:scale-[0.97] disabled:pointer-events-none"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Searching...</>
                  ) : (
                    <><Search size={16} /> Track Order</>
                  )}
                </button>
              </form>
            </div>

            {/* Side instructions summary */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 text-blue-600">
                  <Package size={18} />
                  <p className="text-xs font-bold uppercase tracking-widest">Real-time Tracking</p>
                </div>
                <p className="mt-3 text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
                  Keep your order number and contact information handy to check your delivery status instantly.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-100 space-y-2.5 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-2.5"><Mail size={13} className="text-blue-500" /> Use the email from checkout</div>
                <div className="flex items-center gap-2.5"><Phone size={13} className="text-blue-500" /> Include country code if applicable</div>
                <div className="flex items-center gap-2.5"><MapPin size={13} className="text-blue-500" /> Delivery address on file</div>
              </div>
            </div>
          </div>

          {/* ═══ ORDER RESULTS ═══ */}
          {order && (
            <div className="mt-10 pt-8 border-t border-slate-200 space-y-8 animate-slide-up">
              
              {/* Order Meta Panel */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
                      Order Found
                    </span>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">{order.order_number}</h2>
                      <button
                        onClick={copyOrderNumber}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                        title="Copy order number"
                      >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  
                  <span className={`self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace(/_/g, " ")}
                  </span>
                </div>

                {/* Tracking Number Display */}
                {order.tracking_number && (
                  <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
                    <Hash size={18} className="text-amber-600" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Tracking Number</p>
                      <p className="text-lg font-extrabold text-slate-900 tracking-tight font-mono">{order.tracking_number}</p>
                    </div>
                  </div>
                )}

                {/* Sub Metadata Parameters Grid */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Customer</p>
                    <p className="text-slate-800 font-bold">{order.guest_name || "Guest"}</p>
                    <p className="text-slate-500 mt-1 truncate">{order.guest_email || ""}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{order.guest_phone || ""}</p>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Shipping</p>
                    <p className="text-slate-800 font-medium line-clamp-2">{order.delivery_address}</p>
                    <p className="text-slate-500 mt-1">
                      {order.guest_city}{order.guest_state ? `, ${order.guest_state}` : ""} {order.guest_pincode || ""}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Payment</p>
                    <p className="text-slate-800 font-bold">{order.payment_method === "online" ? "Online" : "Cash on Delivery"}</p>
                    <p className={`text-[10px] uppercase font-bold tracking-widest mt-1.5 inline-block px-1.5 py-0.5 rounded ${
                      order.payment_status === "paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}>
                      {order.payment_status}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total</p>
                      <p className="text-xl font-extrabold text-slate-900 tracking-tight">{formatIndianPrice(order.total_amount)}</p>
                    </div>
                    {order.estimated_delivery && (
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        Est: {new Date(order.estimated_delivery).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-8">
                  <Truck size={16} className="text-blue-600" />
                  Order Timeline
                </h3>

                {order.status === "cancelled" ? (
                  <div className="text-center py-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-200 mb-3">
                      <Package size={20} className="text-red-500" />
                    </div>
                    <p className="text-base font-bold text-slate-800">Order Cancelled</p>
                    <p className="text-xs text-slate-500 mt-1">This order has been cancelled.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Continuous Tracker Line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-slate-200" />
                    
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
                            <div key={step.key} className="relative flex gap-4">
                              {/* Node Points */}
                              <div className="relative z-10 shrink-0">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center border transition-all duration-500 ${
                                  isCompleted 
                                    ? "bg-emerald-500 border-emerald-400 text-white shadow-sm" 
                                    : "bg-white border-slate-200 text-slate-300"
                                } ${isCurrent ? "scale-105 ring-4 ring-emerald-100 animate-pulse" : ""}`}>
                                  <StepIcon size={15} className={isCompleted ? "text-white" : "text-slate-300"} />
                                </div>
                              </div>
                              
                              {/* Step Content */}
                              <div className="flex-1 min-w-0 pt-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <p className={`text-sm font-bold tracking-tight ${isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                                    {step.label}
                                  </p>
                                  {trackingEntry && (
                                    <span className="text-[11px] font-medium text-slate-400">
                                      {formatDate(trackingEntry.timestamp || trackingEntry.created_at)}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs mt-0.5 font-medium leading-relaxed ${isCompleted ? "text-slate-500" : "text-slate-300"}`}>
                                  {trackingEntry?.description || step.desc}
                                </p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Estimated delivery banner */}
                    {order.estimated_delivery && getCurrentStepIndex() >= 0 && getCurrentStepIndex() < 5 && (
                      <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-0.5">Estimated Delivery</span>
                        <p className="text-base font-bold text-slate-900 tracking-tight">
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
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Items in Order</p>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-lg p-3">
                        <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                          {item.product_image && (
                            <SafeImage
                              src={item.product_image}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                              fallback={<div className="flex h-full items-center justify-center text-slate-300 text-[10px] font-bold">N/A</div>}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate tracking-tight">{item.product_name}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Qty {item.quantity} <span className="text-slate-300 px-1">×</span> {formatIndianPrice(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-extrabold text-slate-900 tracking-tight">
                          {formatIndianPrice(parseFloat(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {searched && !order && (
            <div className="mt-8 border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50">
              <p className="text-sm font-medium text-slate-500">
                No order found. Please double-check your order number and contact details.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}