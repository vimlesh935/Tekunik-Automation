import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { cartService, guestOrderService, userService } from "../services/api";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";
import { formatCurrency } from "../utils/currency.js";
import {
  ArrowLeft, ArrowRight, CreditCard, MapPin, Mail, Phone,
  Loader2, Package, ShieldCheck, Truck, BadgeCheck, User, Hash
} from "lucide-react";

const EMPTY_CART = { items: [], itemCount: 0, totalQuantity: 0, totalAmount: 0 };

const inputCls =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

const labelCls = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5";

export default function Checkout({ token }) {
  const navigate = useNavigate();
  const guestCart = useCart();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", address: "",
    city: "", state: "", pincode: "", payment_method: "cod", create_account: false,
  });
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutTotals, setCheckoutTotals] = useState(EMPTY_CART);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(token);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const syncGuestCart = () => {
    setCheckoutItems(guestCart.items || []);
    setCheckoutTotals({
      items: guestCart.items || [],
      itemCount: guestCart.itemCount || 0,
      totalQuantity: guestCart.totalQuantity || 0,
      totalAmount: guestCart.totalAmount || 0,
    });
  };

  useEffect(() => {
    if (!isAuthenticated) { syncGuestCart(); return; }
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, cartRes] = await Promise.all([
          userService.getCurrentUser(),
          cartService.getCart(),
        ]);
        if (!isMounted) return;
        const user = profileRes?.data?.user || null;
        if (user) {
          const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
          setForm((prev) => ({
            ...prev,
            full_name: fullName || prev.full_name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
            address: user.address || prev.address,
            city: user.city || prev.city,
          }));
        }
        const cartData = cartRes?.data?.cart || cartRes?.data || {};
        const items = Array.isArray(cartData.items) ? cartData.items : [];
        setCheckoutItems(items);
        setCheckoutTotals({
          items,
          itemCount: cartData.itemCount ?? items.length,
          totalQuantity: cartData.totalQuantity ?? items.reduce((s, i) => s + Number(i.quantity || 0), 0),
          totalAmount: Number(cartData.totalAmount ?? items.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0)).toFixed(2),
        });
      } catch (err) {
        addToast(err?.message || "Unable to load your saved cart.", "error");
        syncGuestCart();
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [isAuthenticated, guestCart.items, guestCart.itemCount, guestCart.totalAmount, guestCart.totalQuantity, addToast]);

  const validate = () => {
    if (!checkoutItems?.length) { addToast("Your cart is empty.", "warning"); return false; }
    for (const f of ["full_name", "email", "phone", "address", "city", "state", "pincode"]) {
      if (!form[f]?.toString().trim()) { addToast("Please complete all required fields.", "error"); return false; }
    }
    if (!form.email.includes("@")) { addToast("Please enter a valid email address.", "error"); return false; }
    return true;
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        items: checkoutItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        customer: {
          full_name: form.full_name, email: form.email, phone: form.phone,
          address: form.address, city: form.city, state: form.state, pincode: form.pincode,
        },
        payment_method: form.payment_method,
        create_account: form.create_account,
      };
      const response = isAuthenticated
        ? await cartService.checkout(payload)
        : await guestOrderService.createOrder(payload);
      const order = response?.data?.order;
      if (!order) throw new Error("Order could not be created.");
      if (isAuthenticated) { try { await cartService.clearCart(); } catch {} }
      else { guestCart.clearCart(); }
      addToast("Order placed successfully! 🎉", "success");
      navigate("/order-confirmation", { state: { order } });
    } catch (err) {
      addToast(err?.message || "Unable to complete checkout.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Empty cart state ──────────────────────────────────────────────────────
  if (!loading && checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] font-sans antialiased flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-16 text-center max-w-md w-full">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 border border-blue-100 mb-5">
            <Package size={28} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-slate-500 text-sm font-medium">Add products to your cart before checkout.</p>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="mt-6 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-lg px-6 py-3 transition-colors shadow-sm"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const subtotal = checkoutItems.reduce((s, i) => s + parseFloat(i.price || 0) * Number(i.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-[#f1f3f6] font-sans antialiased selection:bg-blue-600 selection:text-white">

      {/* ── Page Header Banner ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Secure Checkout</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Complete Your Order</h1>
              <p className="text-blue-200 text-sm mt-1 font-medium">Fast, secure checkout with instant order confirmation.</p>
            </div>
            <Link
              to="/cart"
              className="self-start sm:self-auto inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm rounded-lg px-4 py-2.5 transition-colors"
            >
              <ArrowLeft size={15} /> Return to Cart
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap gap-4">
            {[
              { icon: ShieldCheck, text: "SSL Secured" },
              { icon: Truck, text: "Fast Delivery" },
              { icon: BadgeCheck, text: "100% Genuine" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs font-semibold text-blue-200">
                <Icon size={14} className="text-amber-400" /> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

          {/* ── LEFT: Form ─────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Shipping Information */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" /> Shipping Information
                </h2>
                {loading && (
                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin" /> Loading saved details...
                  </span>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-500 normal-case">*</span></label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        value={form.full_name}
                        onChange={(e) => handleChange("full_name", e.target.value)}
                        placeholder="Your full name"
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Email Address <span className="text-red-500 normal-case">*</span></label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Phone Number <span className="text-red-500 normal-case">*</span></label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Pincode <span className="text-red-500 normal-case">*</span></label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        value={form.pincode}
                        onChange={(e) => handleChange("pincode", e.target.value)}
                        placeholder="400001"
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Delivery Address <span className="text-red-500 normal-case">*</span></label>
                  <textarea
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows={3}
                    placeholder="House/Flat no., Street, Area, Landmark"
                    className={inputCls}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>City <span className="text-red-500 normal-case">*</span></label>
                    <input value={form.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="Mumbai" className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>State <span className="text-red-500 normal-case">*</span></label>
                    <input value={form.state} onChange={(e) => handleChange("state", e.target.value)} placeholder="Maharashtra" className={inputCls} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-600" /> Payment Method
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* COD */}
                  <label className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 cursor-pointer transition-all ${
                    form.payment_method === "cod"
                      ? "border-amber-500 bg-amber-50 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
                  }`}>
                    <input
                      type="radio" name="payment_method" value="cod"
                      checked={form.payment_method === "cod"}
                      onChange={() => handleChange("payment_method", "cod")}
                      className="h-4 w-4 text-amber-500 accent-amber-500"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Cash on Delivery</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Pay when you receive</p>
                    </div>
                    <span className="ml-auto text-lg">💵</span>
                  </label>

                  {/* Online */}
                  <label className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 cursor-pointer transition-all ${
                    form.payment_method === "online"
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
                  }`}>
                    <input
                      type="radio" name="payment_method" value="online"
                      checked={form.payment_method === "online"}
                      onChange={() => handleChange("payment_method", "online")}
                      className="h-4 w-4 text-blue-600 accent-blue-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Online Payment</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">UPI / Card / NetBanking</p>
                    </div>
                    <span className="ml-auto text-lg">💳</span>
                  </label>
                </div>

                {/* Create account checkbox */}
                <label className="mt-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.create_account}
                    onChange={(e) => handleChange("create_account", e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Create account for faster order tracking <span className="text-slate-400 font-normal">(optional)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Info strip */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-600"><Mail size={13} /> Email receipt sent instantly</span>
                <span className="flex items-center gap-1.5 text-blue-600"><Phone size={13} /> SMS delivery updates</span>
                <span className="flex items-center gap-1.5 text-indigo-600"><MapPin size={13} /> Track order anytime</span>
              </div>
            </div>
          </form>

          {/* ── RIGHT: Order Summary ────────────────────────────────────── */}
          <aside className="space-y-4">

            {/* Summary card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-24">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Order Summary</p>
              </div>

              {/* Items list */}
              <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                {checkoutItems.slice(0, 6).map((item) => (
                  <div key={item.cart_item_id || item.product_id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0">
                      {item.image_url ? (
                        <SafeImage
                          src={item.image_url} alt={item.name}
                          className="h-full w-full object-contain p-0.5 mix-blend-multiply"
                          fallback={<div className="flex h-full items-center justify-center text-slate-400"><Package size={16} /></div>}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400"><Package size={16} /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Qty {item.quantity} × {formatCurrency(item.price || 0)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-slate-900 flex-shrink-0">
                      {formatCurrency(parseFloat(item.price || 0) * Number(item.quantity || 0))}
                    </p>
                  </div>
                ))}
                {checkoutItems.length > 6 && (
                  <p className="text-center text-xs text-slate-400 font-semibold py-2.5">
                    +{checkoutItems.length - 6} more items
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal ({checkoutTotals.itemCount} items)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Delivery</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Payment</span>
                  <span className="font-bold text-slate-700 capitalize">
                    {form.payment_method === "cod" ? "Cash on Delivery" : "Online"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-base font-black text-slate-900">Total</span>
                  <span className="text-xl font-black text-blue-700">{formatCurrency(checkoutTotals.totalAmount)}</span>
                </div>
              </div>

              {/* Delivery estimate */}
              <div className="mx-5 mb-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <Truck size={13} /> Estimated Delivery: 3–5 Business Days
                </p>
              </div>

              {/* Place Order CTA */}
              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-black text-sm rounded-xl py-4 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:pointer-events-none shadow-md hover:shadow-amber-500/30 hover:shadow-lg"
                >
                  {saving ? (
                    <><Loader2 size={17} className="animate-spin" /> Placing Order...</>
                  ) : (
                    <>Place Order <ArrowRight size={16} /></>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400 font-medium mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" /> Secured by SSL encryption
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
