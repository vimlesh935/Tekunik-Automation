import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { cartService, guestOrderService, couponService, userService, orderService } from "../services/api";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";
import CouponOffers from "../components/checkout/CouponOffers.jsx";
import { formatCurrency } from "../utils/currency.js";
import { calculateDiscount, hasDiscount } from "../utils/discount.js";
import { motion, AnimatePresence } from "framer-motion";
import ValidatedEmailInput from "../components/ValidatedEmailInput.jsx";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Loader2,
  Package,
  ShieldCheck,
  Truck,
  CheckCircle,
  AlertCircle,
  User,
  Zap,
  Lock,
  Loader,
} from "lucide-react";
import { usePincodeLookup } from "../hooks/usePincodeLookup.js";

const EMPTY_CART = {
  items: [],
  itemCount: 0,
  totalQuantity: 0,
  totalAmount: 0,
};

const inputCls =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-150 font-medium";

const labelCls = "block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1";
const STANDARD_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_CHECKOUT_FIELDS = [
  "full_name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "pincode",
];

export default function Checkout() {
  const navigate = useNavigate();
  const guestCart = useCart();
  const { addToast } = useToast();
  const { token, isAuthenticated: authIsAuthenticated } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment_method: "cod",
    create_account: false,
  });
  const [checkoutItems, setCheckoutItems] = useState(() => guestCart.items || []);
  const [checkoutTotals, setCheckoutTotals] = useState(() => ({
    items: guestCart.items || [],
    itemCount: guestCart.itemCount || (guestCart.items ? guestCart.items.length : 0),
    totalQuantity: guestCart.totalQuantity || (guestCart.items ? guestCart.items.reduce((s, it) => s + Number(it.quantity || 0), 0) : 0),
    totalAmount: guestCart.totalAmount || (guestCart.items ? guestCart.items.reduce((s, it) => s + Number(it.final_price || it.price || 0) * Number(it.quantity || 0), 0) : 0),
  }));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cityLocked, setCityLocked] = useState(false);
  const { loading: pincodeLoading, error: pincodeError, lookup: lookupPincode } = usePincodeLookup();

  const isAuthenticated = authIsAuthenticated;

  // ── Coupon state ──────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, offerName, discount }
  const [couponBusy, setCouponBusy] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [busyCode, setBusyCode] = useState(null);
  const [couponMessage, setCouponMessage] = useState(null); // { type: "success" | "error", text }

  // User-friendly inline messages for backend coupon error codes.
  const couponErrorMessage = (code, fallback) => {
    const map = {
      COUPON_REQUIRED: "Please enter a coupon code",
      COUPON_NOT_FOUND: "Invalid coupon code",
      COUPON_DISABLED: "This coupon is not active right now",
      COUPON_USED: "This coupon has already been used",
      COUPON_LIMIT: "This coupon has reached its usage limit",
      COUPON_USER_LIMIT: "You have already used this coupon",
      COUPON_EXPIRED: "This coupon has expired",
      COUPON_NOT_STARTED: "This coupon is not active yet",
      COUPON_NOT_ASSIGNED: "This coupon is assigned to another account",
      OFFER_STACK_DISALLOWED: "This coupon cannot be combined with the current offer.",
      MIN_CART_NOT_REACHED: "Minimum purchase amount required",
      CART_EMPTY: "Your cart is empty",
      OFFER_NOT_APPLICABLE: "This coupon is not applicable to your cart items",
      NEW_USER_FAILED: "This coupon is for new customers only",
    };
    return map[code] || fallback || "Unable to apply coupon";
  };

  const loadAvailableCoupons = async () => {
    try {
      setCouponsLoading(true);
      const res = await couponService.available({
        cartItems: checkoutItems,
        cartTotal: checkoutTotals.totalAmount,
      });
      setAvailableCoupons(res?.data?.coupons || []);
    } catch {
      setAvailableCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  const refreshCouponFromServer = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await couponService.totals();
      const totals = res?.data || {};
      if (totals.couponCode) {
        setAppliedCoupon({
          code: totals.couponCode,
          offerName: totals.couponOfferName || totals.coupon?.description || "Coupon Discount",
          discount: Number(totals.discount || 0),
        });
      } else {
        setAppliedCoupon(null);
        if (totals.invalidatedReason?.message) {
          addToast(`Your coupon was removed — ${totals.invalidatedReason.message}`, "warning");
        }
      }
    } catch (err) {
      // quietly ignore — coupon preview is optional
    }
  };

  const handleApplyCoupon = async (codeArg) => {
    const code = String(codeArg ?? couponInput ?? "").trim();
    if (!code) {
      setCouponMessage({ type: "error", text: "Please enter a coupon code" });
      addToast("Please enter a coupon code.", "warning");
      return;
    }
    setCouponBusy(true);
    setBusyCode(code);
    try {
      let res;
      if (isAuthenticated) {
        res = await couponService.apply(code);
      } else {
        res = await couponService.validate(code, {
          cartItems: checkoutItems,
          cartTotal: checkoutTotals.totalAmount,
        });
      }
      addToast(res?.message || "Coupon applied successfully! 🎉", "success");
      const d = res?.data || {};
      setAppliedCoupon({
        code: d.coupon?.code || code,
        offerName: d.coupon?.offerName || d.couponOfferName || d.coupon?.description || "Coupon Discount",
        discount: Number(d.coupon?.discount || d.discount || 0),
      });
      setCouponInput("");
      setCouponMessage({ type: "success", text: "Coupon applied successfully" });
    } catch (err) {
      const codeLabel = err?.code || err?.response?.data?.code || null;
      setCouponMessage({ type: "error", text: couponErrorMessage(codeLabel, err?.message) });
      addToast(err?.message || "Unable to apply coupon", "error");
    } finally {
      setCouponBusy(false);
      setBusyCode(null);
      loadAvailableCoupons();
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponBusy(true);
    try {
      if (isAuthenticated) {
        await couponService.remove();
      }
      setAppliedCoupon(null);
      setCouponMessage(null);
      addToast("Coupon removed", "success");
    } catch (err) {
      addToast(err?.message || "Unable to remove coupon", "error");
    } finally {
      setCouponBusy(false);
      loadAvailableCoupons();
    }
  };

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const syncGuestCart = () => {
    const items = guestCart.items || [];
    setCheckoutItems(items);
    setCheckoutTotals({
      items,
      itemCount: guestCart.itemCount || items.length,
      totalQuantity: guestCart.totalQuantity || items.reduce((s, it) => s + Number(it.quantity || 0), 0),
      totalAmount: guestCart.totalAmount || items.reduce((s, it) => s + Number(it.final_price || it.price || 0) * Number(it.quantity || 0), 0),
    });
  };

  useEffect(() => {
    let isMounted = true;
    const loadCart = async () => {
      setLoading(true);
      try {
        if (!isAuthenticated) {
          syncGuestCart();
          return;
        }
        try {
          const res = await cartService.getCart();
          if (!isMounted) return;
          const c = res?.data?.cart || res?.data || {};
          const serverItems = (c.items || []).map((it) => ({
            ...it,
            cart_item_id: it.cart_item_id,
            product_id: it.product_id,
            max_quantity: it.max_quantity ?? it.stock_quantity ?? it.maxQuantity ?? 99,
          }));

          // If server returned items, use them; otherwise, maintain CartContext items
          if (serverItems.length > 0) {
            const totalQuantity =
              c.totalQuantity ??
              serverItems.reduce((s, it) => s + Number(it.quantity || 0), 0);
            const totalAmount =
              c.totalAmount ??
              serverItems.reduce(
                (s, it) => s + Number(it.final_price ?? it.price ?? 0) * Number(it.quantity || 0),
                0,
              );
            setCheckoutItems(serverItems);
            setCheckoutTotals({
              items: serverItems,
              itemCount: c.itemCount ?? serverItems.length,
              totalQuantity,
              totalAmount: Number(totalAmount.toFixed(2)),
            });
          } else if (guestCart.items && guestCart.items.length > 0) {
            syncGuestCart();
          } else {
            setCheckoutItems([]);
            setCheckoutTotals(EMPTY_CART);
          }
        } catch (err) {
          if (isMounted) syncGuestCart();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadCart();
    if (!isAuthenticated) return;
    refreshCouponFromServer();
    const load = async () => {
      try {
        const profileRes = await userService.getCurrentUser();
        if (!isMounted) return;
        const user = profileRes?.data?.user || null;
        if (user) {
          const fullName = [user.first_name, user.last_name]
            .filter(Boolean)
            .join(" ")
            .trim();
          setForm((prev) => ({
            ...prev,
            full_name: fullName || prev.full_name,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
            address: user.address || prev.address,
            city: user.city || prev.city,
          }));
        }
      } catch (err) {
        // Profile load failed, form stays as-is
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [
    isAuthenticated,
    guestCart.items,
    guestCart.itemCount,
    guestCart.totalAmount,
    guestCart.totalQuantity,
  ]);

  // Load available coupons only after the cart has settled, so eligibility is
  // computed against the real cart instead of an empty/loading one. Re-evaluates
  // whenever the checkout cart changes. (Bug fix: coupon list not showing.)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (loading) return;
    loadAvailableCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading, checkoutItems, checkoutTotals.totalAmount]);

  const validate = () => {
    const emailEntered = form.email;
    const emailTrimmed = String(emailEntered || "").trim();
    const emailNormalized = emailTrimmed.toLowerCase();
    const emailRegexResult = STANDARD_EMAIL_REGEX.test(emailNormalized);
    const requiredFieldState = REQUIRED_CHECKOUT_FIELDS.map((field) => {
      const value = form[field];
      const trimmed = value == null ? "" : String(value).trim();
      return {
        field,
        value,
        type: typeof value,
        isUndefined: value === undefined,
        isNull: value === null,
        isEmptyString: value === "",
        isWhitespaceOnly: typeof value === "string" && value.length > 0 && trimmed.length === 0,
        trimmed,
        missing: trimmed.length === 0,
      };
    });
    const missingField = requiredFieldState.find((item) => item.missing);

    console.log("[Checkout][RequiredFields] Current form state:", form);
    console.table(requiredFieldState);
    console.log("[Checkout][RequiredFields] Missing field name:", missingField?.field || null);
    console.log("[Checkout][EmailValidation] Email entered by user:", emailEntered);
    console.log("[Checkout][EmailValidation] Email after trim():", emailTrimmed);
    console.log("[Checkout][EmailValidation] Email after trim()+lowercase:", emailNormalized);
    console.log("[Checkout][EmailValidation] Regex result:", emailRegexResult);

    if (!checkoutItems?.length) {
      addToast("Your cart is empty.", "warning");
      console.log("[Checkout][EmailValidation] Validation result:", false);
      return false;
    }
    if (missingField) {
      addToast("Please complete all required fields.", "error");
      console.log("[Checkout][RequiredFields] Validation result:", false);
      console.log("[Checkout][EmailValidation] Validation result:", false);
      return false;
    }
    if (!emailRegexResult) {
      addToast("Please enter a valid email address.", "error");
      console.log("[Checkout][RequiredFields] Validation result:", true);
      console.log("[Checkout][EmailValidation] Validation result:", false);
      return false;
    }
    console.log("[Checkout][RequiredFields] Validation result:", true);
    console.log("[Checkout][EmailValidation] Validation result:", true);
    return true;
  };

  const handleRazorpayPayment = async (order) => {
    try {
      const result = await orderService.createRazorpayOrder(order.id);
      if (!result?.success) throw new Error(result?.message || "Failed to initiate payment");
      const rpData = result?.data?.razorpay_order_id ? result.data : result?.message;
      if (!rpData?.razorpay_order_id) {
        console.error("[Razorpay] Invalid response:", JSON.stringify(result));
        throw new Error("Failed to initiate payment");
      }

      return new Promise((resolve, reject) => {
        const options = {
          key: rpData.key_id,
          amount: rpData.amount,
          currency: rpData.currency,
          name: "TekNode",
          description: `Order ${order.order_number}`,
          order_id: rpData.razorpay_order_id,
          prefill: {
            name: form.full_name,
            email: form.email,
            contact: form.phone,
          },
          theme: { color: "#6366F1" },
          handler: async (response) => {
            try {
              const verifyRes = await orderService.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (verifyRes?.success) {
                resolve(verifyRes);
              } else {
                reject(new Error(verifyRes?.message || "Payment verification failed"));
              }
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) => {
          reject(new Error(resp.error?.description || "Payment failed"));
        });
        rzp.open();
      });
    } catch (err) {
      throw err;
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    console.log("[Checkout] Submit attempt with email:", form.email);
    if (!validate()) return;
    setSaving(true);
    try {
      const normalizedEmail = String(form.email || "").trim().toLowerCase();
      const payload = {
        items: checkoutItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        customer: {
          full_name: form.full_name.trim(),
          email: normalizedEmail,
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        },
        payment_method: form.payment_method,
        create_account: form.create_account,
        coupon_code: appliedCoupon?.code || undefined,
      };
      console.log("[Checkout] Payload:", JSON.stringify(payload));
      const response = isAuthenticated
        ? await cartService.checkout(payload)
        : await guestOrderService.createOrder(payload);
      console.log("[Checkout] API response:", JSON.stringify(response));
      const order = response?.data?.order;
      if (!order) throw new Error("Order could not be created.");

      if (form.payment_method === "online") {
        await handleRazorpayPayment(order);
        order.payment_status = "paid";
      }

      if (isAuthenticated) {
        try { await cartService.clearCart(); } catch {}
      } else {
        guestCart.clearCart();
      }

      addToast("Order placed successfully! 🎉", "success");
      navigate("/order-confirmation", { state: { order } });
    } catch (err) {
      console.error("[Checkout] Error:", err);
      addToast(err?.message || "Unable to complete checkout.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // ── Empty cart state ──────────────────────────────────────────────────────
  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-background font-sans flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-3xl p-12 text-center max-w-md w-full shadow-2xl relative"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 mb-6">
            <Package size={26} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Your Cart is Empty</h1>
          <p className="mt-2 text-slate-400 text-sm">
            Add items to your cart and return here to complete your purchase.
          </p>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-all duration-200 shadow-lg shadow-indigo-500/20"
          >
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  // Calculate subtotal (original prices) and total savings from discount
  const { subtotal, totalSavings } = checkoutItems.reduce(
    (acc, i) => {
      const itemOriginalPrice = parseFloat(i.original_price || i.price || 0);
      const itemFinalPrice = parseFloat(i.final_price || i.price || 0);
      const itemOriginalTotal = itemOriginalPrice * Number(i.quantity || 0);
      const itemFinalTotal = itemFinalPrice * Number(i.quantity || 0);
      return {
        subtotal: acc.subtotal + itemOriginalTotal,
        totalSavings: acc.totalSavings + (itemOriginalTotal - itemFinalTotal),
      };
    },
    { subtotal: 0, totalSavings: 0 }
  );

  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_30%,rgba(99,102,241,0.07),transparent_70%)]" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">Checkout</h1>
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Cart
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] items-start">
          {/* ── LEFT SIDE: CUSTOMER & PAYMENT INFO ────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery Address Section */}
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-[20px] p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <MapPin size={16} className="text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Delivery Address</h2>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={(e) =>
                        handleChange("full_name", e.target.value)
                      }
                      placeholder="Your name"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address *</label>
                    <ValidatedEmailInput
                      name="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="you@example.com"
                      required={false}
                      className=""
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Pincode *</label>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={(e) => {
                        handleChange("pincode", e.target.value);
                        if (e.target.value.replace(/\D/g, "").length === 6) {
                          lookupPincode(
                            e.target.value,
                            (result) => {
                              handleChange("city", result.city);
                              handleChange("state", result.state);
                              setCityLocked(true);
                            },
                            () => {
                              setCityLocked(false);
                            }
                          );
                        } else {
                          setCityLocked(false);
                        }
                      }}
                      placeholder="6-digit postal code"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                {pincodeLoading && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 mt-1">
                    <Loader size={14} className="animate-spin" />
                    Fetching location...
                  </div>
                )}

                {pincodeError && (
                  <div className="text-xs text-rose-400 mt-1">{pincodeError}</div>
                )}

                <div>
                  <label className={labelCls}>Address *</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows={3}
                    placeholder="House number, street, area..."
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-150 font-medium resize-none"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>City *</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={(e) => {
                        handleChange("city", e.target.value);
                        setCityLocked(false);
                      }}
                      placeholder="e.g., Mumbai"
                      className={inputCls}
                      required
                      readOnly={cityLocked}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>State/Province *</label>
                    <input
                      name="state"
                      value={form.state}
                      onChange={(e) => {
                        handleChange("state", e.target.value);
                        setCityLocked(false);
                      }}
                      placeholder="e.g., Maharashtra"
                      className={inputCls}
                      required
                      readOnly={cityLocked}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-[20px] p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <CreditCard size={16} className="text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Payment Method</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label
                  className={`flex items-center gap-4 rounded-xl border-2 px-4 py-4 cursor-pointer transition-all duration-200 ${
                    form.payment_method === "cod"
                      ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={form.payment_method === "cod"}
                    onChange={() => handleChange("payment_method", "cod")}
                    className="h-4 w-4 cursor-pointer accent-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Cash on Delivery
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pay when you receive your order
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 rounded-xl border-2 px-4 py-4 cursor-pointer transition-all duration-200 ${
                    form.payment_method === "online"
                      ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="online"
                    checked={form.payment_method === "online"}
                    onChange={() => handleChange("payment_method", "online")}
                    className="h-4 w-4 cursor-pointer accent-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Online Payment
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Credit/Debit Cards, UPI, Net Banking
                    </p>
                  </div>
                </label>
              </div>

              {/* Premium Feature Badges */}
              <div className="bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl rounded-2xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Lock size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Secure Checkout</p>
                      <p className="text-[10px] text-slate-500">SSL Encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Fast Processing</p>
                      <p className="text-[10px] text-slate-500">Instant Confirmation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Protected Orders</p>
                      <p className="text-[10px] text-slate-500">Buyer Guarantee</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* ── RIGHT SIDE: ORDER SUMMARY ───────────────────────────────────── */}
          <aside className="lg:sticky lg:top-6 space-y-4">
            {/* Order Summary Card */}
            <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl rounded-[20px] shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />

              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono mb-1">Invoice Calculations</p>
                <h2 className="text-xl font-black text-white tracking-tight">Order Summary</h2>
                <p className="text-xs text-slate-500 mt-0.5">Review your order before proceeding to payment.</p>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-800/60 max-h-[280px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {checkoutItems.map((item) => (
                    <motion.div
                      key={item.cart_item_id || item.product_id}
                      className="flex items-center gap-3 px-6 py-4 hover:bg-slate-800/20 transition-colors duration-150"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <SafeImage
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-contain"
                            fallback={
                              <div className="flex h-full items-center justify-center text-slate-600">
                                <Package size={14} />
                              </div>
                            }
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-600">
                            <Package size={14} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {item.name}
                        </p>
                        {hasDiscount(item) ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400 line-through">
                              {formatCurrency(item.original_price || item.price)}
                            </span>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {Math.round(item.discount_percent)}% OFF
                            </span>
                            <span className="text-xs text-slate-400">
                              × {formatCurrency(item.final_price)}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mt-0.5">
                            × {formatCurrency(item.price || 0)}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          Qty {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-indigo-400 flex-shrink-0">
                        {formatCurrency(
                          parseFloat(item.final_price || item.price || 0) *
                            Number(item.quantity || 0),
                        )}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Coupon Section */}
              {isAuthenticated && (
                <div className="px-6 py-5 border-t border-slate-800 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Have a promo code?
                  </p>
                  {appliedCoupon ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-300">Coupon applied</p>
                            <p className="text-xs text-slate-300 font-mono">{appliedCoupon.code}</p>
                            <p className="text-xs text-slate-400">{appliedCoupon.offerName}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-300 whitespace-nowrap">
                          You save {formatCurrency(appliedCoupon.discount || 0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        disabled={couponBusy}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 disabled:opacity-50"
                      >
                        Remove Coupon
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          disabled={couponBusy}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            if (couponMessage) setCouponMessage(null);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter" && !couponBusy) handleApplyCoupon(); }}
                          placeholder="Enter coupon code"
                          aria-label="Coupon code"
                          className="flex-1 min-w-0 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white uppercase placeholder:normal-case placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponBusy}
                          className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
                        >
                          {couponBusy ? <Loader2 size={14} className="animate-spin" /> : "APPLY"}
                        </button>
                      </div>
                      {couponMessage && (
                        <p
                          data-testid="coupon-status-message"
                          className={`flex items-start gap-1.5 text-[11px] font-semibold leading-snug ${
                            couponMessage.type === "success" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {couponMessage.type === "success" ? (
                            <CheckCircle size={12} className="mt-px shrink-0" />
                          ) : (
                            <AlertCircle size={12} className="mt-px shrink-0" />
                          )}
                          {couponMessage.text}
                        </p>
                      )}
                    </div>
                  )}
                  <CouponOffers
                    coupons={availableCoupons}
                    loading={couponsLoading}
                    subtotal={Number(checkoutTotals.totalAmount || 0)}
                    appliedCode={appliedCoupon?.code || null}
                    busyCode={busyCode}
                    onApply={handleApplyCoupon}
                    onPrefill={setCouponInput}
                  />
                </div>
              )}

              {/* Price Breakdown */}
              <div className="px-6 py-5 border-t border-slate-800 bg-slate-950/30 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Subtotal (Original)</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-400">You Save</span>
                    <span className="font-semibold text-emerald-400">
                      -{formatCurrency(totalSavings)}
                    </span>
                  </div>
                )}
                {appliedCoupon && Number(appliedCoupon.discount) > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-indigo-400 flex items-center gap-1.5">
                      <CheckCircle size={13} />
                      Coupon ({appliedCoupon.code})
                    </span>
                    <span className="font-semibold text-emerald-400">
                      -{formatCurrency(appliedCoupon.discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Shipping</span>
                  <span className="font-semibold text-emerald-400">FREE</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-slate-800 pt-3">
                  <span className="font-bold text-white">Total Amount</span>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-mono tracking-tight">
                    {formatCurrency(Math.max(0, checkoutTotals.totalAmount - (Number(appliedCoupon?.discount) || 0)))}
                  </span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mx-6 mb-6 mt-2 rounded-xl bg-slate-950 border border-slate-800 px-4 py-3">
                <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Truck size={14} className="text-indigo-400" />
                  Estimated Delivery: 3–5 Business Days
                </p>
              </div>

              {/* Place Order Button */}
              <div className="px-6 pb-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl py-4 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.97] disabled:shadow-none"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500 font-medium mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck size={14} className="text-indigo-400" />
                  Secure checkout with SSL encryption
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}