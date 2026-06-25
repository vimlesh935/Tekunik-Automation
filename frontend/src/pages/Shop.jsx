import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Package,
  Star,
  Layers,
  Cpu,
  LayoutGrid,
  SlidersHorizontal,
  Eye,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productService, cartService } from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";

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

  const formatted =
    otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  return `₹${formatted}`;
}

// Framer Motion Orchestration Grid Configs
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export default function Shop({ token }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const LIMIT = 12;

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const selectedCategory =
    queryParams.get("category_id") || queryParams.get("category");
  const selectedApplication = queryParams.get("application");
  const normalizedCategoryId = useMemo(() => {
    if (!selectedCategory) return "";
    const parsed = Number(String(selectedCategory).trim());
    return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : "";
  }, [selectedCategory]);

  useEffect(() => {
    setPage(1); // Reset page index when category filter changes
  }, [normalizedCategoryId, selectedApplication]);

  useEffect(() => {
    fetchProducts();
  }, [page, normalizedCategoryId, selectedApplication]);

  const fetchProducts = async () => {
    setLoading(true);
    setProducts([]);
    try {
      let response;
      if (selectedApplication) {
        response = await productService.getProductsByApplication(
          selectedApplication,
          page,
          LIMIT,
        );
      } else {
        response = await productService.getAllProducts(
          page,
          LIMIT,
          "",
          normalizedCategoryId,
        );
      }
      console.log("[Shop] API response:", JSON.stringify(response).slice(0, 500));
      const data = response?.data || response;
      const nextProducts = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
      console.log(`[Shop] Products found: ${nextProducts.length}`);
      const visibleProducts = nextProducts.filter(Boolean);
      setProducts(visibleProducts);
      setTotalProducts(data?.pagination?.total || nextProducts.length || 0);
      setTotalPages(data?.pagination?.pages || 1);
    } catch (error) {
      console.error("[Shop] fetchProducts error:", error);
      setNotification(error?.message || "Unable to load products");
      setTimeout(() => setNotification(""), 3000);
    } finally {
      if (loading !== false) setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (product.stock_quantity === 0) {
      addToast(`${product.name} is out of stock`, "warning");
      return;
    }

    if (!token) {
      addToCart(product, 1);
      addToast(`${product.name} added to cart! 🛒`, "success");
      return;
    }

    try {
      await cartService.addToCart(product.id, 1);
      addToast(`${product.name} added to cart! 🛒`, "success");
    } catch (error) {
      addToast(error.message || "Unable to add to cart", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans antialiased selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Premium Cyber Background Radiance Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-purple-600/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Decorative Elite Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dynamic Toast / Alerts Channel */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-5 py-3 text-sm text-rose-400 flex items-center gap-3 shadow-lg shadow-rose-950/20 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {notification}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Header */}
        {(selectedCategory || selectedApplication) && (
          <div className="flex items-end justify-between border-b border-slate-900 pb-6 mb-10">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
                {selectedApplication || products[0]?.category_name || "Category"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {totalProducts} Products
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg"
            >
              <ChevronLeft size={14} /> All {selectedApplication ? "Applications" : "Categories"}
            </Link>
          </div>
        )}

        {/* ═══ MAIN STORE CATALOG RUNTIME ═══ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 bg-slate-900/30 border border-slate-900 rounded-2xl shadow-2xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Compiling System Inventories...
              </span>
              <p className="text-[11px] text-slate-600 font-mono">
                Loading data payload from storage blocks
              </p>
            </div>
          </div>
        ) : products.length > 0 ? (
          /* Grid Matrix Container */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/[0.03] relative block text-left"
                /* Entire card functions as link container layout down to the pixel */
                onClick={() => navigate(`/product/${product.id}`)}
                style={{ cursor: "pointer" }}
              >
                {/* Main Component Image Bay */}
                <div className="relative w-full h-48 bg-slate-950 border border-slate-800/60 rounded-xl overflow-hidden flex items-center justify-center mb-4 group-hover:border-slate-700 transition-colors duration-300">
                  {product.image_url ? (
                    <SafeImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain  rounded-xl overflow-hidden transition-transform duration-500 ease-out"
                      fallback={
                        <Cpu
                          size={36}
                          className="text-slate-800 animate-pulse"
                        />
                      }
                    />
                  ) : (
                    <Cpu size={36} className="text-slate-800" />
                  )}

                  {/* Digital Telemetry Stock Badges */}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border backdrop-blur-md shadow-lg ${
                        Number(product.stock_quantity) === 0
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                          : Number(product.stock_quantity) < Number(product.low_stock_limit || 5)
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {Number(product.stock_quantity) === 0
                        ? "❌ Out of Stock"
                        : Number(product.stock_quantity) < Number(product.low_stock_limit || 5)
                          ? "⚠ Low Stock"
                          : "✅ Available"}
                    </span>
                  </div>

                  {/* Glassmorphic Sold Out Shield */}
                  {product.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl bg-slate-900 shadow-xl shadow-black/50">
                        Allocation Empty
                      </span>
                    </div>
                  )}
                </div>

                {/* Component Specifications Info Meta Panel */}
                <div className="flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                      {product.category_name || "IoT Hardware"}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 line-clamp-1 transition-colors duration-150">
                        {product.name}
                      </h3>
                    </div>

                    {/* Customer Reviews Rating */}
                    <div className="flex items-center gap-2">
                      {product.reviews?.totalReviews > 0 ? (
                        <>
                          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                            {product.reviews.averageRating.toFixed(1)}{" "}
                            <Star
                              size={9}
                              className="fill-amber-400 text-transparent"
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            ({product.reviews.totalReviews} Review{product.reviews.totalReviews > 1 ? "s" : ""})
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Star size={12} className="text-slate-600" />
                          <span className="text-[11px] text-slate-500 font-medium">
                            No Reviews Yet
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Precise Pricing Structural Geometry */}
                    <div className="flex items-baseline justify-between pt-2">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-white tracking-tight">
                          {formatIndianPrice(product.price)}
                        </span>
                        {product.sale_price &&
                          parseFloat(product.sale_price) <
                            parseFloat(product.price) && (
                            <span className="text-xs text-slate-500 line-through mt-0.5">
                              {formatIndianPrice(product.sale_price)}
                            </span>
                          )}
                      </div>
                      {product.discount_percent > 0 && (
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black px-2 py-1 rounded-md tracking-wider uppercase">
                          {Math.round(product.discount_percent)}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core Action Executables */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={product.stock_quantity === 0}
                      className="w-full bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-200 hover:text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:bg-slate-950 disabled:text-slate-600 disabled:border-slate-900/50 disabled:pointer-events-none active:scale-[0.97]"
                    >
                      <ShoppingCart
                        size={13}
                        className={
                          product.stock_quantity === 0
                            ? "opacity-30"
                            : "text-indigo-400 group-hover:text-white transition-colors"
                        }
                      />
                      {product.stock_quantity === 0
                        ? "Unavailable"
                        : "Order Now"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* Empty Catalog System State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-slate-900 bg-slate-900/20 backdrop-blur-sm rounded-2xl p-16 text-center max-w-md mx-auto shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-5 text-slate-500 shadow-inner">
              <Package size={28} className="opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 tracking-tight">
              No Products Found
            </h3>
            <p className="mt-2 text-sm text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              No products are currently available in this category.
            </p>
          </motion.div>
        )}

        {/* ═══ PREMIUM PAGINATION CONTROLS ═══ */}
        {!loading && totalPages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-3 border-t border-slate-900/60 pt-8">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-20 disabled:border-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-2.5 shadow-inner">
              <span className="text-xs font-bold text-slate-500 tracking-wide font-mono">
                Index{" "}
                <span className="text-indigo-400 font-black px-1">{page}</span>{" "}
                / {totalPages}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-20 disabled:border-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              Next Node <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
