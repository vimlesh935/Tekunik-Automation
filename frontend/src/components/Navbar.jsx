// old code 

// import React, { useState, useEffect } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import {
//   Search, UserCircle, LogOut, LayoutDashboard,
//   Menu, X, Zap, ChevronDown, Sun, Moon, ShoppingCart,
//   Package,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { useTheme } from "../context/ThemeContext.jsx";
// import { useCart } from "../context/CartContext.jsx";

// export default function Navbar({ token, onLogout }) {
//   const [query, setQuery] = useState("");
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const [cartBounce, setCartBounce] = useState(false);
//   const { theme, toggleTheme } = useTheme();
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   useEffect(() => { setMobileOpen(false); }, [location.pathname]);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (!query.trim()) return;
//     navigate(`/search?q=${encodeURIComponent(query.trim())}`);
//     setQuery("");
//   };

//   const navLinks = [
//     { path: "/", label: "Home" },
//     { path: "/shop", label: "Shop" },
//     { path: "/track-order", label: "Track Order" },
//   ];
  
//   if (token) {
//     navLinks.push({ path: "/orders", label: "My Orders" });
//   }

//   const { itemCount } = useCart();
//   const isActive = (path) => location.pathname === path;

//   // Bounce animation when item count changes
//   useEffect(() => {
//     if (itemCount > 0) {
//       setCartBounce(true);
//       const timer = setTimeout(() => setCartBounce(false), 300);
//       return () => clearTimeout(timer);
//     }
//   }, [itemCount]);

//   const handleLogout = () => {
//     setShowUserMenu(false);
//     onLogout();
//     navigate("/");
//   };

//   return (
//     <>
//       <header
//         className={`sticky top-0 z-50 transition-all duration-300 ${
//           scrolled
//             ? "bg-surface border-b border-surface-border shadow-theme"
//             : "bg-surface border-b border-surface-border"
//         }`}
//       >
//         <div className="w-full mx-auto px-2 sm:px-6 ">
//           <div className="flex items-center justify-between h-16 gap-4">

//             {/* Logo */}
//             <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
//               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow">
//                 <Zap size={16} className="text-black" />
//               </div>
//               <span className="text-lg font-bold tracking-tight">
//                 Teku<span className="text-cyan-400">nik</span>
//               </span>
//             </Link>

//             {/* Desktop Nav */}
//             <nav className="hidden md:flex items-center gap-1">
//               {navLinks.map((link) => (
//                 <Link
//                   key={link.path}
//                   to={link.path}
//                   className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
//                     isActive(link.path)
//                       ? "text-cyan-400 bg-cyan-500/10"
//                       : "text-gray-400 hover:text-white hover:bg-white/5"
//                   }`}
//                 >
//                   {link.label}
//                   {isActive(link.path) && (
//                     <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full" />
//                   )}
//                 </Link>
//               ))}
//             </nav>

//             {/* Search */}
//             <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden sm:block">
//               <div className="relative">
//                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
//                 <input
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   placeholder="Search products..."
//                   className="w-full rounded-xl border border-surface-border bg-surface-soft py-2.5 pl-10 pr-4 text-sm text-primary placeholder:text-muted focus:border-cyan-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
//                 />
//               </div>
//             </form>

//             {/* Right Actions */}
//             <div className="flex items-center gap-2">

//               {/* Account Dropdown - only for authenticated users */}
//               {token && (
//                 <div className="relative">
//                   <button
//                     onClick={() => setShowUserMenu(!showUserMenu)}
//                     onMouseEnter={() => setShowUserMenu(true)}
//                     className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/8 px-3.5 py-2 text-sm text-cyan-300 hover:bg-cyan-500/15 hover:border-cyan-500/40 transition-all"
//                   >
//                     <UserCircle size={16} />
//                     <span className="hidden sm:inline font-medium">Account</span>
//                     <ChevronDown size={14} className={`transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
//                   </button>
                  
