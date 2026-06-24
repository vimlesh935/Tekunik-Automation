import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
  Star,
  ShieldCheck,
  Truck,
  RefreshCw,
  Layers,
  Sparkles,
} from "lucide-react";
import { productService, cartService, reviewService } from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";

export default function ProductDetails({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0, fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 });

  // Get all available images (gallery + main)
  const allImages = product
    ? [...(product.images || []).map((img) => img.image_url)]
    : [];

  // Ensure main image is included
  if (product?.image_url && !allImages.includes(product.image_url)) {
    allImages.unshift(product.image_url);
  }

  const currentImage =
    allImages[selectedImageIndex] || product?.image_url || null;

  useEffect(() => {
    // Reset all state on every id change so stale data never shows
    setProduct(null);
    setRelatedProducts([]);
    setSelectedImageIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await productService.getProductById(id);
        const productData = response.data;
        const loaded = productData?.product || productData;
        setProduct(loaded);

        // Fetch related products right after, using the freshly loaded data
        if (loaded?.category_id) {
          productService
            .getProductsByCategory(loaded.category_id, 1, 8)
            .then((res) => {
              const list = res?.data?.products || res?.data || [];
              setRelatedProducts(
                list.filter((p) => String(p.id) !== String(id)).slice(0, 6),
              );
            })
            .catch(() => {});
        }

        // Fetch product reviews
        reviewService.getProductReviews(id).then((res) => {
          const d = res.data;
          const s = d?.statistics || {};
          setReviews(d?.reviews || []);
          setReviewStats({
            averageRating: s.averageRating || 0,
            totalReviews: s.totalReviews || 0,
            fiveStar: s.fiveStar || 0,
            fourStar: s.fourStar || 0,
            threeStar: s.threeStar || 0,
            twoStar: s.twoStar || 0,
            oneStar: s.oneStar || 0,
          });
        }).catch(() => {});
      } catch (error) {
        console.warn("loadProduct error:", error);
        addToast(error?.message || "Unable to load product", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.stock_quantity <= 0) {
      addToast("This product is currently unavailable.", "warning");
      return;
    }

    if (!token) {
      addToCart(product, 1);
      addToast(`${product.name} added to cart! 🛒`, "success");
      return;
    }

    setAddingToCart(true);
    try {
      await cartService.addToCart(product.id, 1);
      addToast(`${product.name} added to cart! 🛒`, "success");
    } catch (error) {
      console.warn("addToCart error:", error);
      addToast(error?.message || "Unable to add item to cart.", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length,
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white py-12 relative overflow-hidden">
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Navigation Action Header */}
        <div className="mb-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-98"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-0.5 transition-transform"
            />{" "}
            Back to Shop
          </button>

          <div className="text-xs font-mono text-slate-500 hidden sm:block">
            SYSTEM INDEX // SKU-{id?.padStart(4, "0")}
          </div>
        </div>

        {loading ? (
          /* High-End Loading Micro-Grid Template */
          <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-slate-900 bg-slate-900/40 backdrop-blur-md shadow-2xl">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">
              Synchronizing Component Data Matrix...
            </span>
          </div>
        ) : product ? (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* ═══ LEFT COLUMN: INTERACTIVE HARDWARE GALLERY MATRIX (7 Cols) ═══ */}
            <div className="lg:col-span-7 space-y-4">
              {/* Primary Active Image Viewport */}
              <div className="relative aspect-square sm:aspect-[4/3] md:aspect-square w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 flex items-center justify-center group shadow-2xl">
                {currentImage ? (
                  <SafeImage
                    src={currentImage}
                    alt={product.name}
                    className="h-full w-full object-contain p-6 sm:p-12 transform group-hover:scale-102 transition-transform duration-700 ease-out"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-700">
                        <Package
                          size={64}
                          className="opacity-20 animate-pulse"
                        />
                      </div>
                    }
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600 font-mono text-xs">
                    [ NO DIAGRAM ATTACHED ]
                  </div>
                )}

                {/* Inline Slider Touch Helpers for Multi-image setups */}
                {allImages.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="w-10 h-10 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center backdrop-blur-sm pointer-events-auto shadow-xl transition active:scale-90"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="w-10 h-10 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center backdrop-blur-sm pointer-events-auto shadow-xl transition active:scale-90"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {/* Micro highlights badge mapping absolute view */}
                {/* <div className="absolute top-4 left-4">
                  <span className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-indigo-400 font-mono font-bold text-[10px] px-3 py-1 rounded-md tracking-wider shadow-md">
                    LIVE INSPECTION
                  </span>
                </div> */}
              </div>

              {/* Grid Thumbnail Index Selection Pipeline */}
              {allImages.length > 1 && (
                <div className="space-y-2">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {allImages.map((imgUrl, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 bg-slate-900 p-1.5 transition-all relative ${
                          selectedImageIndex === index
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-600/10"
                            : "border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        <SafeImage
                          src={imgUrl}
                          alt={`${product.name} Thumbnail ${index + 1}`}
                          className="w-full h-full object-contain"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-700 text-[10px] font-mono">
                              IMG
                            </div>
                          }
                        />
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] font-mono text-slate-500 text-right tracking-wide">
                    FRAME INVENTORY: {selectedImageIndex + 1} OF{" "}
                    {allImages.length}
                  </p>
                </div>
              )}
            </div>

            {/* ═══ RIGHT COLUMN: CONSOLIDATED SPECIFICATION AND CONSOLE (5 Cols) ═══ */}
            <div className="lg:col-span-5 space-y-6">
              {/* Product Metadata & Branding Headers */}
              <div className="space-y-4 text-left">
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-3.5 py-1 rounded-full text-xs uppercase tracking-widest backdrop-blur-sm">
                  <Layers size={12} />{" "}
                  {product.category_name || "IoT Component Array"}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  {product.name}
                </h1>

                {/* Rating Display */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= Math.round(reviewStats.averageRating) ? "fill-current" : "text-slate-600"}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-md">
                    {reviewStats.averageRating > 0 ? `${reviewStats.averageRating.toFixed(1)} / 5` : "0.0 / 5"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {reviewStats.totalReviews > 0 ? `${reviewStats.totalReviews} REVIEW${reviewStats.totalReviews > 1 ? "S" : ""}` : "NO REVIEWS YET"}
                  </span>
                </div>

                <div className="border-t border-slate-900 pt-4">
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                    {product.description ||
                      "High-performance solid-state engineering module constructed for automated network infrastructure and resilient sensory deployment environments."}
                  </p>
                </div>
              </div>

              {/* Price & Cart Processing Console Card Container */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/[0.02] to-transparent rounded-bl-full pointer-events-none" />

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* System Pricing Grid Block */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-900 p-4 text-left">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      Unit Cost Matrix
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      ₹{parseFloat(product.price).toFixed(2)}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Inc. GST Logistics
                    </span>
                  </div>

                  {/* Inventory Availability Track Block */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-900 p-4 text-left flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                        Node Status
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-bold">
                        {product.stock_quantity === 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs text-rose-400">
                            <AlertCircle size={12} /> Out of Stock
                          </span>
                        ) : product.stock_quantity < product.low_stock_limit ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                            <AlertCircle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                            <CheckCircle size={12} /> Available
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-mono text-slate-400">
                      {product.stock_quantity} units ready in hub
                    </p>
                  </div>
                </div>

                {/* Color Variants */}
                {product.colors && product.colors.length > 0 && (
                  <div className="rounded-xl bg-slate-950/80 border border-slate-900 p-4 text-left">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3">
                      Color Variants
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => {
                        const code =
                          color.color_code || color.code || "#475569";
                        const name =
                          color.color_name || color.name || "Default Array";
                        return (
                          <span
                            key={color.id || name}
                            className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-mono border bg-slate-900/50"
                            style={{ borderColor: code + "66" }}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-md flex-shrink-0 border border-white/10"
                              style={{ backgroundColor: code }}
                            />
                            <span className="text-slate-300 text-[11px] font-medium">
                              {name}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CTA Action Array Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0 || addingToCart}
                    className={`flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-xs uppercase tracking-wider font-bold transition-all duration-300 active:scale-98 ${
                      product.stock_quantity === 0
                        ? "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 shadow-lg shadow-indigo-600/10 border border-indigo-500/20"
                    }`}
                  >
                    {addingToCart ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={15} />
                    )}
                    {addingToCart ? "Deploying Node..." : " Add to Cart"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 px-6 py-4 text-xs uppercase tracking-wider font-bold text-slate-300 hover:text-white transition-all active:scale-98"
                  >
                    Review Cart Grid
                  </button>
                </div>
              </div>

              {/* E-Commerce Premium Trust Pipeline Badges */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col items-center justify-center">
                  <ShieldCheck size={16} className="text-indigo-400 mb-1" />
                  <span className="text-[10px] font-mono text-slate-400 block tracking-wide">
                    100% Genuine Tech
                  </span>
                </div>
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col items-center justify-center">
                  <Truck size={16} className="text-amber-400 mb-1" />
                  <span className="text-[10px] font-mono text-slate-400 block tracking-wide">
                    Express Delivery
                  </span>
                </div>
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl flex flex-col items-center justify-center">
                  <RefreshCw size={16} className="text-purple-400 mb-1" />
                  <span className="text-[10px] font-mono text-slate-400 block tracking-wide">
                    7-Day Return Grid
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Matrix Warning Fallback */
          <div className="rounded-3xl border border-slate-900 bg-slate-900/40 backdrop-blur-md p-16 text-center max-w-xl mx-auto shadow-2xl">
            <AlertCircle
              className="mx-auto text-amber-400 mb-4 animate-bounce"
              size={40}
            />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Product Not Found
            </h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              The targeted inventory node signature could not be located inside
              our network clusters. The item might have been unlisted or
              relocated.
            </p>
            <div className="mt-6">
              <Link
                to="/shop"
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all"
              >
                Return to Network Catalog
              </Link>
            </div>
          </div>
        )}

        {/* ═══ CUSTOMER REVIEWS SECTION ═══ */}
        {reviews.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Customer Reviews
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {reviewStats.totalReviews} VERIFIED REVIEW{reviewStats.totalReviews > 1 ? "S" : ""}
                </p>
              </div>
            </div>

            {/* Review Statistics Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-black text-white font-mono">
                      {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : "0.0"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={18} className={s <= Math.round(reviewStats.averageRating) ? "fill-current" : "text-slate-600"} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = star === 5 ? (reviewStats.fiveStar || 0) : star === 4 ? (reviewStats.fourStar || 0) : star === 3 ? (reviewStats.threeStar || 0) : star === 2 ? (reviewStats.twoStar || 0) : (reviewStats.oneStar || 0);
                    const pct = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 w-8">{star}★</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-mono text-slate-500 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={15}
                          className={s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅ Verified Buyer</span>
                    <span className="text-xs font-bold text-slate-300">
                      {review.first_name || review.last_name ? `${review.first_name || ""} ${review.last_name || ""}`.trim() : "Verified Customer"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(review.created_at).toLocaleDateString("en-IN", {
                        year: "numeric", month: "short", day: "numeric"
                      })}
                    </span>
                  </div>
                  {review.review_title && (
                    <h4 className="text-sm font-bold text-white mb-1">{review.review_title}</h4>
                  )}
                  {review.review_message && (
                    <p className="text-sm text-slate-400 leading-relaxed">{review.review_message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ RELATED PRODUCTS SECTION ═══ */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Related Products
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    MORE FROM{" "}
                    {product?.category_name?.toUpperCase() || "THIS CATEGORY"}
                  </p>
                </div>
              </div>
              <Link
                to={`/shop`}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 px-4 py-2 rounded-xl transition-all"
              >
                View All
              </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/product/${rp.id}`}
                  onClick={() => setSelectedImageIndex(0)}
                  className="group flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/50 hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300 overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-slate-900 overflow-hidden">
                    {rp.image_url ? (
                      <SafeImage
                        src={rp.image_url}
                        alt={rp.name}
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center text-slate-700">
                            <Package size={28} className="opacity-30" />
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Package size={28} className="opacity-30" />
                      </div>
                    )}
                    {/* Inventory Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${
                        rp.stock_quantity === 0
                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                          : rp.stock_quantity < (rp.low_stock_limit || 5)
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {rp.stock_quantity === 0 ? '❌' : rp.stock_quantity < (rp.low_stock_limit || 5) ? '⚠' : '✅'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1.5 flex-1">
                    <p className="text-xs font-semibold text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                      {rp.name}
                    </p>
                    <p className="text-xs font-black text-indigo-400 font-mono mt-auto">
                      ₹{parseFloat(rp.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
