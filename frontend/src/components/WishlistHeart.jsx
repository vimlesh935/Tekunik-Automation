import { Heart, HeartOutline } from "lucide-react";

const WishlistHeart = ({ productId, isInWishlist, onToggle, product }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onToggle(productId);
  };

  return (
    <button
      type="button"
      className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800/50 flex items-center justify-center transition-all duration-200 hover:bg-slate-900 hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-offset-2"
      onClick={handleClick}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      style={{
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {isInWishlist ? (
        <Heart
          size={16}
          className={product && product.stock_quantity === 0 ? "opacity-40" : ""}
        />
      ) : (
        <HeartOutline
          size={16}
          className="text-slate-500"
        />
      )}
    </button>
  );
};

export default WishlistHeart;