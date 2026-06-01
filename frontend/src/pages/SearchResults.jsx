import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { productService, cartService } from "../services/api";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";

export default function SearchResults({ token }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const query = new URLSearchParams(location.search).get("q")?.trim() || "";

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setSearchTerm(query);
    const loadResults = async () => {
      setLoading(true);
      try {
        const response = await productService.searchProducts(query, 24);
        const searchData = response.data;
        setProducts(searchData?.products || []);
      } catch (error) {
        console.warn("searchProducts error:", error);
        addToast(error?.message || "Unable to search products", "error");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [query]);

  const handleAddToCart = async (product) => {
    if (product.stock_quantity === 0) {
      addToast("Product is out of stock", "warning");
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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <div className="min-h-screen bg-page text-primary transition-colors duration-300 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="text-4xl font-bold">Search results</h1>
            <p className="mt-2 text-gray-400">Showing matches for <span className="text-cyan-300">{query || "your query"}</span></p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products again"
              className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            />
          </form>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-16 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border-t-2 border-b-2 border-cyan-400 animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="rounded-3xl border border-gray-800 bg-gray-900/70 p-5 transition hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10">
                  <div className="space-y-4">
                    <div className="rounded-3xl overflow-hidden bg-gray-800">
                      {product.image_url ? (
                        <SafeImage
                          src={product.image_url}
                          alt={product.name}
                          className="h-56 w-full object-cover"
                          fallback={<div className="flex h-56 items-center justify-center text-gray-500">No image</div>}
                        />
                      ) : (
                        <div className="flex h-56 items-center justify-center text-gray-500">No image</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{product.category_name || "General"}</p>
                      <h2 className="text-xl font-semibold text-white">{product.name}</h2>
                      <p className="text-sm text-gray-400 line-clamp-3">{product.description || "No description available."}</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 p-4 text-sm text-gray-300">
                        Price <span className="block mt-2 text-cyan-300 text-lg font-semibold">₹{parseFloat(product.price).toFixed(2)}</span>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4 text-sm text-gray-300">
                        Stock <span className="block mt-2 text-white text-lg font-semibold">{product.stock_quantity}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_quantity === 0}
                        className={`inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                          product.stock_quantity === 0
                            ? "bg-gray-700/70 text-gray-400 cursor-not-allowed"
                            : "bg-cyan-500 text-black hover:bg-cyan-400"
                        }`}
                      >
                        <ShoppingCart size={16} /> Add to Cart
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-cyan-500/50 hover:bg-white/10 transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-3xl border border-white/10 bg-gray-900/70 p-16 text-center">
                <p className="text-xl font-semibold text-white">No results found.</p>
                <p className="mt-3 text-gray-400">Try another search term or browse the store.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
