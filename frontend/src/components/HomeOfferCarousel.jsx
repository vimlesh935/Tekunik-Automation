import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { offerService } from "../services/api";
import { getImageUrl } from "../utils/imageUrl.js";

const HOMEPAGE_LIMIT = 5;

export const formatOfferDiscount = (offer) => {
  if (offer?.type === "percentage") {
    const value = Math.round(Number(offer.value) || 0);
    if (value > 0) return `${value}% OFF`;
  }
  if (offer?.type === "fixed") return `₹${Number(offer.value) || 0} OFF`;
  return offer?.title || offer?.name || "Special Offer";
};

export const getOfferCta = (offer) => {
  const type = offer?.cta_type || "offers";
  const target = offer?.cta_target || "";
  const productId =
    target ||
    offer?.product_id ||
    offer?.product_ids?.[0] ||
    "";
  const categoryId =
    target ||
    offer?.category_ids?.[0] ||
    "";
  if (type === "product") {
    return { to: `/product/${productId}`, label: "Shop Deal" };
  }
  if (type === "category") {
    return { to: `/shop?category=${categoryId}`, label: "Shop Category" };
  }
  if (type === "custom") {
    return { to: target || "/offers", label: "Learn More" };
  }
  return { to: "/offers", label: "View Offer" };
};

const formatExpiry = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export function OfferCard({ offer }) {
  const image = getImageUrl(offer?.banner_image);
  const title = offer?.title || offer?.name || "Limited Time Offer";
  const description = offer?.description || "";
  const discount = formatOfferDiscount(offer);
  const cta = getOfferCta(offer);
  const hasImage = Boolean(image);
  const expiry = formatExpiry(offer?.expires_at);

  return (
    <Link
      to={cta.to}
      className="theme-card group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(6,182,212,0.12)]"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-strong">
        {hasImage ? (
          <img
            src={image}
            alt={offer?.alt_text || title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.16), rgba(2,6,23,0.9))" }}
          >
            <Tag size={26} style={{ color: "#22d3ee", opacity: 0.9 }} />
          </div>
        )}

        {/* Discount badge */}
        <span
          className="absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide"
          style={{ background: "rgba(6,182,212,0.95)", color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}
        >
          {discount}
        </span>

        {/* Expiry chip */}
        {expiry && (
          <span
            className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold"
            style={{ color: "#fde68a" }}
          >
            <Clock size={10} /> {expiry}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-primary sm:text-base">{title}</h3>
        {description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-secondary">{description}</p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-bold text-accent">
          {offer?.cta_text || cta.label}
          <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

export default function HomeOfferCarousel() {
  const [activeOffers, setActiveOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      offerService
        .getActiveOffers()
        .then((res) => {
          if (cancelled) return;
          setActiveOffers(res?.data?.offers || res?.data?.discounts || []);
        })
        .catch((err) => console.error("Failed to fetch offers:", err))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    // Keep in sync with offers created/updated in the admin panel (no page reload needed).
    const timer = window.setInterval(load, 30_000);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, []);

  if (loading || activeOffers.length === 0) return null;

  const sortedOffers = [...activeOffers].sort(
    (a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0)
  );
  const visibleOffers = sortedOffers.slice(0, HOMEPAGE_LIMIT);
  const hasMoreOffers = sortedOffers.length > HOMEPAGE_LIMIT;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-4 pt-10 sm:px-6 sm:pt-14">
      <div className="mb-6">
        <p className="section-label">Offers &amp; Promotions</p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-primary sm:text-2xl">
          Deals worth grabbing
        </h2>
      </div>

      <div className="grid grid-cols-1 min-[520px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {visibleOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {hasMoreOffers && (
        <div className="mt-7 text-center">
          <Link to="/offers" className="btn-primary">
            View More <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}