import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, Shield, CheckCircle, Loader2, ArrowRight, X } from "lucide-react";
import { productService, cartService, wishlistService } from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { formatPrice, hasDiscount } from "../utils/discount.js";
import SafeImage from "./SafeImage.jsx";
import WishlistHeart from "./WishlistHeart.jsx";
import CompareButton from "./CompareButton.jsx";

const QUICK_VIEW_TIMEOUT = 300;

export default function QuickViewModal({
  isOpen,
  onClose,
  product,
  wishlist = [],
  onToggleWishlist,
  compareProducts = [],
}) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const modalRef = useRef(null);

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) setShow(true);
    else setShow(false);
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShow(false);
      onClose();
    }
  };

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShow(false);
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [onClose]);

  const toggleWishlist = async (productId) => {
    if (addingToWishlist.has(productId)) return;
    setAddingToWishlist((prev) => new Map(prev).set(productId, true));
    const alreadyIn = wishlist.includes(Number(productId));
    try {
      if (isAuthenticated) {
        if (alreadyIn) {
          await wishlistService.removeFromWishlist(productId);
        } else {
          await wishlistService.addToWishlist(productId);
        }
      } else {
        const guestWishlist = JSON.parse(
          localStorage.getItem("wishlist_guest") || "[]"
        );
        if (alreadyIn) {
          localStorage.setItem(
            "wishlist_guest",
            JSON.stringify(guestWishlist.filter((id) => Number(id) !== Number(productId)))
          );
        } else {
          guestWishlist.push(productId);
          localStorage.setItem("wishlist_guest", JSON.stringify(guestWishlist));
        }
      }
      await fetchWishlist();
    } catch (error) {
      console.warn("toggleWishlist error:", error);
      addToast("Failed to update wishlist", "error");
    } finally {
      setAddingToWishlist((prev) => {
        const next = new Map(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const fetchWishlist = async () => {
    if (isAuthenticated) {
      try {
        const response = await wishlistService.getWishlist();
        const items = response?.wishlist || response?.data?.wishlist || [];
        setWishlist(
          Array.isArray(items) ? items.map((item) => Number(item.product_id || item)) : []
        );
      } catch (error) {
        console.warn("fetchWishlist error:", error);
        setWishlist([]);
      }
    } else {
      const guestWishlist = JSON.parse(
        localStorage.getItem("wishlist_guest") || "[]"
      );
      setWishlist(guestWishlist.map((id) => Number(id)));
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const handleAddToCart = async (productId, quantity = 1) => {
    if (product.stock_quantity <= 0) {
      addToast(`${product.name} is out of stock`, "warning");
      return;
    }

    if (!isAuthenticated) {
      addToCart(productId, quantity);
      addToast(`${product.name} added to cart! 🛒`, "success");
      return;
    }

    setLoading(true);
    try {
      await cartService.addToCart(productId, quantity);
      addToast(`${product.name} added to cart! 🛒`, "success");
    } catch (error) {
      addToast(error.message || "Unable to add to cart", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return null;
  }

  const discountPercent = product.discount_percent || 0;
  const originalPrice = product.original_price || product.price;
  const finalPrice = product.final_price || product.price;
  let discountAmount = 0;
  if (discountPercent > 0) {
    discountAmount = Math.round((originalPrice * discountPercent) / 100 * 100) / 100;
  }

  return (
    <AnimatePresence>
      {show && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleOutsideClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShow(false);
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] p-6 shadow-2xl"
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Product Image */}
              <div>
                {product.image_url ? (
                  <SafeImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-64 sm:h-[400px] object-cover rounded-xl mb-4"
                  />
                ) : (
                  <div
                    className="w-full h-64 sm:h-[400px] bg-slate-800 rounded-xl flex items-center justify-center mb-4"
                  >
                    <Loader2 size={32} className="text-slate-700 animate-pulse" />
                    <span className="text-[10px] text-slate-500">No Image</span>
                  </div>
                )}

                {/* Category */}
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
                  {product.category_name || "IoT Component"}
                </div>

                {/* Wishlist Button */}
                <div className="mt-4">
                  {onToggleWishlist && (
                    <WishlistHeart
                      productId={product.id}
                      product={product}
                      isInWishlist={wishlist.includes(Number(product.id))}
                      onToggle={toggleWishlist}
                    />
                  )}
                </div>
              </div>

              {/* Right: Product Details */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {product.name}
                </h2>

                {/* Rating */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <span
                        key={rating}
                        className={
                          rating <= Math.round(product.averageRating || 0)
                            ? "fill-current text-amber-400"
                            : "text-slate-600"
                        }
                        size={14}
                      />
                    ))}
                    <span className="text-xs text-slate-500 font-medium">
                      {product.averageRating > 0
                        ? `${product.averageRating.toFixed(1)} / 5`
                        : "0.0 / 5"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {product.totalReviews > 0 ? `${product.totalReviews} Review${product.totalReviews > 1 ? "s" : ""}` : "No Reviews Yet"}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {/* Discount badge */}
                  {hasDiscount(product) && (
                    <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider uppercase shadow-sm">
                      {Math.round(product.discount_percent)}% OFF
                    </span>
                  )}

                  {/* Final price */}
                  <p className="text-2xl font-bold text-white mb-1">
                    {formatPrice(finalPrice)}
                  </p>

                  {/* Original price with strikethrough */}
                  {hasDiscount(product) && (
                    <p className="text-[10px] text-slate-500 line-through">
                      {formatPrice(originalPrice)}
                    </p>
                  )}

                  {/* Stock status */}
                  <p className="text-sm mt-2">
                    {product.stock_quantity === 0
                      ? "❌ Out of Stock"
                      : product.stock_quantity < product.low_stock_limit
                        ? "⚠ Low Stock"
                        : `✅ ${product.stock_quantity} units available`}
                  </p>
                </div>

                {/* Key specifications / description snippet */}
                <div className="mb-4">
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {product.short_description ||
                      product.description ||
                      "High-performance component for smart home automation."}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  {/* Add to Cart */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product.id);
                    }}
                    disabled={product.stock_quantity <= 0 || loading}
                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all hover:from-indigo-500 hover:to-indigo-800 shadow-lg shadow-indigo-600/10 border border-indigo-500/20 disabled:bg-slate-950 disabled:text-slate-600 disabled:border-slate-900/50 disabled:pointer-events-none active:scale-[0.97]"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin mr-2" />Deploying Node...
                      ) : (
                      <>
                        <ShoppingCart size={14} /> Add to Cart
                      )}
                    </button>

                    <CompareButton productId={product.id} compact />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}