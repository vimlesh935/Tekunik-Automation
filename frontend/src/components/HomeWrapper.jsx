import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Sparkles, AlertCircle, Home as HomeIcon, Lock, Cpu, Lightbulb, CircuitBoard, Camera, Wifi, Thermometer } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { productService, cartService, categoryService } from "../services/api";
import HomeHero from "./HomeHero";
import HomeCategories from "./HomeCategories";
import HomeProducts from "./HomeProducts";
import HomeApplications from "./HomeApplications";
import HomeReviews from "./HomeReviews";
import TrustHome from "./TrustHome.jsx";
import WhyTeknode from "./WhyTeknode.jsx";
import HowWorks from "./HowWorks.jsx";
import SmartHome from "./SmartHome.jsx";
import HomeScene from "./HomeScene.jsx";
import HomeCounter from "./HomeCounter.jsx";
import HomeApp from "./HomeApp.jsx";
import FaqHome from "./FaqHome.jsx";
import ReadyHome from "./ReadyHome.jsx";


export default function HomeWrapper({ token }) {
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [applicationCounts, setApplicationCounts] = useState(null);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [prodRes, catRes] = await Promise.allSettled([
          productService.getAllProducts(1, 8),
          categoryService.getAllCategories(),
        ]);

        // Handle products response with detailed logging
        if (prodRes.status === 'fulfilled') {
          const response = prodRes.value;
          console.log("[HomeWrapper] Products API response:", JSON.stringify(response).slice(0, 500));
          const products = response?.data?.products || response?.products || [];
          console.log(`[HomeWrapper] Products found: ${products.length}`);
          if (products.length > 0) {
            setFeaturedProducts(products.slice(0, 8));
          } else {
            // Fallback 1: Try without featured filter (get any active products)
            console.log("[HomeWrapper] No featured products, trying general product fetch...");
            try {
              const fallbackRes = await productService.getAllProducts(1, 8);
              const fallbackProducts = fallbackRes?.data?.products || fallbackRes?.products || [];
              console.log(`[HomeWrapper] Fallback products found: ${fallbackProducts.length}`);
              setFeaturedProducts(fallbackProducts.slice(0, 8));
            } catch (fbErr) {
              console.error("[HomeWrapper] Fallback also failed:", fbErr);
              setFeaturedProducts([]);
            }
          }
        } else {
          const reason = prodRes.reason;
          console.error("[HomeWrapper] Failed to load products:", reason?.status, reason?.message);
          // Show error page only for non-404 errors (404 just means no products)
          if (reason?.status && reason?.status !== 404) {
            setError(reason?.message || "Failed to load products");
          }
          setFeaturedProducts([]);
        }

        // Handle categories response
        if (catRes.status === 'fulfilled') {
          const catData = catRes.value;
          const dynamicCategories = (catData?.data?.categories || catData?.categories || []).map((cat, i) => ({
            ...cat,
            icon: [
              HomeIcon, Lock, Cpu, Lightbulb,
              CircuitBoard, Camera, Wifi, Thermometer,
            ][i % 8],
            desc: cat.description || `Explore our ${cat.name} range`,
          }));
          setCategories(dynamicCategories);
        } else {
          console.error("[HomeWrapper] Failed to load categories:", catRes.reason);
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
        setError("Failed to sync store parameters. Please reload.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  useEffect(() => {
    const loadAppCounts = async () => {
      try {
        const res = await productService.getApplicationCounts();
        setApplicationCounts(res.data?.counts || null);
      } catch (err) {
        console.warn("Failed to load application counts:", err);
      } finally {
        setLoadingApps(false);
      }
    };
    loadAppCounts();
  }, [token]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Connection Issues
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* WhatsApp Support Button */}
      <a
        href="https://wa.me/919322475209?text=Hello%2C%20I%20need%20help%20with%20your%20automation%20products."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open WhatsApp support chat"
        className="fixed bottom-5 right-4 sm:bottom-8 sm:right-8 z-[60] group inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-emerald-400 hover:shadow-emerald-400/35 active:scale-95 sm:px-5"
      >
        <MessageCircle
          size={18}
          className="shrink-0 transition-transform duration-300 group-hover:rotate-6"
        />
        {/* <span className="whitespace-nowrap">Can I Help You?</span> */}
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
      <TrustHome/>

      {/* Trending Categories Carousel */}
      <HomeCategories categories={categories} />

      <WhyTeknode/>
      <HowWorks/>

      {/* Featured Products Grid */}
      <HomeProducts
        featuredProducts={featuredProducts}
        loading={loading}
        handleAddToCart={handleAddToCart}
      />
       <SmartHome/>
      <HomeScene/>
<HomeCounter/>
<HomeApp/>
      {/* Shop by Application */}
      {/* <HomeApplications
        applicationCounts={applicationCounts}
        loadingApps={loadingApps}
      /> */}

      {/* Customer Reviews */}
      <HomeReviews />
      <FaqHome/>
      <ReadyHome/>
    </div>
  );
}