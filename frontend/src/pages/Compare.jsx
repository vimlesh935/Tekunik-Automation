import { useEffect, useState } from "react";
import { ArrowLeft, Check, GitCompareArrows, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { productService, cartService, wishlistService } from "../services/api";
import { useComparison } from "../context/ComparisonContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import SafeImage from "../components/SafeImage.jsx";
import { formatPrice } from "../utils/discount.js";

const value = (product, key) => {
  if (key === "price") return formatPrice(product.final_price || product.price);
  if (key === "original_price") return formatPrice(product.original_price || product.price);
  if (key === "rating") return product.reviews?.totalReviews ? `${Number(product.reviews.averageRating).toFixed(1)} (${product.reviews.totalReviews})` : "Not available";
  if (key === "stock") return Number(product.stock_quantity) > 0 ? "Available" : "Out of stock";
  if (key === "features") {
    try {
      const features = Array.isArray(product.features) ? product.features : JSON.parse(product.features || "[]");
      return features.length ? features.join(", ") : "N/A";
    } catch { return product.features || "N/A"; }
  }
  if (key === "applications") {
    try {
      const applications = Array.isArray(product.applications) ? product.applications : JSON.parse(product.applications || "[]");
      return applications.length ? applications.join(", ") : "N/A";
    } catch { return product.applications || "N/A"; }
  }
  const result = product[key];
  return result === null || result === undefined || result === "" ? "N/A" : String(result);
};

const rows = [
  ["Category", "category_name"], ["Brand", "brand"], ["Price", "price"], ["Original price", "original_price"],
  ["Rating", "rating"], ["Availability", "stock"], ["Description", "description"], ["Features", "features"],
];

export default function Compare() {
  const { ids, addProduct, removeProduct, clearProducts } = useComparison();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const selectedCategoryId = (() => {
    const counts = new Map();
    products.forEach((product) => {
      const id = Number(product.category_id);
      if (Number.isInteger(id) && id > 0) counts.set(id, (counts.get(id) || 0) + 1);
    });
    return [...counts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] || null;
  })();
  const selectedCategoryName = products.find((product) => Number(product.category_id) === selectedCategoryId)?.category_name;
  const availableCategoryProducts = categoryProducts.filter((product) =>
    !ids.includes(Number(product.id)) &&
    String(product.name || "").toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );

  const openProductPicker = () => {
    setShowProductPicker(true);
    setCategorySearch("");
    setCategoryError("");
  };

  useEffect(() => {
    if (!showProductPicker || !selectedCategoryId) return;
    setCategoryLoading(true);
    try {
      productService.getProductsByCategory(selectedCategoryId, 1, 100)
        .then((response) => setCategoryProducts(response?.data?.products || []))
        .catch((error) => setCategoryError(error.message || "Unable to load products. Please try again."))
        .finally(() => setCategoryLoading(false));
    } catch (error) {
      setCategoryError(error.message || "Unable to load products. Please try again.");
      setCategoryLoading(false);
    }
  }, [showProductPicker, selectedCategoryId]);

  const addCategoryProduct = (product) => {
    const result = addProduct(product.id);
    if (result.reason === "limit") {
      addToast("Maximum 4 products can be compared.", "warning");
      return;
    }
    if (result.ok) {
      setShowProductPicker(false);
      addToast("Product added to comparison", "success");
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!ids.length) { setProducts([]); setLoading(false); return undefined; }
    setLoading(true);
    productService.compareProducts(ids).then((response) => {
      if (!mounted) return;
      const loaded = response?.data?.products || [];
      setProducts(loaded);
      ids.filter((id) => !loaded.some((product) => Number(product.id) === id)).forEach(removeProduct);
    }).catch((error) => addToast(error.message || "Unable to load comparison", "error")).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [ids]);

  useEffect(() => {
    if (!isAuthenticated) {
      try { setWishlist(JSON.parse(localStorage.getItem("wishlist_guest") || "[]").map(Number)); } catch { setWishlist([]); }
      return;
    }
    wishlistService.getWishlist().then((response) => setWishlist((response?.wishlist || response?.data?.wishlist || []).map((item) => Number(item.product_id || item)))).catch(() => {});
  }, [isAuthenticated]);

  const toggleWishlist = async (id) => {
    const selected = wishlist.includes(Number(id));
    try {
      if (isAuthenticated) {
        if (selected) await wishlistService.removeFromWishlist(id); else await wishlistService.addToWishlist(id);
      } else {
        const guest = JSON.parse(localStorage.getItem("wishlist_guest") || "[]").map(Number);
        const next = selected ? guest.filter((item) => item !== Number(id)) : [...guest, Number(id)];
        localStorage.setItem("wishlist_guest", JSON.stringify([...new Set(next)]));
      }
      setWishlist((previous) => selected ? previous.filter((item) => item !== Number(id)) : [...previous, Number(id)]);
      addToast(selected ? "Removed from wishlist" : "Added to wishlist", "success");
    } catch (error) { addToast(error.message || "Unable to update wishlist", "error"); }
  };

  const addCart = async (product) => {
    if (Number(product.stock_quantity) <= 0) return addToast("Product is out of stock", "warning");
    try {
      if (isAuthenticated) await cartService.addToCart(product.id, 1); else addToCart(product, 1);
      addToast(`${product.name} added to cart`, "success");
    } catch (error) { addToast(error.message || "Unable to add to cart", "error"); }
  };

  return <div className="min-h-screen bg-page px-4 py-10 text-primary sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><Link to="/shop" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> Continue Shopping</Link><h1 className="text-3xl font-black text-white sm:text-4xl">Compare Products</h1><p className="mt-2 text-sm text-slate-400">Compare products side by side and choose the right one.</p></div>
        {products.length > 0 && <button type="button" onClick={clearProducts} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-rose-400/50 hover:text-rose-300"><Trash2 size={15} /> Clear All</button>}
      </div>
      {products.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <SafeImage src={product.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-slate-950 object-contain" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{product.name}</p><p className="text-xs text-slate-500">{product.category_name || "Category unavailable"}</p></div>
            </div>
          ))}
          {ids.length < 4 && <button type="button" onClick={openProductPicker} className="flex min-h-[74px] items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-400/5 text-sm font-semibold text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/10"><Plus size={18} /> Add Product</button>}
        </div>
      )}
      {loading ? <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-16 text-center text-sm text-slate-400"><GitCompareArrows className="mx-auto mb-3 animate-pulse text-cyan-400" />Loading comparison...</div> : products.length === 0 ? <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-16 text-center"><GitCompareArrows className="mx-auto mb-4 text-slate-600" size={40} /><h2 className="text-xl font-bold text-white">Compare Products</h2><p className="mt-2 text-sm text-slate-400">Select products from the shop to compare them.</p><Link to="/shop" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500">Continue Shopping</Link></div> : products.length === 1 ? <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-8 text-center text-amber-200">Add at least one more product to compare.</div> : <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr><th className="w-40 border-b border-slate-800 p-4 text-xs uppercase tracking-wider text-slate-500">Product</th>{products.map((product) => <th key={product.id} className="border-b border-l border-slate-800 p-4 align-top"><div className="flex min-w-44 flex-col gap-3"><SafeImage src={product.image_url} alt={product.name} className="h-32 w-full rounded-lg object-contain bg-slate-950" /><Link to={`/product/${product.id}`} className="font-bold text-white hover:text-cyan-300">{product.name}</Link><div className="flex flex-wrap gap-2"><button type="button" onClick={() => addCart(product)} className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-2 text-xs font-bold text-white"><ShoppingCart size={13} /> Cart</button><button type="button" onClick={() => toggleWishlist(product.id)} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-2 text-xs text-slate-300">{wishlist.includes(Number(product.id)) ? <Check size={13} /> : null} Wishlist</button><button type="button" onClick={() => removeProduct(product.id)} aria-label={`Remove ${product.name}`} className="rounded-md border border-slate-700 p-2 text-slate-400 hover:text-rose-300"><Trash2 size={13} /></button></div></div></th>)}</tr></thead><tbody>{rows.map(([label, key]) => <tr key={key}><th className="border-b border-slate-800 p-4 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</th>{products.map((product) => <td key={product.id} className="max-w-xs border-b border-l border-slate-800 p-4 text-sm text-slate-300">{value(product, key)}</td>)}</tr>)}</tbody></table></div>}
      {showProductPicker && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="compare-picker-title">
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="compare-picker-title" className="text-xl font-bold text-white">Add Product to Compare</h2><p className="mt-1 text-sm text-slate-400">Choose another product from {selectedCategoryName || "this category"}.</p></div><button type="button" onClick={() => setShowProductPicker(false)} aria-label="Close product picker" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18} /></button></div>
            {!selectedCategoryId ? <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">More products cannot be suggested because this product has no category.</p> : <><div className="relative mb-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder={`Search ${selectedCategoryName || "category"}...`} className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-400" /></div>{categoryLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading products...</div> : categoryError ? <p className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-300">{categoryError}</p> : availableCategoryProducts.length ? <div className="space-y-2">{availableCategoryProducts.map((product) => <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"><SafeImage src={product.image_url} alt="" className="h-14 w-14 rounded-lg bg-slate-900 object-contain" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{product.name}</p><p className="text-sm text-cyan-300">{formatPrice(product.final_price || product.price)}</p></div><button type="button" onClick={() => addCategoryProduct(product)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Add</button></div>)}</div> : <p className="rounded-xl border border-slate-800 p-5 text-center text-sm text-slate-400">You're comparing the only available product in this category.</p>}</>}
          </div>
        </div>
      )}
    </div>
  </div>;
}
