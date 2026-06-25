import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { reviewService } from "../services/api";

export default function HomeReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentReview, setCurrentReview] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const loadApprovedReviews = async () => {
      setLoading(true);
      try {
        const res = await reviewService.getWebsiteReviews();
        const list = res?.data?.reviews || [];
        const visibleReviews = list.filter(
          (r) => r.is_approved === true && r.show_on_website === true,
        );
        setReviews(visibleReviews);
      } catch (err) {
        console.warn("Home reviews load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadApprovedReviews();
  }, []);

  if (loading) {
    return (
      <section className="relative py-24 bg-slate-950 border-t border-slate-800/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-2">
              Customer Reviews
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              What Our Customers Say
            </h2>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="relative py-24 bg-slate-950 border-t border-slate-800/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-2">
              Customer Reviews
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              What Our Customers Say
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              No approved reviews yet. Reviews from verified buyers will appear here after admin approval.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-24 bg-slate-950 border-t border-slate-800/50 overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-2">
            Customer Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            What Our Customers Say
          </h2>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Trusted by customers across India for reliable smart automation solutions and exceptional service.
          </p>
        </div>

        {/* Reviews Slider */}
        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6"
              animate={{ x: `-${currentReview * (100 / 3)}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <AnimatePresence>
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    className="min-w-[calc(33.333%-16px)] w-[calc(33.333%-16px)] flex-shrink-0"
                  >
                    <div className="h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 hover:border-indigo-500/30 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 group flex flex-col">
                      {/* Stars */}
                      <div className="flex items-center gap-1 mb-5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-700/50 text-slate-700/50"
                            }
                          />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="text-sm sm:text-base text-slate-300 leading-relaxed flex-grow mb-6 italic">
                        &ldquo;{review.review_message || review.review_title}&rdquo;
                      </p>

                      {/* Customer Info */}
                      <div className="flex items-center gap-4 pt-5 border-t border-slate-800/60">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-600/20 flex-shrink-0">
                          {(review.customer_name || "Customer")
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">
                            {review.customer_name || "Verified Customer"}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-emerald-400" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                              Verified Buyer
                            </span>
                            <span className="text-xs text-slate-500 truncate">
                              {review.product_name ? `Purchased: ${review.product_name}` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-6 mt-10">
            <button
              onClick={() => setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length)}
              className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentReview(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentReview
                      ? "bg-indigo-400 w-6"
                      : "bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentReview((prev) => (prev + 1) % reviews.length)}
              className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
