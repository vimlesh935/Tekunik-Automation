import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  UserCircle,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Zap,
  ChevronDown,
  ShoppingCart,
  Package,
  ArrowUpRight,
  Cpu,
  Store,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { productService } from "../services/api";
import SafeImage from "../components/SafeImage.jsx";

export default function Navbar() {
  const { isAuthenticated: token, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSuggestions([]); // Clear suggestions on route changes
  }, [location.pathname]);

  // Live Query Search Suggestion Effect
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await productService.getAllProducts(
          1,
          5,
          query.trim(),
          "",
        );
        if (response?.data?.products) {
          setSuggestions(response.data.products);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.warn("Search suggestion lookup failed:", error);
        setSuggestions([]);
      }
    }, 300); // Debounce to prevent server flooding

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
    setSuggestions([]);
    setSearchExpanded(false);
  };

  const handleSearchIconClick = () => {
    setSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    if (!query.trim()) {
      setSearchExpanded(false);
    }
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/shop", label: "Shop" },
    { path: "/about", label: "About Us" },
    { path: "/contact", label: "Contact Us" },
    { path: "/track-order", label: "Track Order" },
    ...(token ? [{ path: "/dashboard", label: "Dashboard" }] : []),
  ];

  const { itemCount } = useCart();
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (itemCount > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 300);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 border-b ${
        scrolled
          ? "bg-slate-950/75 border-indigo-500/20 backdrop-blur-xl shadow-[0_4px_40px_rgba(0,0,0,0.7)] h-16"
          : "bg-slate-950 border-slate-900/60 h-20"
      } flex items-center`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Brand Frame */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <motion.div
              whileHover={{ rotate: 15, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              <Zap size={16} className="text-white fill-white" />
            </motion.div>
            <span className="text-xl font-black text-white tracking-tight">
              Tek<span className="text-indigo-400 bg-clip-text">Node</span>
            </span>
          </Link>

          {/* Search Box Component with Contextual Suggestion Node Dropdown */}
          <div className="hidden md:flex items-center relative z-50">
            <AnimatePresence>
              {searchExpanded ? (
                <motion.form
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  onSubmit={handleSearch}
                  className="flex items-center overflow-hidden"
                  onBlur={handleSearchBlur}
                >
                  <div className="relative flex items-center w-full">
                    <div className="absolute left-3 pointer-events-none text-slate-500">
                      <Search size={14} />
                    </div>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full rounded-l-xl border border-slate-900 bg-slate-900/40 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/30 focus:bg-slate-900/80 transition-all"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white h-[34px] px-4 rounded-r-xl text-xs font-bold tracking-wider uppercase transition-all border-y border-r border-indigo-600"
                    >
                      Search
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleSearchIconClick}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all"
                  type="button"
                >
                  <Search size={18} />
                </motion.button>
              )}
            </AnimatePresence>

              {/* Suggestions Overlay Array */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSuggestions([])} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 right-0 mt-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-2 z-50 max-h-[380px] overflow-y-auto backdrop-blur-xl divide-y divide-slate-800/50"
                    >
                      <div className="px-4 py-1.5 bg-slate-950/40 mb-1">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                          Matched Architecture Nodules
                        </p>
                      </div>
                      {suggestions.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            navigate(`/product/${product.id}`);
                            setQuery("");
                            setSuggestions([]);
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors duration-150 cursor-pointer text-left group"
                        >
                          <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:border-slate-700 transition-colors">
                            {product.image_url ? (
                              <SafeImage
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-contain p-1"
                                fallback={<Cpu size={16} className="text-slate-700" />}
                              />
                            ) : (
                              <Cpu size={16} className="text-slate-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest text-[9px] block mb-0.5">
                              {product.category_name || "IoT Component"}
                            </p>
                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-white truncate transition-colors">
                              {product.name}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          {/* Premium Desktop Navigation Bar Layout */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 text-sm font-bold tracking-wide transition-colors duration-300 rounded-lg ${
                  isActive(link.path)
                    ? "text-indigo-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="relative z-10">{link.label}</span>
                {isActive(link.path) && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-indigo-500/5 rounded-lg border border-indigo-500/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  >
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                  </motion.span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Action Stack */}
          <div className="flex items-center gap-3.5">
            {/* Authenticated User Floating Dropdown Menu */}
            {token && (
              <div className="relative">
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-slate-900 bg-slate-900/30 text-sm font-bold text-slate-300 hover:text-white hover:border-slate-800 transition-all duration-300"
                >
                  <UserCircle size={17} className="text-indigo-400" />
                  <span className="hidden sm:inline text-xs tracking-wide">
                    Account
                  </span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-300 text-slate-500 ${showUserMenu ? "rotate-180 text-indigo-400" : ""}`}
                  />
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-2 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/30 mb-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            Authorized Access
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-rose-400 hover:bg-rose-500/10 transition-all duration-200 text-left"
                        >
                          <LogOut size={14} />
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Guest Entry Access */}
            {!token && (
              <Link
                to="/login"
                className="text-xs font-bold tracking-wide uppercase text-slate-400 hover:text-indigo-400 transition-colors px-2.5 py-2"
              >
                Sign In
              </Link>
            )}

            {/* Shopping Cart UI Microframe */}
            <motion.div animate={cartBounce ? { scale: [1, 1.08, 1] } : {}}>
              <Link
                to="/cart"
                className={`relative inline-flex items-center gap-2 text-slate-300 hover:text-white font-bold transition-all duration-300 h-9 px-3.5 rounded-xl border ${
                  itemCount > 0
                    ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-400"
                    : "border-slate-900 bg-slate-900/30 hover:border-slate-800"
                }`}
                title="View cart"
              >
                <div className="relative">
                  <ShoppingCart
                    size={16}
                    className={
                      itemCount > 0 ? "text-indigo-400" : "text-slate-400"
                    }
                  />
                  {itemCount > 0 && (
                    <span className="absolute -right-3 -top-1.5 inline-flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-indigo-500 text-[8px] font-black text-white px-1 shadow-[0_0_10px_rgba(99,102,241,0.6)]">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline tracking-wide text-xs">
                  Cart
                </span>
              </Link>
            </motion.div>

            {/* Mobile Navigation Panel Trigger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white transition-colors"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Animated Dropdown Grid Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden border-t border-slate-900 bg-slate-950/95 backdrop-blur-xl shadow-2xl absolute w-full left-0 top-full overflow-hidden"
          >
            <div className="px-4 py-5 space-y-2">
              {/* Mobile Input Search Integration */}
              <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative flex items-center">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search engineering frameworks..."
                      className="w-full rounded-l-xl border border-slate-900 bg-slate-900 py-2 pl-4 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/40"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 rounded-r-xl h-[38px] font-bold text-xs tracking-wider uppercase"
                    >
                      Search
                    </button>
                  </div>
                </form>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive(link.path)
                      ? "bg-indigo-600 text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)]"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                to="/cart"
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive("/cart")
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingCart size={15} />
                  My Basket
                </span>
                {itemCount > 0 && (
                  <span
                    className={`inline-flex h-4 min-w-[1.125rem] items-center justify-center rounded-full px-1.5 text-[8px] font-black ${isActive("/cart") ? "bg-slate-950 text-white" : "bg-indigo-500 text-white"}`}
                  >
                    {itemCount}
                  </span>
                )}
              </Link>

              {token ? (
                <div className="pt-3 mt-3 border-t border-slate-900 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 text-left"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white mt-4 shadow-lg shadow-indigo-600/10 tracking-wider uppercase"
                >
                  Initialize Access
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
