// import React from "react";
// import { Link } from "react-router-dom";
// import { ShoppingCart, Cpu, Layers, Star } from "lucide-react";
// import SafeImage from "./SafeImage.jsx";

// export default function HomeProducts({ featuredProducts, loading, handleAddToCart }) {
//   return (
//     <section className="py-20 bg-slate-900/40 border-t border-slate-900">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
//           <div className="text-left">
//             <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
//               Today's Deals
//             </span>
//             <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
//               Featured Products
//             </h2>
//           </div>
//           <Link
//             to="/shop"
//             className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-300"
//           >
//             See All Offers
//           </Link>
//         </div>

//         {loading ? (
//           <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-950 border border-slate-900 rounded-2xl shadow-xl">
//             <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
//             <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
//               Compiling Device Matrix...
//             </span>
//           </div>
//         ) : featuredProducts.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {featuredProducts.slice(0, 4).map((product) => (
//               <div
//                 key={product.id}
//                 className="group bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/[0.02] relative"
//               >
//                 <div className="relative w-full h-44 bg-slate-950 border border-slate-800/60 rounded-xl overflow-hidden flex items-center justify-center mb-4 transition-all group-hover:border-slate-700">
//                   {product.image_url ? (
//                     <SafeImage
//                       src={product.image_url}
//                       alt={product.name}
//                       className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
//                       fallback={
//                         <Cpu
//                           size={32}
//                           className="text-slate-700 animate-pulse"
//                         />
//                       }
//                     />
//                   ) : (
//                     <Cpu size={32} className="text-slate-700" />
//                   )}

//                   {product.stock_quantity <= 0 && (
//                     <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center backdrop-blur-sm">
//                       <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
//                         Out of Stock
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex-grow flex flex-col justify-between text-left">
//                   <div className="space-y-1.5">
//                     <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
//                       {product.category_name || "IoT Component"}
//                     </span>
//                     <Link to={`/product/${product.id}`} className="block">
//                       <h3 className="text-base font-bold text-slate-100 hover:text-indigo-400 transition-colors duration-150 line-clamp-1">
//                         {product.name}
//                       </h3>
//                     </Link>

//                     <div className="pt-3 flex items-baseline justify-between">
//                       <div className="flex flex-col">
//                         <span className="text-lg font-black text-white">
//                           ₹{parseFloat(product.price || 0).toFixed(2)}
//                         </span>
//                         {product.sale_price &&
//                           parseFloat(product.sale_price || 0) <
//                             parseFloat(product.price || 0) && (
//                             <span className="text-xs text-slate-500 line-through mt-0.5">
//                               ₹
//                               {parseFloat(product.sale_price || 0).toFixed(2)}
//                             </span>
//                           )}
//                       </div>
//                       {(product.discount_percent || 0) > 0 && (
//                         <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-md">
//                           {Math.round(product.discount_percent)}% OFF
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   <div className="pt-4 mt-4 border-t border-slate-800/80">
//                     <button
//                       onClick={(e) => handleAddToCart(product, e)}
//                       disabled={product.stock_quantity <= 0}
//                       className="w-full bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-200 hover:text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:pointer-events-none active:scale-95"
//                     >
//                       <ShoppingCart size={14} />
//                       Add to Basket
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="border border-slate-800 bg-slate-950 rounded-2xl p-16 text-center max-w-md mx-auto shadow-xl">
//             <Layers size={36} className="mx-auto text-slate-700 mb-4" />
//             <p className="text-base font-bold text-slate-300">
//               No active promotions logged
//             </p>
//             <p className="text-xs text-slate-500 mt-1">
//               Our team is setting up fresh catalog inventories. Check back
//               soon!
//             </p>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////
/////////

// import React, { useRef } from "react";
// import { Link } from "react-router-dom";
// import { motion } from "framer-motion";
// import { ShoppingCart, Cpu, Layers, Star } from "lucide-react";
// import SafeImage from "./SafeImage.jsx";

// export default function HomeProducts({ featuredProducts, loading, handleAddToCart }) {
//   const scrollRef = useRef(null);

