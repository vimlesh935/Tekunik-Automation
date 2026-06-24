import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ─── Category Carousel Component ─── */
function CategoryCarousel({ categories }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories, checkScroll]);

  /* ── Horizontal wheel scrolling ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.deltaY !== 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX || 0)) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: "auto" });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* ── Click-and-drag scrolling ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onMouseDown = (e) => {
      dragState.current.isDragging = true;
      dragState.current.startX = e.pageX - el.offsetLeft;
      dragState.current.scrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };
    const onMouseMove = (e) => {
      if (!dragState.current.isDragging) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - dragState.current.startX) * 1.5;
      el.scrollLeft = dragState.current.scrollLeft - walk;
    };
    const onMouseUp = () => {
      dragState.current.isDragging = false;
      el.style.cursor = "";
      el.style.userSelect = "";
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const scrollBy = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[0];
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width + 24;
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

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

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scrollBy("left")}
          className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/60 text-slate-300 hover:text-white items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-x-1 active:scale-95 shadow-xl"
          aria-label="Previous categories"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scrollBy("right")}
          className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/60 text-slate-300 hover:text-white items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:translate-x-1 active:scale-95 shadow-xl"
          aria-label="Next categories"
        >
          <ChevronRight size={20} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <Link
              to={`/shop?category_id=${cat.id}`}
              key={cat.id}
              className="group relative bg-slate-900 border border-slate-800/80 hover:border-slate-600/80 rounded-2xl p-3 transition-all duration-300 overflow-hidden flex flex-col justify-between flex-shrink-0
                w-[calc(100%-12px)] min-w-[calc(100%-12px)]
                sm:w-[calc(50%-12px)] sm:min-w-[calc(50%-12px)]
                lg:w-[calc(25%-18px)] lg:min-w-[calc(25%-18px)]
                snap-start hover:shadow-2xl hover:shadow-indigo-500/[0.06] hover:-translate-y-0.5"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full transition-all duration-300 group-hover:scale-110 z-10" />

              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/50 mb-4">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
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
        })}
      </div>

      <div className="hidden lg:block absolute top-0 left-0 w-6 h-full bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-10" />
      <div className="hidden lg:block absolute top-0 right-0 w-6 h-full bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-10" />
    </div>
  );
}

export default function HomeCategories({ categories }) {
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
          <CategoryCarousel categories={categories} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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