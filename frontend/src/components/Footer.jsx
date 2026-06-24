import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  Mail,
  Phone,
  MapPin,
  Shield,
  Settings,
  ArrowRight,
  Heart,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = {
  Product: [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/shop" },
    { label: "Cart", to: "/cart" },
  ],
  Account: [
    { label: "Login", to: "/login" },
    { label: "Register", to: "/register" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Forgot Password", to: "/forgot-password" },
  ],
};

// Framer Motion Orchestration Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 25 },
  },
};

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="relative mt-auto border-t border-slate-900 bg-slate-950 text-slate-400 overflow-hidden">
      {/* Decorative Elite Cyber Glow Lines */}
      <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-12 -right-20 w-80 h-80 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        {/* Main Grid Matrix */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16"
        >
          {/* Brand Panel & Corporate Bio */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-4 space-y-6"
          >
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                <Zap size={16} className="text-white fill-white" />
              </motion.div>
              <span className="text-xl font-black text-white tracking-tight">
                Tek<span className="text-indigo-400 bg-clip-text">Node</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Premium consumer electronics and hardware modules tailored for
              ultra high-performance ecosystems. Secure, scalable, and expertly
              engineered.
            </p>

            {/* Minimal Social / Ecosystem Trust Indicators */}
            <div className="flex items-center gap-2.5 pt-2">
              {[
                { Icon: Zap, label: "Core" },
                { Icon: Shield, label: "Vault" },
                { Icon: Settings, label: "Config" },
              ].map(({ Icon, label }, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -3, borderColor: "rgba(99,102,241,0.4)" }}
                  className="w-9 h-9 rounded-xl border border-slate-900 bg-slate-900/40 flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-colors duration-300 cursor-help"
                  title={label}
                >
                  <Icon size={14} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Structured Navigation Columns Mapping */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <motion.div
              variants={itemVariants}
              key={title}
              className="lg:col-span-2 space-y-5"
            >
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-200 bg-slate-900/60 w-fit px-2.5 py-1 rounded-md border border-slate-800/40">
                {title}
              </h4>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1.5 group"
                    >
                      <ArrowRight
                        size={12}
                        className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-indigo-400 flex-shrink-0"
                      />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Contact Support & Newsletter Suite */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-4 space-y-5"
          >
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-200 bg-slate-900/60 w-fit px-2.5 py-1 rounded-md border border-slate-800/40">
              Ecosystem Support
            </h4>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {[
                { Icon: Mail, text: "support@teknode.com" },
                { Icon: Phone, text: "+91 (555) 123-4567" },
                { Icon: MapPin, text: "Mumbai, Maharashtra" },
              ].map(({ Icon, text }, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-slate-400 hover:text-slate-300 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800 group-hover:border-indigo-500/20 transition-colors">
                    <Icon size={12} className="text-indigo-400" />
                  </div>
                  <span className="truncate">{text}</span>
                </li>
              ))}
            </ul>

            {/* Premium Mail Subscription Component */}
            <div className="pt-3 space-y-2">
              <p className="text-xs font-bold text-slate-500 tracking-wide">
                Subscribe to technical deployments
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-2 max-w-sm"
              >
                <input
                  type="email"
                  placeholder="Enter administrator email..."
                  className="flex-1 min-w-0 rounded-xl border border-slate-900 bg-slate-900/30 px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500/40 focus:bg-slate-900/80 focus:outline-none transition-all duration-300"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all duration-300 shadow-md shadow-indigo-600/10 active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar: System Flags, Encryption and Attribution */}
        <div className="pt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs font-medium text-slate-500 text-center sm:text-left">
            <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-900 px-3 py-1 rounded-full text-emerald-400/90 shadow-sm">
              <Shield size={12} className="text-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-bold">
                SSL 256-Bit Encrypted
              </span>
            </div>
            <span className="hidden sm:inline text-slate-800">|</span>
            <span>
              &copy; {new Date().getFullYear()} Tek Node. All operational rights
              reserved.
            </span>
          </div>

          <div className="flex items-center gap-5 flex-shrink-0">
            {/* Standardized Branding Attribution */}
            <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
              Designed by{" "}
              <span className="font-extrabold text-slate-400 bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
                Tek Node
              </span>
            </span>

            {/* Micro-Animated Admin Action Trigger */}
            <button
              onClick={() => navigate("/admin-login")}
              title="Secure Admin Access"
              className="group flex items-center gap-1.5 rounded-xl border border-slate-900 bg-slate-900/20 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:border-amber-500/20 hover:text-amber-400 transition-all duration-300"
            >
              <Settings
                size={11}
                className="group-hover:rotate-90 transition-transform duration-500 text-slate-600 group-hover:text-amber-400"
              />
              <span>Admin Portal</span>
              <ArrowUpRight
                size={10}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-amber-500/70"
              />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