//                   {showUserMenu && (
//                     <>
//                       <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
//                       <div className="absolute right-0 mt-2 w-52 rounded-2xl glass border border-surface-border shadow-2xl shadow-black/60 py-2 z-50 animate-slide-down"
//                         onMouseLeave={() => setShowUserMenu(false)}>
//                         <div className="px-4 py-2 border-b border-surface-border mb-1">
//                           <p className="text-xs text-gray-500 uppercase tracking-wider">My Account</p>
//                         </div>
//                         <Link
//                           to="/dashboard"
//                           onClick={() => setShowUserMenu(false)}
//                           className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
//                         >
//                           <LayoutDashboard size={15} className="text-cyan-400" />
//                           Dashboard
//                         </Link>
//                         <Link
//                           to="/orders"
//                           onClick={() => setShowUserMenu(false)}
//                           className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
//                         >
//                           <Package size={15} className="text-cyan-400" />
//                           My Orders
//                         </Link>
//                         <div className="border-t border-white/[0.06] my-1" />
//                         <button
//                           onClick={handleLogout}
//                           className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/8 transition"
//                         >
//                           <LogOut size={15} />
//                           Sign Out
//                         </button>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               )}

//               {/* Guest Login link */}
//               {!token && (
//                 <Link
//                   to="/login"
//                   className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
//                 >
//                   Login
//                 </Link>
//               )}

//               {/* Premium Cart Button */}
//               <Link
//                 to="/cart"
//                 className={`relative inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/5 px-3.5 py-2 text-sm text-gray-200 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-200 group ${cartBounce ? 'animate-count-up' : ''}`}
//                 title="View cart"
//               >
//                 <div className="relative">
//                   <ShoppingCart size={18} className="group-hover:text-cyan-400 transition-colors duration-200" />
//                   {itemCount > 0 && (
//                     <span className="absolute -right-2.5 -top-2.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-[9px] font-bold text-black px-1 shadow-lg shadow-cyan-500/30 animate-count-up">
//                       {itemCount > 99 ? '99+' : itemCount}
//                     </span>
//                   )}
//                 </div>
//                 <span className="hidden sm:inline group-hover:text-cyan-400 transition-colors duration-200">
//                   Cart
//                 </span>
//               </Link>

//               {/* Animated Theme Toggle - shown for all users */}
//               {/* <button
//                 type="button"
//                 onClick={toggleTheme}
//                 className="hidden sm:flex items-center w-[82px] h-[40px] rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-1 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/30"
//                 title="Toggle theme"
//               >
//                 <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10" />
//                 <motion.div
//                   layout
//                   transition={{
//                     type: "spring",
//                     stiffness: 500,
//                     damping: 30,
//                   }}
//                   className={`absolute top-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
//                     theme === "dark"
//                       ? "left-1 bg-gradient-to-br from-slate-700 to-slate-900 text-yellow-300"
//                       : "left-[42px] bg-gradient-to-br from-cyan-400 to-blue-600 text-white"
//                   }`}
//                 >
//                   {theme === "dark" ? (
//                     <Moon size={16} />
//                   ) : (
//                     <Sun size={16} />
//                   )}
//                 </motion.div>
//                 <div className="w-full flex items-center justify-between px-2 text-[11px] font-semibold relative z-10">
//                   <span className={`${theme === "dark" ? "text-transparent" : "text-gray-400"}`}>
//                     🌙
//                   </span>
//                   <span className={`${theme === "dark" ? "text-gray-400" : "text-transparent"}`}>
//                     ☀️
//                   </span>
//                 </div>
//               </button> */}

//               {/* Mobile menu toggle */}
//               <button
//                 onClick={() => setMobileOpen(!mobileOpen)}
//                 className="md:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
//               >
//                 {mobileOpen ? <X size={18} /> : <Menu size={18} />}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {mobileOpen && (
//           <div className="md:hidden border-t border-surface-border bg-surface backdrop-blur-2xl animate-slide-down">
//             <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

