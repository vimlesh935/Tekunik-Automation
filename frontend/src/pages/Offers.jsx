import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { offerService } from "../services/api";
import { getImageUrl } from "../utils/imageUrl.js";
import { Tag, Clock, ChevronRight } from "lucide-react";

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const loadOffers = () => {
      offerService
        .getActiveOffers()
        .then((res) => {
          if (!cancelled) setOffers(res.data?.offers || res.data || []);
        })
        .catch(() => setOffers([]))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    loadOffers();
    // Auto-refresh so offers created in the admin panel appear here without a reload
    timer = window.setInterval(loadOffers, 30_000);
    window.addEventListener("focus", loadOffers);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadOffers);
    };
  }, []);

  const formatDiscount = (offer) => {
    if (offer.type === "percentage") return `${offer.value}% OFF`;
    if (offer.type === "fixed") return `₹${offer.value} OFF`;
    return "Special Offer";
  };

  const formatExpiry = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-page text-primary px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Offers & Promotions</h1>
          <p className="text-gray-400 mt-2 text-sm">Exclusive deals on smart home products</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <Tag size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No active offers right now</p>
            <p className="text-sm mt-1">Check back soon for exciting deals!</p>
            <Link to="/shop" className="inline-block mt-6 px-6 py-2.5 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition text-sm">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-cyan-500/40 transition group">
                {offer.banner_image && (
                  <div className="h-36 overflow-hidden">
                    <img src={getImageUrl(offer.banner_image)} alt={offer.title || offer.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                )}
                <div className="p-5">
                  <span className="inline-block px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md text-xs font-bold mb-3">
                    {formatDiscount(offer)}
                  </span>
                  <h3 className="text-white font-bold text-base leading-snug">{offer.title || offer.name}</h3>
                  {offer.description && (
                    <p className="text-gray-400 text-xs mt-1.5 line-clamp-2">{offer.description}</p>
                  )}
                  {offer.min_order_value > 0 && (
                    <p className="text-gray-500 text-xs mt-2">Min. order: ₹{offer.min_order_value}</p>
                  )}
                  {offer.expires_at && (
                    <p className="flex items-center gap-1 text-amber-400/80 text-xs mt-2">
                      <Clock size={11} /> Expires {formatExpiry(offer.expires_at)}
                    </p>
                  )}
                  <Link to="/shop" className="mt-4 flex items-center gap-1 text-cyan-400 text-xs font-semibold hover:gap-2 transition-all">
                    Shop Now <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
