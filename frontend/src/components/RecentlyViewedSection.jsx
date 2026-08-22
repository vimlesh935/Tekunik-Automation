import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, ShoppingCart, Trash2, X } from "lucide-react";
import SafeImage from "./SafeImage.jsx";
import { formatPrice, hasDiscount } from "../utils/discount.js";

export default function RecentlyViewedSection({
  products = [],
  onRemove,
  onClear,
  onAddToCart,
  wishlist = [],
  onToggleWishlist,
  compact = false,
}) {
  const confirmClear = () => {
    if (window.confirm("Clear your recently viewed products?")) onClear?.();
  };

  return (
    <section className={compact ? "rounded-xl bg-slate-900 border border-slate-800/80 p-5 sm:p-7 shadow-xl" : "border-y border-slate-900 bg-slate-900/40 py-20"}>
      <div className={compact ? "mb-6 flex items-start justify-between gap-4 border-b border-slate-800 pb-5" : "mx-auto mb-10 flex max-w-7xl items-end justify-between gap-4 px-6"}>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
            <Clock3 size={14} /> Recently Viewed
          </div>
          {!compact && <h2 className="text-3xl font-bold tracking-tight text-white">Pick up where you left off</h2>}
          {compact && <p className="text-xs text-slate-400">Products you viewed recently.</p>}
        </div>
        {products.length > 0 && onClear && (
          <button type="button" onClick={confirmClear} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300">
            <Trash2 size={13} /> Clear All
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className={compact ? "rounded-xl border border-dashed border-slate-800 p-8 text-center" : "mx-auto max-w-xl px-6 text-center"}>
          <h3 className="text-sm font-bold text-slate-200">No Recently Viewed Products</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">Products you view will appear here so you can easily find them again.</p>
          <Link to="/shop" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-500">
            Explore Products <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className={compact ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "mx-auto flex max-w-7xl snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-3"}>
          {products.map((product) => (
            <article key={product.id} className={compact ? "group relative rounded-lg border border-slate-800 bg-slate-950 p-3" : "group relative min-w-[250px] snap-start rounded-xl border border-slate-800 bg-slate-950 p-3 sm:min-w-[280px]"}>
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-800/70 bg-slate-900">
                  {product.image_url ? <SafeImage src={product.image_url} alt={product.name} className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105" /> : <Clock3 size={30} className="text-slate-700" />}
                  {hasDiscount(product) && <span className="absolute left-2 top-2 rounded bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">{Math.round(product.discount_percent)}% OFF</span>}
                </div>
                <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-bold text-slate-100 transition group-hover:text-cyan-400">{product.name}</h3>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-white">{formatPrice(product.final_price || product.sale_price || product.price)}</p>
                    {hasDiscount(product) && <p className="text-[10px] text-slate-500 line-through">{formatPrice(product.original_price || product.price)}</p>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${Number(product.stock_quantity) > 0 ? "text-emerald-400" : "text-rose-400"}`}>{Number(product.stock_quantity) > 0 ? "In stock" : "Unavailable"}</span>
                </div>
              </Link>
              <div className="mt-3 flex items-center gap-2 border-t border-slate-800/70 pt-3">
                {onAddToCart && <button type="button" onClick={(event) => onAddToCart(product, event)} disabled={Number(product.stock_quantity) <= 0} aria-label={`Add ${product.name} to cart`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 py-2 text-[11px] font-bold text-cyan-300 transition hover:bg-cyan-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><ShoppingCart size={13} /> Add to Cart</button>}
                {onToggleWishlist && <button type="button" onClick={() => onToggleWishlist(product.id)} aria-label={`${wishlist.includes(Number(product.id)) ? "Remove" : "Add"} ${product.name} ${wishlist.includes(Number(product.id)) ? "from" : "to"} wishlist`} className="rounded-lg border border-slate-700 px-2.5 py-2 text-xs text-slate-400 transition hover:border-rose-400/40 hover:text-rose-300">{wishlist.includes(Number(product.id)) ? "♥" : "♡"}</button>}
                {onRemove && <button type="button" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name} from recently viewed`} className="rounded-lg border border-slate-700 px-2.5 py-2 text-slate-500 transition hover:border-rose-400/40 hover:text-rose-300"><X size={14} /></button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}