//               {/* Mobile search */}
//               <form onSubmit={handleSearch} className="mb-3">
//                 <div className="relative">
//                   <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
//                   <input
//                     value={query}
//                     onChange={(e) => setQuery(e.target.value)}
//                     placeholder="Search products..."
//                     className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none transition"
//                   />
//                 </div>
//               </form>

//               {navLinks.map((link) => (
//                 <Link
//                   key={link.path}
//                   to={link.path}
//                   className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition ${
//                     isActive(link.path)
//                       ? "bg-cyan-500/10 text-cyan-400"
//                       : "text-gray-400 hover:bg-white/5 hover:text-white"
//                   }`}
//                 >
//                   {link.label}
//                 </Link>
//               ))}

//               <Link
//                 to="/cart"
//                 className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
//                   isActive("/cart")
//                     ? "bg-cyan-500/10 text-cyan-400"
//                     : "text-gray-400 hover:bg-white/5 hover:text-white"
//                 }`}
//               >
//                 <span className="flex items-center gap-2">
//                   <ShoppingCart size={16} />
//                   Cart
//                 </span>
//                 {itemCount > 0 && (
//                   <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-2 text-[10px] font-semibold text-black">
//                     {itemCount}
//                   </span>
//                 )}
//               </Link>

//               {/* Mobile auth links */}
//               {token ? (
//                 <>
//                   <Link to="/dashboard"
//                     className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition">
//                     <LayoutDashboard size={16} className="text-cyan-400" /> Dashboard
//                   </Link>
//                   <Link to="/orders"
//                     className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition">
//                     <Package size={16} className="text-cyan-400" /> My Orders
//                   </Link>
//                   <button onClick={handleLogout}
//                     className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/8 transition">
//                     <LogOut size={16} /> Sign Out
//                   </button>
//                 </>
//               ) : (
//                 <Link to="/login"
//                   className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-black mt-2">
//                   Login / Register
//                 </Link>
//               )}

//               {/* Mobile Theme Toggle */}
//               <button
//                 type="button"
//                 onClick={toggleTheme}
//                 className="w-full flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/5 px-4 py-3 text-sm font-medium text-gray-200 hover:bg-white/10 transition"
//               >
//                 <span className="flex items-center gap-2">
//                   {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
//                   {theme === "dark" ? "Dark Mode" : "Light Mode"}
//                 </span>
//                 <motion.div
//                   animate={{ x: theme === "dark" ? 0 : 18 }}
//                   transition={{ type: "spring", stiffness: 500, damping: 30 }}
//                   className="w-5 h-5 rounded-full bg-cyan-400"
//                 />
//               </button>
//             </div>
//           </div>
//         )}
//       </header>
//     </>
//   );
// }

