import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_DISPLAY_COUNT = 8;

const getCategoryImg = (name) => {
  const lowerName = name?.toLowerCase() || "";
  if (lowerName.includes("switch") || lowerName.includes("panel") || lowerName.includes("touch"))
    return "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80";
  if (lowerName.includes("camera") || lowerName.includes("security") || lowerName.includes("surveillance"))
    return "https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=400&q=80";
  if (lowerName.includes("hub") || lowerName.includes("gateway") || lowerName.includes("relay"))
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80";
  return "https://images.unsplash.com/photo-1595475242265-c305e16045c5?auto=format&fit=crop&w=400&q=80";
};

function CategoryCard({ cat }) {
  return (
    <Link
      to={`/shop?category_id=${cat.id}`}
      className="group relative bg-slate-900 border border-slate-800/80 hover:border-slate-600/80 rounded-2xl p-3 transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/[0.06] hover:-translate-y-0.5"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full transition-all duration-300 group-hover:scale-110 z-10" />

      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/50 mb-4">
        {cat.image_url ? (
          <img
            src={cat.image_url}
            alt={cat.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => {
              e.target.src = getCategoryImg(cat.name);
              e.target.onerror = null;
            }}
          />
        ) : (
          <img
            src={getCategoryImg(cat.name)}
            alt={cat.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}
      </div>

      <div className="text-left px-2 pb-1">
        <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors duration-200 line-clamp-1">
          {cat.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {cat.desc}
        </p>
      </div>
    </Link>
  );
}

export default function HomeCategories({ categories }) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = categories.length > INITIAL_DISPLAY_COUNT;
  const initialCategories = categories.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <section className="py-20 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
          <div className="text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-2">
              Browse
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Shop by Category
            </h2>
          </div>
        </div>

        {categories.length > 0 ? (
          <>
            {/* Responsive Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {initialCategories.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} />
              ))}
            </div>

            {/* Smooth expand/collapse for remaining items */}
            <AnimatePresence>
              {showAll && categories.length > INITIAL_DISPLAY_COUNT && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                    {categories.slice(INITIAL_DISPLAY_COUNT).map((cat) => (
                      <CategoryCard key={cat.id} cat={cat} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* See More / Show Less Toggle - always after all categories */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <motion.button
                  onClick={() => setShowAll((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/60 text-slate-300 hover:text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 shadow-xl cursor-pointer"
                  whileTap={{ scale: 0.95 }}
                >
                  {showAll ? (
                    <>
                      Show Less <ChevronUp size={18} />
                    </>
                  ) : (
                    <>
                      See More <ChevronDown size={18} />
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 p-3 rounded-2xl min-h-[320px] flex flex-col justify-between animate-pulse"
              >
                <div className="aspect-[4/3] w-full rounded-xl bg-slate-800" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}