import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { userService } from "../services/api";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";
import { 
  ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, 
  Loader2, Truck, Trash2, Copy, Check, Phone, Mail, Calendar,
  ChevronDown, ChevronUp
} from "lucide-react";

export default function OrderDetails({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await userService.getOrder(id);
      const orderData = response.data?.order;
      if (!orderData) throw new Error("Order not found");
      setOrder(orderData);
    } catch (error) {
      addToast(error?.message || "Failed to load order details", "error");
      navigate("/orders");
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
      pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      confirmed: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      processing: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      out_for_delivery: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
    };
    return colors[s] || colors.pending;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  // Timeline tracking steps
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

  if (loading) {
    return (
      <div className="min-h-screen bg-page text-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-cyan-400" />
          <p className="text-gray-400">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = getCurrentStepIndex();
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-page text-primary transition-colors duration-300 py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          >
            <ArrowLeft size={16} /> Back to Orders
          </button>
        </div>

        <div className="rounded-[2.5rem] border border-white/10 bg-gray-950/80 p-6 sm:p-10 shadow-2xl shadow-cyan-500/10 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold border ${getStatusColor(order.status)}`}>
                  <Package size={12} />
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace(/_/g, " ")}
                </span>
                {order.payment_status === "paid" && (
                  <span className="text-xs text-emerald-400 font-semibold">Paid</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white">Order Details</h1>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-4 sm:p-5 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Order Number</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-lg font-semibold text-white font-mono">{order.order_number}</p>
                <button
                  onClick={copyOrderNumber}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition"
                  title="Copy order number"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">Placed on {formatDate(order.created_at)}</p>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-gray-900/70 overflow-hidden">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition"
            >
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Truck size={18} className="text-cyan-400" />
                Order Tracking
              </h2>
              {showTimeline ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            
            {showTimeline && (
              <div className="px-5 pb-8">
                {isCancelled ? (
                  <div className="text-center py-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                      <Package size={28} className="text-red-400" />
                    </div>
                    <p className="text-xl font-bold text-white">Order Cancelled</p>
                    <p className="mt-2 text-gray-400">This order has been cancelled.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-white/10" />
                    
                    <div className="space-y-0">
                      {trackingSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isCompleted = currentStep >= index;
                        const isCurrent = currentStep === index;
                        
                        // Find tracking entry for this step
                        const trackingEntry = order.trackingHistory?.find(
                          t => t.status === step.key
                        );

                        return (
                          <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                            {/* Timeline dot */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                isCompleted 
                                  ? "bg-cyan-500 border-cyan-500 shadow-lg shadow-cyan-500/30" 
                                  : "bg-gray-900 border-white/10"
                              } ${isCurrent ? "scale-110 ring-2 ring-cyan-500/30" : ""}`}>
                                <StepIcon size={16} className={isCompleted ? "text-black" : "text-gray-600"} />
                              </div>
                            </div>
                            
                            {/* Step content */}
                            <div className="flex-1 min-w-0 pt-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-semibold ${
                                  isCompleted ? "text-white" : "text-gray-500"
                                }`}>
                                  {step.label}
                                </p>
                                {trackingEntry && (
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {formatShortDate(trackingEntry.timestamp || trackingEntry.created_at)}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-0.5 ${
                                isCompleted ? "text-gray-400" : "text-gray-600"
                              }`}>
                                {trackingEntry?.description || step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Estimated delivery */}
                    {order.estimated_delivery && currentStep < 5 && currentStep >= 0 && (
                      <div className="mt-4 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/10 p-4 text-center">
                        <p className="text-sm text-cyan-300 font-semibold">🚚 Estimated Delivery</p>
                        <p className="text-lg font-bold text-white mt-1">
                          {new Date(order.estimated_delivery).toLocaleDateString("en-US", {
                            weekday: "long", month: "long", day: "numeric"
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              {/* Shipping details */}
              <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <MapPin size={18} className="text-cyan-400" />
                  Shipping Details
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Recipient</p>
                    <p className="font-semibold text-white">{order.guest_name || order.customer_name || "Customer"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Contact</p>
                    {order.guest_email && <p className="text-white text-sm flex items-center gap-1.5"><Mail size={12} className="text-cyan-400" /> {order.guest_email}</p>}
                    {order.guest_phone && <p className="text-gray-400 text-sm flex items-center gap-1.5"><Phone size={12} className="text-cyan-400" /> {order.guest_phone}</p>}
                  </div>
                </div>
                <div className="mt-5 rounded-3xl bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Delivery Address</p>
                  <p className="mt-3 text-sm text-gray-200">{order.delivery_address}</p>
                  <p className="mt-1 text-sm text-gray-200">{order.guest_city}{order.guest_state ? `, ${order.guest_state}` : ""} {order.guest_pincode || ""}</p>
                </div>
              </div>

              {/* Order items */}
              <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Package size={18} className="text-cyan-400" />
                  Order Items
                </h2>
                <div className="mt-6 space-y-4">
                  {order.items?.map((item) => (
                    <div key={item.id || item.product_id} className="flex items-center gap-4 rounded-3xl bg-white/5 p-4">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gray-800 flex-shrink-0">
                        {item.product_image ? (
                          <SafeImage
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                            fallback={<div className="flex h-full items-center justify-center text-gray-500 text-xs">Img</div>}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500 text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{item.product_name}</p>
                        <p className="text-sm text-gray-400">Qty {item.quantity} × ₹{parseFloat(item.price).toFixed(2)}</p>
                      </div>
                      <p className="text-sm font-semibold text-cyan-300 flex-shrink-0">
                        ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-white">
                  <span className="text-sm">Total</span>
                  <span className="text-2xl font-bold text-cyan-400">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Track this order */}
              <Link
                to="/track-order"
                state={{ order_number: order.order_number, contact: order.guest_email }}
                className="flex items-center justify-between rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/15 hover:border-cyan-500/40 transition group"
              >
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-cyan-400" />
                  <div>
                    <p className="text-white">Track this order</p>
                    <p className="text-xs font-normal text-gray-400 mt-0.5">Use your order number</p>
                  </div>
                </div>
                <ArrowLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Payment info */}
              <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard size={16} className="text-cyan-400" />
                  Payment
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Method</span>
                  <span className="text-white font-medium">
                    {order.payment_method === "online" ? "Online Payment" : "Cash on Delivery"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-medium ${order.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                    {order.payment_status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-semibold">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
                {order.invoice_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Invoice</span>
                    <span className="text-cyan-400 font-mono text-xs">{order.invoice_number}</span>
                  </div>
                )}
              </div>

              {/* Order timeline */}
              <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock size={16} className="text-cyan-400" />
                  Order Timeline
                </h3>
                <div className="text-xs text-gray-500 space-y-2">
                  <p>Created: {formatDate(order.created_at)}</p>
                  {order.updated_at && (
                    <p>Last updated: {formatDate(order.updated_at)}</p>
                  )}
                  {order.estimated_delivery && (
                    <p>Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })}</p>
                  )}
                </div>
              </div>

              {/* Continue shopping */}
              <Link
                to="/shop"
                className="inline-flex items-center justify-center w-full rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-sm font-semibold text-black hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}