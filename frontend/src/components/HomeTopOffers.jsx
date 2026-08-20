import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Tag, ArrowRight, X } from "lucide-react";
import { offerService } from "../services/api";

const formatDiscount = (offer) => {
  if (offer?.type === "percentage") {
    const value = Math.round(Number(offer.value) || 0);
    if (value > 0) return `${value}% OFF`;
  }
  if (offer?.type === "fixed") return `₹${Number(offer.value) || 0} OFF`;
  return offer?.title || offer?.name || "Special Offer";
};

export default function HomeTopOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const loadOffers = () => {
      offerService
        .getActiveOffers()
        .then((res) => {
          if (cancelled) return;
          setOffers(res?.data?.offers || res?.data?.discounts || []);
        })
        .catch((err) => console.error("Failed to fetch active offers:", err))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    loadOffers();
    // Keep the banner in sync with newly created offers without a page refresh
    timer = window.setInterval(loadOffers, 30_000);
    window.addEventListener("focus", loadOffers);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadOffers);
    };
  }, []);

  if (loading || !isVisible || offers.length === 0) return null;

  // Show the most valuable offer (highest discount value) in the banner
  const bestOffer = offers.reduce((best, offer) => {
    const value = Number(offer.value) || 0;
    return !best || value > (Number(best.value) || 0) ? offer : best;
  }, null);

  const discountLabel = formatDiscount(bestOffer);
  const offerMessage =
    bestOffer?.title ||
    bestOffer?.description ||
    "Limited time offer. Shop now!";

  return (
    <aside className="relative z-40 w-full overflow-hidden border-b border-white/10 bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950">
      {/* Decorative glows — kept subtle and theme-aware */}
      <div className="pointer-events-none absolute -left-20 -top-12 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-14 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-2 px-4 py-2.5 sm:px-16 sm:flex-row sm:gap-3 sm:py-2">
        {/* Main highlight */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="inline-flex h-6 items-center rounded-full bg-cyan-400/20 px-2.5 ring-1 ring-inset ring-cyan-400/30">
            <Tag size={12} className="text-cyan-300" />
          </span>
          <p className="whitespace-nowrap text-sm font-black tracking-tight text-white md:text-base">
            {discountLabel}
          </p>
        </div>

        <span className="hidden h-1 w-1 shrink-0 rounded-full bg-white/30 sm:inline-block" />

        {/* Supporting text */}
        <p className="max-w-xs truncate text-center text-xs font-medium text-slate-300 sm:max-w-sm md:text-sm lg:text-left">
          {offerMessage}
        </p>

        {/* CTA */}
        <Link
          to="/offers"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-cyan-100 active:scale-[0.98] md:text-sm"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {/* Close */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        aria-label="Close offer banner"
      >
        <X size={16} />
      </button>
    </aside>
  );
}