// irshad codde 
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search, UserCircle, LogOut, LayoutDashboard,
  Menu, X, Zap, ChevronDown, Sun, Moon, ShoppingCart,
  Package, Heart
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar({ token, onLogout }) {
  const [query, setQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/shop", label: "Shop" },
    { path: "/track-order", label: "Track Order" },
  ];
  
  if (token) {
    navLinks.push({ path: "/orders", label: "My Orders" });
  }

  const { itemCount } = useCart();
  const isActive = (path) => location.pathname === path;

  // Bounce animation when item count changes
  useEffect(() => {
    if (itemCount > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 300);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
    navigate("/");
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-indigo-900 shadow-md border-b border-indigo-950"
            : "bg-indigo-900 border-b border-indigo-800"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo - Corporate Tech Brand Style */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 rounded bg-amber-400 flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <Zap size={16} className="text-indigo-950 fill-indigo-950" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Teku<span className="text-amber-400">nik</span>
              </span>
            </Link>

            {/* Search Input Bar - High Contrast Indian E-Commerce Framework */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none text-slate-400">
                  <Search size={16} />
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for premium products, brands and more"
                  className="w-full rounded-l-md border-0 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 transition-all"
                />
                <button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 h-[36px] px-5 rounded-r-md text-sm font-bold transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3 py-2 text-sm font-bold transition-all duration-200 ${
                    isActive(link.path)
                      ? "text-amber-400"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <span className="absolute bottom-[-18px] left-0 right-0 h-1 bg-amber-400 rounded-t-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Side Conversions Menu */}
            <div className="flex items-center gap-4">

              {/* Account Dropdown - Premium Minimal Plate */}
              {token && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    onMouseEnter={() => setShowUserMenu(true)}
                    className="flex items-center gap-1.5 py-2 text-sm font-bold text-white hover:text-amber-400 transition-all"
                  >
                    <UserCircle size={18} className="text-white group-hover:text-amber-400" />
                    <span className="hidden sm:inline">My Account</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
                  </button>
                  
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 overflow-hidden"
                        onMouseLeave={() => setShowUserMenu(false)}>
                        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 mb-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Welcome Back</p>
                        </div>
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition"
                        >
                          <LayoutDashboard size={15} className="text-slate-400" />
                          User Dashboard
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition"
                        >
                          <Package size={15} className="text-slate-400" />
                          Orders & Tracking
                        </Link>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-bold transition"
                        >
                          <LogOut size={15} />
                          Logout Account
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Guest Login link */}
              {!token && (
                <Link
                  to="/login"
                  className="text-sm font-bold text-white hover:text-amber-400 transition"
                >
                  Sign In
                </Link>
              )}

              {/* High-Impact Retail Cart Link */}
              <Link
                to="/cart"
                className={`relative inline-flex items-center gap-2 text-white hover:text-amber-400 font-bold text-sm transition-all duration-200 group ${cartBounce ? 'scale-105' : ''}`}
                title="View cart"
              >
                <div className="relative py-1">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <span className="absolute -right-2.5 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950 px-1 shadow-sm border border-indigo-900">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">
                  Cart
                </span>
              </Link>

              {/* Mobile menu layout toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 text-white hover:text-amber-400 transition"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Interface Panel */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-indigo-950 bg-indigo-900 shadow-inner">
            <div className="px-4 py-4 space-y-2">

              {/* Mobile layout search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative flex items-center">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search electronics & hardware..."
                    className="w-full rounded-l-md border-0 bg-white py-2 pl-4 pr-4 text-sm text-slate-900 focus:outline-none"
                  />
                  <button type="submit" className="bg-amber-500 text-slate-950 px-4 rounded-r-md h-[36px] font-bold text-xs">
                    Search
                  </button>
                </div>
              </form>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-bold transition ${
                    isActive(link.path)
                      ? "bg-amber-500 text-slate-950"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                to="/cart"
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-bold transition ${
                  isActive("/cart")
                    ? "bg-amber-500 text-slate-950"
                    : "text-white hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart size={16} />
                  My Basket
                </span>
                {itemCount > 0 && (
                  <span className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-2 text-[10px] font-black ${isActive("/cart") ? 'bg-indigo-950 text-white' : 'bg-amber-500 text-slate-950'}`}>
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile auth link layout variants */}
              {token ? (
                <div className="pt-2 mt-2 border-t border-indigo-800 space-y-1">
                  <Link to="/dashboard"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-bold text-white/90 hover:bg-white/5">
                    <img src="https://cdn-icons-png.flaticon.com/128/149/149071.png" className="w-4 h-4 invert" alt="" /> Dashboard Portal
                  </Link>
                  <Link to="/orders"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-bold text-white/90 hover:bg-white/5">
                    <Package size={16} /> Track My Orders
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-bold text-rose-600 hover:bg-rose-50 text-left">
                    <LogOut size={16} /> Logout Session
                  </button>
                </div>
              ) : (
                <Link to="/login"
                  className="flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-bold bg-amber-400 text-slate-950 mt-4 shadow-md">
                  Login / Join Tekunik
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}