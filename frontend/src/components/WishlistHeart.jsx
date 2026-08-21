import { Heart } from "lucide-react";

/**
 * WishlistHeart — reusable heart toggle button for product cards and detail pages.
 *
 * Props:
 *   productId   — numeric product id
 *   isInWishlist — boolean
 *   onToggle    — (productId) => void
 *   product     — optional product object (used for out-of-stock opacity)
 *   size        — "sm" | "md" (default "md")
 */
const WishlistHeart = ({ productId, isInWishlist, onToggle, product, size = "md" }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(productId);
  };

  const isOutOfStock = product && Number(product.stock_quantity) === 0;
  const btnSize = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const iconSize = size === "sm" ? 15 : 17;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      className={`
        ${btnSize} rounded-full
        flex items-center justify-center
        backdrop-blur-md
        border transition-all duration-200
        hover:scale-110 active:scale-95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900
        shadow-lg shadow-black/40
        ${isInWishlist
          ? "bg-rose-500/20 border-rose-500/60 hover:bg-rose-500/30"
          : "bg-slate-900/80 border-slate-700/70 hover:bg-slate-800/90 hover:border-rose-500/40"
        }
        ${isOutOfStock ? "opacity-60" : ""}
      `}
    >
      <Heart
        size={iconSize}
        className={`transition-all duration-200 ${
          isInWishlist
            ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]"
            : "fill-transparent text-slate-400 group-hover:text-rose-400"
        }`}
      />
    </button>
  );
};

export default WishlistHeart;
