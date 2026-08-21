import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Cpu, Layers, Star } from "lucide-react";
import SafeImage from "./SafeImage.jsx";
import WishlistHeart from "./WishlistHeart.jsx";
import { formatPrice, hasDiscount } from "../utils/discount.js";

export default function HomeProducts({ featuredProducts, loading, handleAddToCart, wishlist = [], onToggleWishlist }) {
  const scrollRef = useRef(null);

  return (
    <section className="py-24 bg-slate-900/40 border-y border-slate-900 overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
              Today's Deals
            </span>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Featured Products
            </h2>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              to="/offers"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-300 mr-2"
            >
              See All Offers
            </Link>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
              className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors text-white cursor-pointer"
            >
              ←
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
              className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors text-white cursor-pointer"
            >
              →
            </button>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-950 border border-slate-900 rounded-2xl shadow-xl">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Compiling Device Matrix...
            </span>
          </div>
        </div>
      ) : featuredProducts.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-6 px-6 pb-10 scrollbar-hide snap-x snap-mandatory max-w-[100vw]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="min-w-[calc((100vw-1280px)/2)] flex-shrink-0 hidden xl:block" />

          {featuredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="min-w-[280px] md:min-w-[340px] h-[460px] relative rounded-3xl overflow-hidden group snap-center border border-slate-800 hover:border-slate-700/80 transition-all duration-300 flex-shrink-0"
            >
              {/* Clickable card link — z-10 */}
              <Link to={`/product/${product.id}`} className="absolute inset-0 z-10 cursor-pointer">
                {/* Image */}
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110 flex items-center justify-center bg-slate-950">
                  {product.image_url ? (
                    <SafeImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      fallback={<Cpu size={48} className="text-slate-700 animate-pulse" />}
                    />
                  ) : (
                    <Cpu size={48} className="text-slate-700" />
                  )}
                </div>

                {/* Out of stock overlay */}
                {product.stock_quantity <= 0 && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm z-10">
                    <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest">
                      Out of Stock
                    </span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity z-10" />

                {/* Card text content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 z-10 text-left">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                    {product.category_name || "IoT Component"}
                  </span>

                  <h3 className="text-xl font-bold text-slate-100 hover:text-indigo-400 transition-colors duration-150 line-clamp-1 mb-1">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-1">
                    {product.reviews?.totalReviews > 0 ? (
                      <>
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          {product.reviews.averageRating.toFixed(1)}{" "}
                          <Star size={9} className="fill-amber-400 text-transparent" />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({product.reviews.totalReviews} Review{product.reviews.totalReviews > 1 ? "s" : ""})
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Star size={12} className="text-slate-600" />
                        <span className="text-[11px] text-slate-500 font-medium">No Reviews Yet</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-white">
                        {formatPrice(product.final_price || product.price)}
                      </span>
                      {hasDiscount(product) && (
                        <span className="text-xs text-slate-400 line-through mt-0.5">
                          {formatPrice(product.original_price || product.price)}
                        </span>
                      )}
                    </div>
                    {hasDiscount(product) && (
                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-md">
                        {Math.round(product.discount_percent)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product, e);
                      }}
                      disabled={product.stock_quantity <= 0}
                      className="w-full bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:pointer-events-none active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer"
                    >
                      <ShoppingCart size={14} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </Link>

              {/* Wishlist heart — z-20, above the Link overlay, outside overflow so never clipped */}
              {onToggleWishlist && (
                <div className="absolute top-4 right-4 z-20">
                  <WishlistHeart
                    productId={product.id}
                    product={product}
                    isInWishlist={wishlist.includes(Number(product.id))}
                    onToggle={onToggleWishlist}
                  />
                </div>
              )}
            </motion.div>
          ))}

          <div className="min-w-[calc((100vw-1280px)/2)] flex-shrink-0 hidden xl:block" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6">
          <div className="border border-slate-800 bg-slate-950 rounded-2xl p-16 text-center max-w-md mx-auto shadow-xl">
            <Layers size={36} className="mx-auto text-slate-700 mb-4" />
            <p className="text-base font-bold text-slate-300">No active promotions logged</p>
            <p className="text-xs text-slate-500 mt-1">
              Our team is setting up fresh catalog inventories. Check back soon!
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
