import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ChevronLeft, ChevronRight, Package, Eye, Star, Layers } from "lucide-react";
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
  
  const formatted = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  return `₹${formatted}`;
}

export default function Shop({ token }) {
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();
  const LIMIT = 12;

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts(page, LIMIT);
      const { data } = response;
      setProducts(data?.products || []);
      setTotalPages(data?.pagination?.pages || 1);
    } catch (error) {
      console.warn("fetchProducts error:", error);
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
    <div className="min-h-screen bg-[#f1f3f6] text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Notification Toast */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-5 py-3 text-sm text-rose-700 flex items-center gap-3 animate-slide-down">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            {notification}
          </div>
        </div>
      )}

      {/* ═══ PRODUCTS GRID ═══ */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fetching store catalog...</span>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <div key={product.id}
                className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden p-4 flex flex-col justify-between transition-all hover:shadow-lg relative">
                
                {/* Product Image */}
                <div className="relative w-full h-44 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center mb-3.5">
                  {product.image_url ? (
                    <SafeImage src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2 mix-blend-multiply" fallback={<Package size={32} className="text-slate-300" />} />
                  ) : (
                    <Package size={32} className="text-slate-300" />
                  )}
                  
                  {/* Stock Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border bg-white shadow-sm ${
                      product.stock_quantity === 0 
                        ? "border-red-200 text-red-600" 
                        : product.stock_status === "limited_stock" 
                          ? "border-amber-200 text-amber-600" 
                          : "border-emerald-200 text-emerald-600"
                    }`}>
                      {product.stock_quantity === 0 ? "Out" : product.stock_status === "limited_stock" ? "Limited" : "In Stock"}
                    </span>
                  </div>

                  {product.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600 border border-red-200 px-3 py-1.5 rounded-lg bg-white shadow-sm">Sold Out</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-grow flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide block">
                      {product.category_name || "IoT Hardware"}
                    </span>
                    <Link to={`/product/${product.id}`} className="block">
                      <h3 className="text-sm font-bold text-slate-800 hover:text-blue-600 line-clamp-1 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Rating indicator */}
                    <div className="flex items-center gap-1.5">
                      <div className="bg-emerald-600 text-white font-bold text-[11px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        4.5 <Star size={9} className="fill-white text-transparent" />
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">(42 ratings)</span>
                    </div>

                    {/* Price - Indian format */}
                    <div className="flex items-baseline gap-2 pt-1.5">
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatIndianPrice(product.price)}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        {formatIndianPrice(parseFloat(product.price) * 1.25)}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold">20% off</span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="pt-3.5 mt-3 border-t border-slate-100">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }} 
                      disabled={product.stock_quantity === 0}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-[0.97] disabled:pointer-events-none"
                    >
                      <ShoppingCart size={13} />
                      {product.stock_quantity === 0 ? "Unavailable" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-slate-200 bg-white rounded-2xl p-16 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5 text-slate-400">
              <Package size={28} className="opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">No products available</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              Check back soon for new inventory arrivals.
            </p>
          </div>
        )}

        {/* ═══ PAGINATION ═══ */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            
            <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 shadow-sm">
              <span className="text-xs font-bold text-slate-500">
                Page <span className="text-blue-600 font-black px-1">{page}</span> of {totalPages}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}