//   return (
//     <section className="py-24 bg-slate-900/40 border-y border-slate-900 overflow-hidden">
//       {/* Header Container from Carousel Design */}
//       <div className="max-w-7xl mx-auto px-6 mb-12">
//         <motion.div
//           initial={{ opacity: 0, x: -30 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true }}
//           className="flex flex-col md:flex-row md:items-end justify-between gap-6"
//         >
//           <div className="text-left">
//             <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
//               Today's Deals
//             </span>
//             <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
//               Featured Products
//             </h2>
//           </div>
//           <div className="flex gap-4 items-center">
//             <Link
//               to="/shop"
//               className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-300 mr-2"
//             >
//               See All Offers
//             </Link>
//             <button 
//               onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
//               className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors text-white"
//             >
//               ←
//             </button>
//             <button 
//               onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
//               className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors text-white"
//             >
//               →
//             </button>
//           </div>
//         </motion.div>
//       </div>

//       {/* Main Content Area */}
//       {loading ? (
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-950 border border-slate-900 rounded-2xl shadow-xl">
//             <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
//             <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
//               Compiling Device Matrix...
//             </span>
//           </div>
//         </div>
//       ) : featuredProducts.length > 0 ? (
//         <div 
//           ref={scrollRef}
//           className="flex overflow-x-auto gap-6 px-6 pb-10 scrollbar-hide snap-x snap-mandatory max-w-[100vw]"
//           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
//         >
//           {/* Spacer for alignment */}
//           <div className="min-w-[calc((100vw-1280px)/2)] flex-shrink-0 hidden xl:block"></div>
          
//           {featuredProducts.slice(0, 4).map((product, idx) => (
//             <motion.div
//               key={product.id}
//               initial={{ opacity: 0, scale: 0.9 }}
//               whileInView={{ opacity: 1, scale: 1 }}
//               viewport={{ once: true }}
//               transition={{ delay: idx * 0.1 }}
//               className="min-w-[320px] md:min-w-[400px] h-[540px] relative rounded-3xl overflow-hidden group snap-center border border-slate-800 hover:border-slate-700/80 transition-all duration-300"
//             >
//               {/* Product Card Image Wrapper */}
//               <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110 flex items-center justify-center bg-slate-950">
//                 {product.image_url ? (
//                   <SafeImage
//                     src={product.image_url}
//                     alt={product.name}
//                     className="w-full h-full object-cover"
//                     fallback={
//                       <Cpu
//                         size={48}
//                         className="text-slate-700 animate-pulse"
//                       />
//                     }
//                   />
//                 ) : (
//                   <Cpu size={48} className="text-slate-700" />
//                 )}
//               </div>

//               {/* Out of Stock Overlay matching design structure */}
//               {product.stock_quantity <= 0 && (
//                 <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm z-20">
//                   <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest">
//                     Out of Stock
//                   </span>
//                 </div>
//               )}

//               {/* Gradient Dark Mesh Overlays */}
//               <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity z-10" />
              
//               {/* Card Foreground Content */}
//               <div className="absolute inset-0 p-8 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 z-10 text-left">
//                 <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
//                   {product.category_name || "IoT Component"}
//                 </span>
                
//                 <Link to={`/product/${product.id}`} className="block mb-2">
//                   <h3 className="text-2xl font-bold text-slate-100 hover:text-indigo-400 transition-colors duration-150 line-clamp-1">
//                     {product.name}
//                   </h3>
//                 </Link>

//                 {/* Pricing Block with Conditional Discount Pill */}
//                 <div className="flex items-baseline justify-between mb-4">
//                   <div className="flex flex-col">
//                     <span className="text-xl font-black text-white">
//                       ₹{parseFloat(product.price || 0).toFixed(2)}
//                     </span>
//                     {product.sale_price &&
//                       parseFloat(product.sale_price || 0) <
//                         parseFloat(product.price || 0) && (
//                         <span className="text-xs text-slate-400 line-through mt-0.5">
//                           ₹{parseFloat(product.sale_price || 0).toFixed(2)}
//                         </span>
//                       )}
//                   </div>
//                   {(product.discount_percent || 0) > 0 && (
//                     <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-md">
//                       {Math.round(product.discount_percent)}% OFF
//                     </span>
//                   )}
//                 </div>

//                 {/* Complete Basket Button Integrated Inside Card Base */}
//                 <div className="pt-4 border-t border-slate-800/80">
//                   <button
//                     onClick={(e) => handleAddToCart(product, e)}
//                     disabled={product.stock_quantity <= 0}
//                     className="w-full bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:pointer-events-none active:scale-95 shadow-lg shadow-indigo-600/10"
//                   >
//                     <ShoppingCart size={14} />
//                     Add to Basket
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//           <div className="min-w-[calc((100vw-1280px)/2)] flex-shrink-0 hidden xl:block"></div>
//         </div>
//       ) : (
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="border border-slate-800 bg-slate-950 rounded-2xl p-16 text-center max-w-md mx-auto shadow-xl">
//             <Layers size={36} className="mx-auto text-slate-700 mb-4" />
//             <p className="text-base font-bold text-slate-300">
//               No active promotions logged
//             </p>
//             <p className="text-xs text-slate-500 mt-1">
//               Our team is setting up fresh catalog inventories. Check back soon!
//             </p>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }



