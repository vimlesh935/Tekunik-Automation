import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, CheckCircle, AlertCircle, Loader2, Package } from "lucide-react";
import { productService, cartService } from "../services/api";
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

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await productService.getProductById(id);
        const productData = response.data;
        setProduct(productData?.product || productData);
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

  return (
    <div className="min-h-screen bg-page text-primary transition-colors duration-300 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
        >
          <ArrowLeft size={18} /> Back to shop
        </button>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/10 bg-gray-900/70">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : product ? (
          <div className="grid gap-10 xl:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gray-900/70">
              {product.image_url ? (
                <SafeImage
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  fallback={<div className="flex h-96 items-center justify-center bg-gray-800 text-gray-500"><Package size={48} className="opacity-30" /></div>}
                />
              ) : (
                <div className="flex h-96 items-center justify-center bg-gray-800 text-gray-500">
                  No image available.
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm uppercase tracking-[0.25em] text-cyan-300">
                  {product.category_name || "General"}
                </div>
                <h1 className="text-4xl font-bold text-white">{product.name}</h1>
                <p className="max-w-2xl text-gray-400 leading-8">{product.description || "No long description available for this product."}</p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-gray-950/80 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Price</p>
                    <p className="mt-3 text-3xl font-semibold text-cyan-400">₹{parseFloat(product.price).toFixed(2)}</p>
                  </div>
                  <div className="rounded-3xl bg-gray-950/80 p-5">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Availability</p>
                    <div className="mt-3 flex items-center gap-2 text-base font-semibold">
                      {product.stock_quantity > 0 ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
                          <CheckCircle size={16} /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-red-300">
                          <AlertCircle size={16} /> Out of Stock
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-400">{product.stock_quantity} unit(s) available</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0 || addingToCart}
                    className={`inline-flex items-center gap-3 rounded-3xl px-6 py-4 text-sm font-semibold transition ${
                      product.stock_quantity === 0
                        ? "bg-gray-700/70 text-gray-400 cursor-not-allowed"
                        : "bg-cyan-500 text-black hover:bg-cyan-400"
                    }`}
                  >
                    {addingToCart ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-white hover:border-cyan-500/50 hover:bg-white/10 transition"
                  >
                    View Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-gray-900/70 p-12 text-center">
            <p className="text-xl font-semibold text-white">Product not found.</p>
            <p className="mt-2 text-gray-400">Try returning to the shop to see available products.</p>
          </div>
        )}
      </div>
    </div>
  );
}
