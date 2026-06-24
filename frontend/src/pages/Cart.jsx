import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Package,
  Loader2,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cartService } from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";
import { formatCurrency } from "../utils/currency.js";

export default function Cart({ token }) {
  const navigate = useNavigate();
  const guestCart = useCart();
  const { addToast } = useToast();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isGuest = !token;
  const currentCart = isGuest
    ? {
        items: guestCart.items,
        itemCount: guestCart.itemCount,
        totalAmount: guestCart.totalAmount,
        totalQuantity: guestCart.totalQuantity,
      }
    : cart;

  const loadCart = async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await cartService.getCart();
      const cartData = response.data;
      if (cartData?.cart) {
        setCart(cartData.cart);
      } else if (cartData?.items) {
        setCart(cartData);
      } else if (Array.isArray(cartData)) {
        setCart({
          items: cartData,
          itemCount: cartData.length,
          totalAmount: 0,
          totalQuantity: 0,
        });
      } else {
        setCart(
          cartData || {
            items: [],
            itemCount: 0,
            totalAmount: 0,
            totalQuantity: 0,
          },
        );
      }
    } catch (error) {
      console.warn("loadCart error:", error);
      addToast(error?.message || "Unable to load cart.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateItem = async (itemId, quantity) => {
    if (quantity < 1) return;
    if (!currentCart) return;

    if (isGuest) {
      guestCart.updateCartItem(itemId, quantity);
      return;
    }

    setSaving(true);
    try {
      const response = await cartService.updateCartItem(itemId, quantity);
      setCart(response.data?.cart || cart);
    } catch (error) {
      addToast(error.message || "Unable to update item quantity.", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId) => {
    if (isGuest) {
      guestCart.removeItem(itemId);
      addToast("Item removed from cart", "success");
      return;
    }

    setSaving(true);
    try {
      const response = await cartService.removeFromCart(itemId);
      setCart(response.data?.cart || cart);
      addToast("Item removed from cart", "success");
    } catch (error) {
      addToast(error.message || "Unable to remove item.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = () => {
    if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
      addToast("Your cart is empty. Add items before checking out.", "warning");
      return;
    }

    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans antialiased py-12 selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Premium Ambient Radiance Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-purple-600/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Interactive Tech Grid Background Mapping */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          /* Loading Telemetry Buffer State */
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-24 text-center backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">
              Syncing Pipeline Data...
            </span>
          </div>
        ) : currentCart && currentCart.items && currentCart.items.length > 0 ? (
          /* ════ SPLIT GEOMETRIC LAYOUT BLOCK ════ */
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] items-start">
            {/* COLUMN LEFT: SELECTED MODULES / PRODUCT LIST */}
            <div className="space-y-4 lg:max-h-[82vh] lg:overflow-y-auto lg:pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="flex items-center gap-4 mb-1">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 font-mono">
                  Selected Modules ({currentCart.itemCount})
                </p>
                <span className="h-px flex-grow bg-slate-800" />
              </div>

              <AnimatePresence mode="popLayout">
                {currentCart.items.map((item) => {
                  const itemId = item.cart_item_id || item.product_id;
                  return (
                    <motion.div
                      key={itemId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 30,
                      }}
                      className="group bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/[0.01]"
                    >
                      <div className="flex gap-5 items-center">
                        {/* Hardware Image Bay Frame */}
                        <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 p-2 flex-shrink-0 flex items-center justify-center group-hover:border-slate-700 transition-colors duration-300">
                          {item.image_url ? (
                            <SafeImage
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                              fallback={
                                <div className="text-slate-800">
                                  <Package size={22} />
                                </div>
                              }
                            />
                          ) : (
                            <div className="text-slate-800">
                              <Package size={22} />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-150 line-clamp-1">
                            {item.name}
                          </h2>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                              {item.product_status === "active"
                                ? "In Stock"
                                : "Unavailable"}
                            </p>
                          </div>
                          <p className="text-xs font-black text-slate-400 pt-1 font-mono">
                            ₹{parseFloat(item.price || 0).toFixed(2)}{" "}
                            <span className="text-[10px] text-slate-600 font-sans font-medium">
                              / unit
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div className="flex flex-row sm:flex-col gap-4 items-center sm:items-end justify-between sm:justify-center border-t border-slate-800/40 sm:border-0 pt-4 sm:pt-0">
                        <div className="flex flex-col gap-1.5 items-start sm:items-end">
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-1.5 py-1 shadow-inner">
                            <button
                              type="button"
                              onClick={() =>
                                updateItem(
                                  itemId,
                                  Math.max(1, item.quantity - 1),
                                )
                              }
                              disabled={saving}
                              className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="min-w-[2rem] text-center text-white font-black text-xs font-mono">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateItem(
                                  itemId,
                                  Math.min(
                                    item.max_quantity,
                                    item.quantity + 1,
                                  ),
                                )
                              }
                              disabled={saving}
                              className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider font-mono sm:mr-1">
                            Limit {item.max_quantity}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(itemId)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-rose-400 transition-all duration-200 disabled:opacity-40 active:scale-95"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* COLUMN RIGHT: ORDER SUMMARY */}
            <aside className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 lg:sticky lg:top-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/[0.02] rounded-full blur-2xl pointer-events-none" />

              {/* Order Summary */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-px w-6 bg-indigo-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">
                    Invoice Calculations
                  </p>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Order{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    Summary
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Review your order before proceeding to payment.
                </p>
              </div>

              {/* Invoice Calculations */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3.5 shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <Layers size={13} className="text-slate-600" /> Active
                    Configurations
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {currentCart.itemCount} units
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-3">
                  <span>Total Unit Items</span>
                  <span className="font-mono font-bold text-slate-200">
                    {currentCart.totalQuantity} qty
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentCart.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Shipping</span>
                  <span className="font-semibold text-green-400">FREE</span>
                </div>
                <div className="flex items-end justify-between text-sm font-bold pt-2 border-t border-slate-800">
                  <span className="text-white">Total Amount</span>
                  <span className="text-2xl font-black text-white font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                    {formatCurrency(currentCart.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Secure Checkout */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 space-y-2">
                <p className="font-bold text-xs text-indigo-400 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-indigo-400" /> Secure
                  Checkout
                </p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Your payment information is encrypted and secure.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-950 disabled:text-slate-700 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl py-4 flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_25px_rgba(99,102,241,0.15)] active:scale-[0.97] disabled:pointer-events-none"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout{" "}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/shop")}
                  disabled={saving}
                  className="w-full bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  Continue Shopping
                </button>
              </div>
            </aside>
          </div>
        ) : (
          /* Empty Pipeline Diagnostics State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/20 border border-slate-900 backdrop-blur-sm rounded-2xl p-20 text-center max-w-md mx-auto shadow-2xl"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 mb-6 text-slate-600 shadow-inner">
              <ShoppingCart size={26} className="text-indigo-500" />
            </div>
            <p className="text-base font-bold text-slate-200 tracking-tight">
              Cart Allocation Vacant
            </p>
            <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              No technical modules compiled in the staging pipeline block.
              Deploy units via the active catalog interface.
            </p>
            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="mt-6 inline-flex items-center gap-2 bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl px-5 py-3 transition-all duration-300 active:scale-95 shadow-lg"
            >
              Continue Shopping
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