import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Cpu, Layers, Star } from "lucide-react";
import SafeImage from "./SafeImage.jsx";

export default function HomeProducts({ featuredProducts, loading, handleAddToCart }) {
  const scrollRef = useRef(null);

  return (
    <section className="py-24 bg-slate-900/40 border-y border-slate-900 overflow-hidden">
      {/* Header Container */}
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
              to="/shop"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs  tracking-wider transition-colors duration-300 mr-2"
            >
              See All Product
            </Link>
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors text-white cursor-pointer"
            >
              ←
            </button>
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors text-white cursor-pointer"
            >
              →
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
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
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Spacer for alignment */}
          <div className="min-w-[calc((100vw-1280px)/2)] flex-shrink-0 hidden xl:block"></div>
          
          {featuredProducts.slice(0, 4).map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="min-w-[320px] md:min-w-[400px] h-[540px] relative rounded-3xl overflow-hidden group snap-center border border-slate-800 hover:border-slate-700/80 transition-all duration-300"
            >
              {/* Entire Card becomes clickable via this absolute Link */}
              <Link to={`/product/${product.id}`} className="absolute inset-0 z-10 cursor-pointer">
                {/* Product Card Image Wrapper */}
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110 flex items-center justify-center bg-slate-950">
                  {product.image_url ? (
                    <SafeImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      fallback={
                        <Cpu
                          size={48}
                          className="text-slate-700 animate-pulse"
                        />
                      }
                    />
                  ) : (
                    <Cpu size={48} className="text-slate-700" />
                  )}
                </div>

                {/* Out of Stock Overlay */}
                {product.stock_quantity <= 0 && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm z-20">
                    <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest">
                      Out of Stock
                    </span>
                  </div>
                )}

                {/* Gradient Dark Mesh Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />
                
                {/* Card Foreground Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end transform translate-y-4  transition-transform duration-300 text-left">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                    {product.category_name || "IoT Component"}
                  </span>
                  
                   <h3 className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-150 line-clamp-1 mb-2">
                     {product.name}
                   </h3>

                   {/* Customer Reviews Rating */}
                   <div className="flex items-center gap-2 mb-1">
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

                   {/* Pricing Block with Conditional Discount Pill */}
                  <div className="flex items-baseline justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-white">
                        ₹{parseFloat(product.price || 0).toFixed(2)}
                      </span>
                      {product.sale_price &&
                        parseFloat(product.sale_price || 0) <
                          parseFloat(product.price || 0) && (
                          <span className="text-xs text-slate-400 line-through mt-0.5">
                            ₹{parseFloat(product.sale_price || 0).toFixed(2)}
                          </span>
                        )}
                    </div>
                    {(product.discount_percent || 0) > 0 && (
                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-md">
                        {Math.round(product.discount_percent)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Empty spacer area matching the layout height requirements */}
                  <div className="pt-4 border-t border-transparent h-[53px]"></div>
                </div>
              </Link>

              {/* Basket Button Container - Placed outside the Link anchor using z-index layers */}
              <div className="absolute bottom-8 left-8 right-8 z-20">
                <div className="pt-7">
                  <button
                    onClick={(e) => {
                      e.preventDefault(); // Prevents link triggering
                      e.stopPropagation(); // Prevents layout bubbling 
                      handleAddToCart(product, e);
                    }}
                    disabled={product.stock_quantity <= 0}
                    className="w-full bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:pointer-events-none active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    <ShoppingCart size={14} />
                    Add to Basket
                  </button>
                </div>
              </div>

            </motion.div>
          ))}
          <div className="min-w-[calc((100vw-1280px)/2)] flex-shrink-0 hidden xl:block"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6">
          <div className="border border-slate-800 bg-slate-950 rounded-2xl p-16 text-center max-w-md mx-auto shadow-xl">
            <Layers size={36} className="mx-auto text-slate-700 mb-4" />
            <p className="text-base font-bold text-slate-300">
              No active promotions logged
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Our team is setting up fresh catalog inventories. Check back soon!
            </p>
          </div>
        </div>
      )}
    </section>
  );
}