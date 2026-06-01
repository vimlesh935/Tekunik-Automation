import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Package, Loader2 } from "lucide-react";
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
        setCart({ items: cartData, itemCount: cartData.length, totalAmount: 0, totalQuantity: 0 });
      } else {
        setCart(cartData || { items: [], itemCount: 0, totalAmount: 0, totalQuantity: 0 });
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
    if (!currentCart || currentCart.items.length === 0) {
      addToast("Your cart is empty. Add items before checking out.", "warning");
      return;
    }

    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] font-sans antialiased py-10 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Your Cart</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review items before checkout</h1>
          </div>
          <button type="button" onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition shadow-sm group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Continue Shopping
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin"></div>
          </div>
        ) : currentCart && currentCart.items.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-3">
              {currentCart.items.map((item) => {
                const itemId = item.cart_item_id || item.product_id;
                return (
                  <div key={itemId} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-4">
                        <div className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0">
                          {item.image_url ? (
                            <SafeImage src={item.image_url} alt={item.name} className="h-full w-full object-contain p-1 mix-blend-multiply"
                              fallback={<div className="flex h-full items-center justify-center text-slate-400"><Package size={24} /></div>} />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-400"><Package size={24} /></div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900">{item.name}</h2>
                          <p className="mt-1 text-xs font-semibold text-emerald-600">{item.product_status === "active" ? "In Stock" : "Unavailable"}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">₹{parseFloat(item.price).toFixed(2)} each</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 items-start sm:items-end">
                        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                          <button type="button" onClick={() => updateItem(itemId, Math.max(1, item.quantity - 1))} disabled={saving}
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition disabled:opacity-50 shadow-sm">
                            <Minus size={14} />
                          </button>
                          <span className="min-w-[2rem] text-center text-slate-900 font-bold text-sm">{item.quantity}</span>
                          <button type="button" onClick={() => updateItem(itemId, Math.min(item.max_quantity, item.quantity + 1))} disabled={saving}
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition disabled:opacity-50 shadow-sm">
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Max {item.max_quantity}</p>
                        <button type="button" onClick={() => removeItem(itemId)} disabled={saving}
                          className="inline-flex items-center gap-1.5 border border-red-200 bg-red-50 rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 h-fit sticky top-24 shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Order Summary</p>
                <div className="flex items-center justify-between text-base font-bold text-slate-900">
                  <span>{currentCart.itemCount} {currentCart.itemCount === 1 ? 'item' : 'items'}</span>
                  <span className="text-blue-700">{formatCurrency(currentCart.totalAmount)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">Total qty: {currentCart.totalQuantity}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                <p className="font-bold text-blue-700 flex items-center gap-2"><Package size={14} /> Delivery estimate</p>
                <p className="mt-1 text-blue-600/80 text-xs font-medium">3–5 business days for standard delivery.</p>
              </div>
              <button type="button" onClick={handleCheckout} disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold text-sm rounded-lg py-3 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:pointer-events-none shadow-sm">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <>Proceed to Checkout <ArrowLeft size={15} className="rotate-180" /></>}
              </button>
            </aside>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border border-blue-100 mb-5">
              <ShoppingCart size={28} className="text-blue-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">Your cart is empty.</p>
            <p className="mt-2 text-slate-500 text-sm font-medium">Add products to your cart and come back here to checkout.</p>
            <button type="button" onClick={() => navigate("/")} className="mt-6 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-lg px-5 py-2.5 transition-colors shadow-sm">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
