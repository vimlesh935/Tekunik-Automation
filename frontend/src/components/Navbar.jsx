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
import SmartSearch from "../components/SmartSearch.jsx";

export default function Navbar() {
  const { isAuthenticated: token, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [smartSearchOpen, setSmartSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSearchIconClick = () => {
    setSmartSearchOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setQuery("");
    setSmartSearchOpen(false);
  };


  const handleSearchBlur = () => {
    if (!query.trim()) {
      setSearchExpanded(false);
    }
  };

  const handleSmartSearchClose = () => {
    setSmartSearchOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setSearchExpanded(false);
        setSmartSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const baseNavLinks = [
    { path: "/", label: "Home" },
    { path: "/shop", label: "Shop" },
    { path: "/about", label: "About Us" },
    { path: "/contact", label: "Contact Us" },
    { path: "/track-order", label: "Track Order" },
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
          {/* LEFT SECTION: Logo + Navigation Links */}
          <div className="nav-left flex items-center gap-6">
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

            {/* Premium Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {baseNavLinks.map((link) => (
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
          </div>

          {/* CENTER SECTION: Smart Search */}
          <div className="nav-center hidden lg:flex items-center justify-center flex-1 px-4">
            <div className="relative w-[170px]">
              <SmartSearch
                isOpen={smartSearchOpen}
                onClose={handleSmartSearchClose}
                query={query}
                onQueryChange={setQuery}
              />
              {!smartSearchOpen && (
                <button
                  onClick={handleSearchIconClick}
                  className="w-full h-9 rounded-full border border-slate-700/50 bg-slate-900/40 text-slate-400 hover:text-white hover:border-slate-600 flex items-center gap-2 pl-3 pr-3 transition-all duration-200 group"
                  type="button"
                >
                  <Search size={14} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-[11px] font-medium tracking-wide">Search...</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT SECTION: Auth Actions + Cart + Mobile Menu */}
          <div className="nav-right flex items-center gap-3.5">
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
                Login
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
              <div className="mb-4">
                <SmartSearch
                  isOpen={mobileOpen}
                  onClose={() => setMobileOpen(false)}
                  query={query}
                  onQueryChange={setQuery}
                />
                <form onSubmit={handleSearch} className="mt-3">
                  <div className="relative flex items-center">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products..."
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
              </div>

              {baseNavLinks.map((link) => (
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
