import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Sparkles, Home as HomeIcon, Lock, Cpu, Lightbulb, CircuitBoard, Camera, Wifi, Thermometer } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext.jsx";
import { productService, cartService, categoryService, wishlistService } from "../services/api";
import HomeHero from "./HomeHero";
import HomeCategories from "./HomeCategories";
import HomeProducts from "./HomeProducts";
import HomeReviews from "./HomeReviews";
import WhyTeknode from "./WhyTeknode.jsx";
import HowWorks from "./HowWorks.jsx";
import SmartHome from "./SmartHome.jsx";
import HomeScene from "./HomeScene.jsx";
import HomeCounter from "./HomeCounter.jsx";
import HomeApp from "./HomeApp.jsx";
import FaqHome from "./FaqHome.jsx";
import ReadyHome from "./ReadyHome.jsx";
import RecentlyViewedSection from "./RecentlyViewedSection.jsx";
import useRecentlyViewed from "../hooks/useRecentlyViewed.js";


export default function HomeWrapper({ token }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { settings } = useWebsiteSettings();
  const whatsappNumber = settings?.company_whatsapp?.replace(/[^0-9]/g, "") || "919322475209";
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const recentlyViewed = useRecentlyViewed();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [prodRes, catRes] = await Promise.allSettled([
          productService.getTrendingProducts(8).catch(() => null),
          categoryService.getAllCategories(),
        ]);

        // Try trending endpoint, fall back to dynamic sorting
        let products = [];
        if (prodRes?.status === "fulfilled" && prodRes.value) {
          const response = prodRes.value;
          products = response?.data?.products || response?.products || [];
        }
        if (!products.length) {
          // Fallback: load all products and sort dynamically
          try {
            const fallbackRes = await productService.getAllProducts(1, 50);
            products = (fallbackRes?.data?.products || fallbackRes?.products || []).filter(
              (p) => p.status === "active" || !p.status
            );
          } catch {
            products = [];
          }
        }

        // Dynamic trending sort: featured products first, then by creation date
        // This uses real data: featured flag from product model, and recent activity
        const sortedProducts = products.sort((a, b) => {
          // Priority 1: featured products come first
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          // Priority 2: newer products (by created_at) come next
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return 0;
        });

        if (sortedProducts.length > 0) {
          setFeaturedProducts(sortedProducts);
        } else {
          setFeaturedProducts([]);
        }

        // Process categories response
        if (catRes?.status === "fulfilled" && catRes.value) {
          const catResponse = catRes.value;
          const cats =
            catResponse?.data?.categories || catResponse?.categories || [];
          setCategories(Array.isArray(cats) ? cats : []);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
        setError("Failed to sync store parameters. Please reload.");
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // ── Wishlist ──────────────────────────────────────────────
  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    if (isAuthenticated) {
      try {
        const response = await wishlistService.getWishlist();
        const items = response?.wishlist || response?.data?.wishlist || [];
        setWishlist(Array.isArray(items) ? items.map((item) => Number(item.product_id || item)) : []);
      } catch {
        setWishlist([]);
      }
    } else {
      const guest = JSON.parse(localStorage.getItem("wishlist_guest") || "[]");
      setWishlist(guest.map((id) => Number(id)));
    }
  };

  const toggleWishlist = async (productId) => {
    const alreadyIn = wishlist.includes(Number(productId));
    // Optimistic update
    setWishlist((prev) =>
      alreadyIn
        ? prev.filter((id) => id !== Number(productId))
        : [...prev, Number(productId)]
    );
    try {
      if (isAuthenticated) {
        if (alreadyIn) {
          await wishlistService.removeFromWishlist(productId);
        } else {
          await wishlistService.addToWishlist(productId);
        }
      } else {
        const guest = JSON.parse(localStorage.getItem("wishlist_guest") || "[]");
        if (alreadyIn) {
          localStorage.setItem("wishlist_guest", JSON.stringify(guest.filter((id) => Number(id) !== Number(productId))));
        } else {
          guest.push(productId);
          localStorage.setItem("wishlist_guest", JSON.stringify(guest));
        }
      }
    } catch {
      // Rollback on failure
      setWishlist((prev) =>
        alreadyIn
          ? [...prev, Number(productId)]
          : prev.filter((id) => id !== Number(productId))
      );
    }
  };
  // ─────────────────────────────────────────────────────────

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      addToCart(product, 1);
      setNotification(`🛒 Added ${product.name} to your basket!`);
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    try {
      await cartService.addToCart(product.id, 1);
      setNotification(`🛒 Added ${product.name} to your basket!`);
      setTimeout(() => setNotification(""), 3000);
    } catch (error) {
      addToCart(product, 1);
      setNotification(`🛒 Added ${product.name} to your basket!`);
      setTimeout(() => setNotification(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* WhatsApp Support Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=Hello%2C%20I%20need%20help%20with%20your%20automation%20products.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open WhatsApp support chat"
        className="fixed bottom-5 right-4 sm:bottom-8 sm:right-8 z-[60] group inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-indigo-600/25 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-indigo-500 hover:shadow-indigo-500/35 active:scale-95 sm:px-5"
      >
        <MessageCircle
          size={18}
          className="shrink-0 transition-transform duration-300 group-hover:rotate-6"
        />
      </a>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white border border-slate-800 rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 min-w-[340px] justify-center"
          >
            <Sparkles size={16} className="text-amber-400 animate-spin" />
            <span className="text-sm font-semibold tracking-wide">
              {notification}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <HomeHero />

      {/* Featured Products Grid */}
      <HomeProducts
        featuredProducts={featuredProducts}
        loading={loading}
        handleAddToCart={handleAddToCart}
        wishlist={wishlist}
        onToggleWishlist={toggleWishlist}
      />

      {!recentlyViewed.loading && recentlyViewed.products.length > 0 && (
        <RecentlyViewedSection
          products={recentlyViewed.products}
          onRemove={recentlyViewed.remove}
          onClear={recentlyViewed.clear}
          onAddToCart={handleAddToCart}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
        />
      )}

      <WhyTeknode />
      <HowWorks />

      {/* Trending Categories Carousel */}
      <HomeCategories categories={categories} />
      <SmartHome />
      <HomeScene />
      <HomeCounter />
      <HomeApp />
      {/* Customer Reviews */}
      <HomeReviews />
      <ReadyHome />
    </div>
  );
}
