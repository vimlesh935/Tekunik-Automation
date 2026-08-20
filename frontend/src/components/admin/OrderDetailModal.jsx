import React from "react";
import { Package, X } from "lucide-react";
import SafeImage from "../SafeImage.jsx";

export default function OrderDetailModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-5 flex items-center justify-between">
          <div><p className="text-xs uppercase tracking-wider text-gray-500">Order Detail</p><h2 className="text-xl font-bold text-white font-mono">{order.order_number}</h2></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-black/30 border border-gray-800 p-4"><p className="text-xs text-gray-500 uppercase">Customer</p><p className="mt-2 text-sm font-semibold text-white">{order.customer_name || order.guest_name || "Guest"}</p><p className="text-xs text-gray-400 break-all">{order.customer_email || order.guest_email || ""}</p></div>
            <div className="rounded-xl bg-black/30 border border-gray-800 p-4"><p className="text-xs text-gray-500 uppercase">Amount</p><p className="mt-2 text-lg font-bold text-emerald-400">₹{parseFloat(order.total_amount || 0).toFixed(2)}</p></div>
            <div className="rounded-xl bg-black/30 border border-gray-800 p-4"><p className="text-xs text-gray-500 uppercase">Status</p><p className="mt-2 text-sm font-semibold text-cyan-400 capitalize">{String(order.status || "").replace(/_/g, " ")}</p></div>
            <div className="rounded-xl bg-black/30 border border-gray-800 p-4"><p className="text-xs text-gray-500 uppercase">Payment</p><p className="mt-2 text-sm font-semibold text-amber-400 capitalize">{order.payment_status || "pending"}</p></div>
          </div>
          <div className="rounded-xl bg-black/30 border border-gray-800 p-4"><p className="text-xs text-gray-500 uppercase mb-2">Delivery</p><p className="text-sm text-gray-200">{order.delivery_address || "-"}</p><p className="text-sm text-gray-400">{[order.guest_city, order.guest_state, order.guest_pincode].filter(Boolean).join(", ")}</p></div>
          <div className="rounded-xl bg-black/30 border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800"><p className="text-sm font-bold text-white">Items</p></div>
            <div className="divide-y divide-gray-800">
              {(order.items || []).map((item) => (
                <div key={item.id || item.product_id} className="p-4 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">{item.product_image ? <SafeImage src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-500"><Package size={18} /></div>}</div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white truncate">{item.product_name}</p><p className="text-xs text-gray-400">Qty {item.quantity} x ₹{parseFloat(item.price || 0).toFixed(2)}</p></div>
                  <p className="text-sm font-bold text-cyan-400">₹{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</p>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && <div className="p-4 text-sm text-gray-500 text-center">No line items found.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
